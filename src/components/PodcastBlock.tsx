import Link from 'next/link'
import { EpisodeCard, Cover } from './Cards'
import { latestEpisodes, CHANNEL_URL, fmtDuration, fmtDate } from '../lib/data'

/** Bloco "Gamemania Podcast" da home: 2 destaques, 3 episódios em lista e o link do canal. */
export async function PodcastBlock() {
  let big = (await latestEpisodes({ limit: 2, featured: true })).docs
  if (big.length < 2) {
    const more = await latestEpisodes({ limit: 2 - big.length, kind: 'podcast', exceptIds: big.map((e) => e.id) })
    big = [...big, ...more.docs]
  }
  if (!big.length) return null
  const side = (await latestEpisodes({ limit: 3, exceptIds: big.map((e) => e.id) })).docs

  return (
    <section className="pod-band" aria-labelledby="pod-title">
      <div className="wrap">
        <div className="pod-head">
          <h2 id="pod-title">
            <svg className="ic" aria-hidden="true"><use href="#i-mic" /></svg>
            Gamemania Podcast
          </h2>
          <Link href="/podcast">Ver todos os episódios <span>→</span></Link>
        </div>
        <div className="pod-grid">
          {big.map((e) => (
            <EpisodeCard key={e.id} ep={e} big />
          ))}
          <div className="pod-side">
            {side.map((e) => (
              <Link key={e.id} className="pod-mini" href={`/podcast/${e.slug}`}>
                <div className="pod-mini-thumb">
                  <Cover media={e.cover} title={e.title} size="thumb" />
                  {e.duration ? <span className="ep-dur">{fmtDuration(e.duration)}</span> : null}
                </div>
                <div>
                  <span className="ep-badge inline">{e.kind === 'video' ? 'Vídeo' : 'Podcast'}</span>
                  <b>{e.title}</b>
                  <span className="meta">{fmtDate(e.publishedAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <a className="pod-cta" href={CHANNEL_URL} target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3z" /></svg>
          Acesse nosso canal no YouTube <span>→</span>
        </a>
      </div>
    </section>
  )
}
