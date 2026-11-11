import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Header, Footer } from '../../../../components/Chrome'
import { EpisodeCard } from '../../../../components/Cards'
import { YouTubeEmbed } from '../../../../components/YouTubeEmbed'
import { Linkify } from '../../../../components/Linkify'
import { findEpisode, latestEpisodes, mediaUrl, fmtDate, fmtDuration, SITE } from '../../../../lib/data'

export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ slug: string }> }

const plain = (s?: string | null) => (s || '').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim()

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ep = await findEpisode((await params).slug)
  if (!ep) return {}
  const img = mediaUrl(ep.cover, 'hero')
  const desc = plain(ep.description).slice(0, 160) || undefined
  return {
    title: ep.title,
    description: desc,
    alternates: { canonical: `/podcast/${ep.slug}` },
    openGraph: { type: 'article', title: ep.title, description: desc, publishedTime: ep.publishedAt ?? undefined, images: img ? [{ url: img }] : undefined },
    twitter: { card: 'summary_large_image' },
  }
}

const iso = (sec: number) => `PT${Math.floor(sec / 3600)}H${Math.floor((sec % 3600) / 60)}M${sec % 60}S`

export default async function Episodio({ params }: Props) {
  const ep = await findEpisode((await params).slug)
  if (!ep) notFound()
  const more = (await latestEpisodes({ limit: 4, kind: ep.kind as 'podcast' | 'video', exceptIds: [ep.id] })).docs.slice(0, 3)
  const img = mediaUrl(ep.cover, 'hero')
  const abs = (u: string | null) => (u ? (u.startsWith('http') ? u : `${SITE()}${u}`) : undefined)
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: ep.title,
    description: plain(ep.description).slice(0, 300) || ep.title,
    thumbnailUrl: abs(img) ? [abs(img)] : [`https://i.ytimg.com/vi/${ep.youtubeId}/hqdefault.jpg`],
    uploadDate: ep.publishedAt,
    embedUrl: `https://www.youtube.com/embed/${ep.youtubeId}`,
    ...(ep.duration ? { duration: iso(ep.duration) } : {}),
    publisher: { '@type': 'Organization', name: 'Xboxmania' },
  }

  return (
    <>
      <Header active="podcast" />
      <main id="conteudo" className="wrap">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
        <div className="crumb">
          <Link href="/">Início</Link> / <Link href="/podcast">Podcast</Link> / {ep.title}
        </div>
        <article className="ep-page">
          <div className="tag">{ep.kind === 'video' ? 'Vídeo' : 'Podcast'}{ep.episodeNumber ? ` · Episódio ${ep.episodeNumber}` : ''}</div>
          <h1>{ep.title}</h1>
          <div className="meta">
            {fmtDate(ep.publishedAt)}
            {ep.duration ? ` · ${fmtDuration(ep.duration)}` : ''}
          </div>
          <YouTubeEmbed id={ep.youtubeId} caption={ep.title} />
          <div className="ep-links">
            <a className="btn" href={`https://www.youtube.com/watch?v=${ep.youtubeId}`} target="_blank" rel="noopener">Assistir no YouTube</a>
            {ep.spotifyUrl ? <a className="btn ghost-dark" href={ep.spotifyUrl} target="_blank" rel="noopener">Ouvir no Spotify</a> : null}
          </div>
          {ep.description ? (
            <div className="prose ep-desc">
              <Linkify text={ep.description} />
            </div>
          ) : null}
        </article>
        {more.length ? (
          <section style={{ marginTop: 34 }}>
            <div className="sec-title"><h2>Mais episódios</h2><Link href="/podcast">Ver todos <span>→</span></Link></div>
            <div className="eps">
              {more.map((e) => <EpisodeCard key={e.id} ep={e} />)}
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </>
  )
}
