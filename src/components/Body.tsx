import sanitizeHtml from 'sanitize-html'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { YouTubeEmbed } from './YouTubeEmbed'
import { parseYouTube } from '../lib/youtube'

const clean = (html: string) =>
  sanitizeHtml(html.replace(/\[\/?[a-z_]+[^\]]*\]/gi, ''), {
    allowedTags: ['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'img', 'strong', 'b', 'em', 'i', 'br', 'blockquote', 'figure', 'figcaption', 'iframe', 'hr', 'span'],
    allowedAttributes: { a: ['href', 'rel', 'target'], img: ['src', 'alt', 'width', 'height'], iframe: ['src', 'allowfullscreen', 'height', 'width', 'allow', 'loading'] },
    allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com', 'open.spotify.com', 'podcasters.spotify.com'],
    transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'noopener' }), h1: 'h2' },
  })

type Video = { id: string; start?: number; caption?: string }

/** Reconhece um vídeo: o bloco "Vídeo do YouTube" ou um parágrafo que contém só um link do YouTube (como no WordPress). */
function videoOf(node: any): Video | null {
  if (node?.type === 'block' && node.fields?.blockType === 'youtube') {
    const v = parseYouTube(node.fields.url)
    return v ? { ...v, caption: node.fields.caption || undefined } : null
  }
  if (node?.type === 'paragraph') {
    const kids = (node.children || []).filter((k: any) => !(k.type === 'text' && !String(k.text || '').trim()) && k.type !== 'linebreak')
    if (kids.length !== 1) return null
    const k = kids[0]
    const url = k.type === 'link' || k.type === 'autolink' ? k.fields?.url : k.type === 'text' ? String(k.text).trim() : null
    return parseYouTube(url)
  }
  return null
}

export function Body({ content, legacyHtml }: { content?: any; legacyHtml?: string | null }) {
  const root = content?.root
  if (root?.children?.length) {
    // Divide o texto nos vídeos, para cada parte do texto continuar sendo desenhada pelo editor.
    const parts: React.ReactNode[] = []
    let chunk: any[] = []
    const flush = (key: string) => {
      if (chunk.length) parts.push(<RichText key={key} data={{ ...content, root: { ...root, children: chunk } }} />)
      chunk = []
    }
    root.children.forEach((node: any, i: number) => {
      const v = videoOf(node)
      if (v) {
        flush(`t${i}`)
        parts.push(<YouTubeEmbed key={`v${i}`} id={v.id} start={v.start} caption={v.caption} />)
      } else chunk.push(node)
    })
    flush('tend')
    return <>{parts}</>
  }
  if (legacyHtml) return <div dangerouslySetInnerHTML={{ __html: clean(legacyHtml) }} />
  return null
}
