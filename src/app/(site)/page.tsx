import Link from 'next/link'
import { Header, Ticker, Footer, AdSlot } from '../../components/Chrome'
import { LINKS } from '../../content/pages'
import { Cover, NewsItem, ReviewCard } from '../../components/Cards'
import { latestPosts, latestReviews, gamePassGames, postPath, reviewPath, fmtDate } from '../../lib/data'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [reviews, posts, gp] = await Promise.all([latestReviews({ limit: 8 }), latestPosts({ limit: 12 }), gamePassGames()])
  const hero = [
    ...reviews.docs.slice(0, 2).map((r) => ({ href: reviewPath(r), title: r.title, tag: 'Análise', media: r.heroImage })),
    ...posts.docs.map((p) => ({ href: postPath(p), title: p.title, tag: p.kind === 'noticia' ? 'Notícia' : 'Artigo', media: p.heroImage })),
  ]
  const [main, ...rest] = hero
  const side = rest.slice(0, 2)
  const list = posts.docs.filter((p) => ![main, ...side].some((h) => h && h.href === postPath(p))).slice(0, 6)
  return (
    <>
      <Header active="home" />
      <Ticker games={gp} />
      <main id="conteudo" className="wrap main-pad">
        {main ? (
          <div className="hero">
            <Link className="big" href={main.href}>
              <Cover media={main.media} title={main.title} size="hero" eager />
              <div className="cap">
                <div className="tag">{main.tag}</div>
                <h2>{main.title}</h2>
              </div>
            </Link>
            <div className="stack">
              {side.map((s) => (
                <Link className="sm" href={s.href} key={s.href}>
                  <Cover media={s.media} title={s.title} size="card" eager />
                  <div className="cap">
                    <div className="tag">{s.tag}</div>
                    <h3>{s.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <p className="empty">Ainda não há conteúdo publicado. Crie o primeiro post no painel em /admin.</p>
        )}

        <AdSlot kind="lb" />

        <div className="grid2">
          <section>
            <div className="sec-title">
              <h2>Últimas</h2>
              <Link href="/noticias">
                Ver tudo <span>→</span>
              </Link>
            </div>
            {list.map((p) => (
              <NewsItem key={p.id} href={postPath(p)} title={p.title} tag={p.kind === 'noticia' ? 'Notícia' : 'Artigo'} excerpt={p.excerpt} date={p.publishedAt} media={p.heroImage} />
            ))}
          </section>
          <aside className="side">
            {gp.entering.length + gp.leaving.length > 0 ? (
              <div className="card">
                <h3>Game Pass</h3>
                <ul className="gp">
                  {gp.entering.map((g) => (
                    <li key={`in${g.id}`}>
                      <span className="pill in">ENTRA</span> {g.title} <span className="d">{fmtDate(g.gamePassEntry, { day: '2-digit', month: '2-digit' })}</span>
                    </li>
                  ))}
                  {gp.leaving.map((g) => (
                    <li key={`out${g.id}`}>
                      <span className="pill out">SAI</span> {g.title} <span className="d">{fmtDate(g.gamePassExit, { day: '2-digit', month: '2-digit' })}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {gp.upcoming.length ? (
              <div className="card">
                <h3>Próximos lançamentos</h3>
                <ul className="cal">
                  {gp.upcoming.map((g) => (
                    <li key={g.id}>
                      <div className="day">
                        <b>{fmtDate(g.releaseDate, { day: '2-digit' })}</b>
                        <span>{fmtDate(g.releaseDate, { month: 'short' }).replace('.', '')}</span>
                      </div>
                      {g.title}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <AdSlot kind="rect" />
            <div className="card padrim">
              <h3>Apoie o Xboxmania</h3>
              <p>Ajude a manter o site independente e ganhe benefícios para apoiadores.</p>
              <a className="btn" href={LINKS.padrim} rel="noopener" target="_blank">
                Conhecer no Padrim
              </a>
            </div>
          </aside>
        </div>

        {reviews.docs.length ? (
          <>
            <div className="sec-title" style={{ marginTop: 30 }}>
              <h2>Análises</h2>
              <Link href="/analises">
                Todas as análises <span>→</span>
              </Link>
            </div>
            <div className="reviews">
              {reviews.docs.slice(0, 4).map((r) => (
                <ReviewCard key={r.id} href={reviewPath(r)} title={r.title} platform={r.platformTested} score={r.score} date={r.publishedAt} media={r.heroImage} />
              ))}
            </div>
          </>
        ) : null}
      </main>
      <Footer />
    </>
  )
}
