import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { Header, Footer } from '../../../components/Chrome'
import { PageView } from '../../../components/PageView'
import { LEGACY_PODCAST_FALLBACK } from '../../../content/legacy-podcast'
import { NewsItem, ReviewCard, Pager } from '../../../components/Cards'
import { SECTIONS, isSection, latestPosts, latestReviews, findBySlug, findPage, findEpisodeByLegacy, postPath, reviewPath } from '../../../lib/data'

export const revalidate = 120
type Props = { params: Promise<{ section: string }>; searchParams: Promise<{ page?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params
  if (!isSection(section)) {
    const pg = await findPage(section)
    return pg ? { title: pg.title, description: pg.description || undefined, alternates: { canonical: `/${pg.slug}` } } : {}
  }
  return { title: SECTIONS[section].label, description: SECTIONS[section].blurb, alternates: { canonical: `/${section}` } }
}

export default async function SectionPage({ params, searchParams }: Props) {
  const { section } = await params
  const { page: pg } = await searchParams

  // URLs antigas do WordPress ficavam na raiz (/slug). Redireciona para o endereço novo.
  if (!isSection(section)) {
    const pg = await findPage(section)
    if (pg) return <PageView page={pg} />
    const hit = await findBySlug(section)
    if (!hit) {
      const old = await findEpisodeByLegacy(section)
      if (old) permanentRedirect(`/podcast/${old.slug}`)
      if (LEGACY_PODCAST_FALLBACK.includes(section)) permanentRedirect('/podcast')
      notFound()
    }
    permanentRedirect(hit.type === 'post' ? postPath(hit.doc) : reviewPath(hit.doc))
  }

  const page = Math.max(1, Number(pg) || 1)
  const def = SECTIONS[section]
  const isReview = def.collection === 'reviews'
  const data = isReview ? await latestReviews({ limit: 12, page }) : await latestPosts({ limit: 12, page, kinds: def.kinds })

  return (
    <>
      <Header active={section} />
      <main id="conteudo" className="wrap main-pad">
        <div className="page-title">
          <h1>{def.label}</h1>
          <p>{def.blurb}</p>
        </div>
        {data.docs.length === 0 ? <p className="empty">Nada publicado aqui ainda.</p> : null}
        {isReview ? (
          <div className="reviews" style={{ marginTop: 18 }}>
            {(data.docs as any[]).map((r) => (
              <ReviewCard key={r.id} href={reviewPath(r)} title={r.title} platform={r.platformTested} score={r.score} date={r.publishedAt} media={r.heroImage} />
            ))}
          </div>
        ) : (
          <div style={{ marginTop: 10 }}>
            {(data.docs as any[]).map((p) => (
              <NewsItem key={p.id} href={postPath(p)} title={p.title} tag={def.label} excerpt={p.excerpt} date={p.publishedAt} media={p.heroImage} />
            ))}
          </div>
        )}
        <Pager base={`/${section}`} page={data.page ?? 1} pages={data.totalPages} />
      </main>
      <Footer />
    </>
  )
}
