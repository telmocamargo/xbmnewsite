import type { Metadata } from 'next'
import { Header, Footer } from '../../../components/Chrome'
import { NewsItem, ReviewCard, EpisodeCard } from '../../../components/Cards'
import { searchContent, postPath, reviewPath } from '../../../lib/data'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Busca', robots: { index: false, follow: true } }

type Props = { searchParams: Promise<{ q?: string }> }

export default async function Busca({ searchParams }: Props) {
  const q = ((await searchParams).q || '').slice(0, 80).trim()
  const { terms, reviews, posts, episodes } = await searchContent(q)
  const total = reviews.length + posts.length + episodes.length

  return (
    <>
      <Header active="" />
      <main id="conteudo" className="wrap main-pad">
        <div className="page-title">
          <h1>Busca</h1>
          {q ? <p>{terms.length ? `${total} ${total === 1 ? 'resultado' : 'resultados'} para “${q}”` : 'Digite pelo menos 2 letras.'}</p> : <p>Digite o nome de um jogo, um assunto ou um autor.</p>}
        </div>

        {terms.length && total === 0 ? (
          <p className="empty">Nada encontrado. Tente outra palavra ou menos termos. A busca ignora acentos e maiúsculas.</p>
        ) : null}

        {reviews.length ? (
          <>
            <div className="sec-title" style={{ marginTop: 18 }}>
              <h2>Análises</h2>
            </div>
            <div className="reviews">
              {reviews.map((r) => (
                <ReviewCard key={r.id} href={reviewPath(r)} title={r.title} platform={r.platformTested} score={r.score} date={r.publishedAt} media={r.heroImage} />
              ))}
            </div>
          </>
        ) : null}

        {posts.length ? (
          <>
            <div className="sec-title" style={{ marginTop: 30 }}>
              <h2>Notícias e artigos</h2>
            </div>
            {posts.map((p) => (
              <NewsItem key={p.id} href={postPath(p)} title={p.title} tag={p.kind === 'noticia' ? 'Notícia' : p.kind === 'podcast' ? 'Podcast' : 'Artigo'} excerpt={p.excerpt} date={p.publishedAt} media={p.heroImage} />
            ))}
          </>
        ) : null}
        {episodes.length ? (
          <>
            <div className="sec-title" style={{ marginTop: 30 }}>
              <h2>Podcast e vídeos</h2>
            </div>
            <div className="eps">
              {episodes.map((e) => (
                <EpisodeCard key={e.id} ep={e} />
              ))}
            </div>
          </>
        ) : null}
        {reviews.length >= 24 || posts.length >= 24 ? <p className="meta" style={{ marginTop: 14 }}>Mostrando os 24 mais recentes de cada grupo. Refine a busca para ver outros.</p> : null}
      </main>
      <Footer />
    </>
  )
}
