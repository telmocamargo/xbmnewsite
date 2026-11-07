import sanitizeHtml from 'sanitize-html'
import { RichText } from '@payloadcms/richtext-lexical/react'

const clean = (html: string) =>
  sanitizeHtml(html.replace(/\[\/?[a-z_]+[^\]]*\]/gi, ''), {
    allowedTags: ['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'img', 'strong', 'b', 'em', 'i', 'br', 'blockquote', 'figure', 'figcaption', 'iframe', 'hr', 'span'],
    allowedAttributes: { a: ['href', 'rel', 'target'], img: ['src', 'alt', 'width', 'height'], iframe: ['src', 'allowfullscreen'] },
    allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'],
    transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'noopener' }), h1: 'h2' },
  })

export function Body({ content, legacyHtml }: { content?: any; legacyHtml?: string | null }) {
  if (content?.root?.children?.length) return <RichText data={content} />
  if (legacyHtml) return <div dangerouslySetInnerHTML={{ __html: clean(legacyHtml) }} />
  return null
}
