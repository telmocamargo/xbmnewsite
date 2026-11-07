import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { Header, Footer, AdSlot } from '../../../../components/Chrome'
import { Cover, NewsItem } from '../../../../components/Cards'
import { Body } from '../../../../components/Body'
import { SECTIONS, SITE, isSection, findBySlug, latestPosts, postPath, reviewPath, mediaUrl, fmtDate, fmtScore, scoreLabel, authorOf } from '../../../../lib/data'

export const revalidate = 300
type Props = { params: Promise<{ section: string; slug: string }> }

const desc = (d: any) => (d.seo?.metaDescription || d.excerpt || d.dek || '').slice(0, 170)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section, slug } = await params
  const hit = isSection(section) ? await findBySlug(slug) : null
  if (!hit) return {}
  const d: any = hit.doc
  const path = hit.type === 'post' ? postPath(d) : reviewPath(d)
  const img = mediaUrl(d.heroImage, 'hero')
  return {
    title: d.seo?.metaTitle || d.title,
    description: desc(d) || undefined,
    alternates: { canonical: path },
    openGraph: { type: 'article', title: d.seo?.metaTitle || d.title, description: desc(d) || undefined, publishedTime: d.publishedAt, images: img ? [{ url: img }] : undefined },
    twitter: { card: 'summary_large_image' },
  }
}

export default async function Detail({ params }: Props) {
  const { section, slug } = await params
  if (!isSection(section)) notFound()
  const hit = await findBySlug(slug)
  if (!hit) notFound()
  const d: any = hit.doc
  const canonical = hit.type === 'post' ? postPath(d) : reviewPath(d)
  if (canonical !== `/${section}/${slug}`) permanentRedirect(canonical)

  const img = mediaUrl(d.heroImage, 'hero')
  const author = authorOf(d)
  const ld =
    hit.type === 'review'
      ? {
          '@context': 'https://schema.org',
          '@type': 'Review',
          name: d.title,
          datePublished: d.publishedAt,
          author: { '@type': 'Person', name: author },
          publisher: { '@type': 'Organization', name: 'Xboxmania' },
          itemReviewed: { '@type': 'VideoGame', name: (typeof d.game === 'object' && d.game?.title) || d.title },
          ...(d.score != null ? { reviewRating: { '@type': 'Rating', ratingValue: d.score, bestRating: 10, worstRating: 0 } } : {}),
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: d.title,
          datePublished: d.publishedAt,
          dateModified: d.updatedAt,
          author: { '@type': 'Person', name: author },
          publisher: { '@type': 'Organization', name: 'Xboxmania', logo: { '@type': 'ImageObject', url: `${SITE()}/brand/icon.svg` } },
          ...(img ? { image: [img.startsWith('http') ? img : `${SITE()}${img}`] } : {}),
        }

  const related = hit.type === 'post' ? (await latestPosts({ limit: 4, kinds: SECTIONS[section as 'noticias'].kinds, exceptIds: [d.id] })).docs.slice(0, 3) : []
  const s = d.subscores || {}
  const bars: [string, number | null | undefined][] = [['Jogabilidade', s.gameplay], ['Visual', s.visual], ['Som', s.sound], ['Desempenho', s.performance]]

  return (
    <>
      <Header active={section} />
      <main id="conteudo" className="wrap">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
        <div className="crumb">
          <Link href="/">Início</Link> / <Link href={`/${section}`}>{SECTIONS[section].label}</Link> / {d.title}
        </div>

        <div className={hit.type === 'review' ? 'a-head' : undefined} style={hit.type === 'review' ? undefined : { paddingTop: 10 }}>
          <div>
            <div className="tag">
              {hit.type === 'review' ? `Análise${d.platformTested ? ' · ' + d.platformTested : ''}` : SECTIONS[section].label}
              {d.source?.rumor ? ' · rumor' : ''}
            </div>
            <h1 style={{ fontSize: 'clamp(34px,6vw,54px)', fontWeight: 800, margin: '6px 0 10px' }}>{d.title}</h1>
            {(d.dek || (hit.type === 'post' && d.excerpt && !d.source?.url)) ? <p className="dek">{d.dek || d.excerpt}</p> : null}
            <div className="by">
              <div className="av">{author[0]}</div>
              <div>
                Por <b style={{ color: 'var(--fg)' }}>{author}</b> · {fmtDate(d.publishedAt)}
              </div>
            </div>
          </div>
          {hit.type === 'review' && d.score != null ? (
            <div className="verdict">
              <div className="n">
                {fmtScore(d.score)}
                <small>/10</small>
              </div>
              <b style={{ fontFamily: 'var(--f-display)', fontSize: 20 }}>{scoreLabel(d.score)}</b>
              <ul>
                {(d.pros || []).map((x: any) => <li key={x.id}>{x.text}</li>)}
                {(d.cons || []).map((x: any) => <li className="c" key={x.id}>{x.text}</li>)}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="article" style={{ gridTemplateColumns: 'minmax(0,1fr) 300px' }}>
          <article className="prose">
            {img ? <Cover media={d.heroImage} title={d.title} size="hero" eager /> : null}
            {hit.type === 'post' && d.source?.url ? (
              <>
                <p className="lead">{d.excerpt}</p>
                {d.source.comment ? <div className="note-box"><b>Nossa nota:</b> {d.source.comment}</div> : null}
                <div className="src-box">
                  <span>Fonte: <b>{d.source.name || 'veja o original'}</b></span>
                  <a className="btn" href={d.source.url} rel="nofollow noopener" target="_blank">Ler na fonte original</a>
                </div>
              </>
            ) : null}
            <Body content={d.content} legacyHtml={d.legacyHtml} />
            <AdSlot kind="inline" />
          </article>
          <aside className="side">
            {hit.type === 'review' ? (
              <>
                <div className="card">
                  <h3>Ficha técnica</h3>
                  <table className="spec">
                    <tbody>
                      {typeof d.game === 'object' && d.game?.developer ? <tr><td>Desenvolvedora</td><td>{d.game.developer}</td></tr> : null}
                      {d.platformTested ? <tr><td>Plataforma testada</td><td>{d.platformTested}</td></tr> : null}
                      {d.playTime ? <tr><td>Tempo de jogo</td><td>{d.playTime}</td></tr> : null}
                      <tr><td>Cópia</td><td>{d.copy === 'bought' ? 'Comprada pelo Xboxmania' : d.copy === 'gamepass' ? 'Game Pass' : 'Cedida pela desenvolvedora'}</td></tr>
                    </tbody>
                  </table>
                </div>
                {bars.some(([, v]) => v != null) ? (
                  <div className="card">
                    <h3>Notas por categoria</h3>
                    <div className="bars">
                      {bars.filter(([, v]) => v != null).map(([k, v]) => (
                        <div key={k}>{k}<i style={{ ['--v' as string]: `${(v as number) * 10}%` }} /><b>{fmtScore(v as number)}</b></div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
            <AdSlot kind="rect" />
          </aside>
        </div>

        {related.length ? (
          <section style={{ marginTop: 30 }}>
            <div className="sec-title"><h2>Leia também</h2></div>
            {related.map((p) => <NewsItem key={p.id} href={postPath(p)} title={p.title} tag={SECTIONS[section].label} excerpt={p.excerpt} date={p.publishedAt} media={p.heroImage} />)}
          </section>
        ) : null}
      </main>
      <Footer />
    </>
  )
}
