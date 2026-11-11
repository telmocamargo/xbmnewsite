import type { Metadata } from 'next'
import Link from 'next/link'
import { Header, Footer } from '../../../components/Chrome'
import { EpisodeCard, Pager } from '../../../components/Cards'
import { latestEpisodes, CHANNEL_URL } from '../../../lib/data'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Podcast e vídeos',
  description: 'Todos os episódios do Gamemania Podcast e os vídeos do canal do Xboxmania.',
  alternates: { canonical: '/podcast' },
}

type Props = { searchParams: Promise<{ tipo?: string; page?: string }> }

export default async function PodcastPage({ searchParams }: Props) {
  const sp = await searchParams
  const kind = sp.tipo === 'podcast' || sp.tipo === 'video' ? sp.tipo : undefined
  const page = Math.max(1, Number(sp.page) || 1)
  const data = await latestEpisodes({ limit: 18, page, kind })
  const tabs: [string, string | undefined][] = [['Todos', undefined], ['Podcast', 'podcast'], ['Vídeos', 'video']]

  return (
    <>
      <Header active="podcast" />
      <main id="conteudo" className="wrap main-pad">
        <div className="page-title">
          <h1>Podcast e vídeos</h1>
          <p>O acervo do Gamemania Podcast e os vídeos do canal.</p>
        </div>
        <div className="pf-tabs" role="tablist" aria-label="Filtrar por tipo">
          {tabs.map(([label, k]) => (
            <Link key={label} className="chip" aria-current={k === kind ? 'true' : undefined} href={k ? `/podcast?tipo=${k}` : '/podcast'}>
              {label}
            </Link>
          ))}
          <a className="chip ext" href={CHANNEL_URL} target="_blank" rel="noopener">Canal no YouTube ↗</a>
        </div>
        {data.docs.length === 0 ? <p className="empty">Nenhum episódio por aqui ainda.</p> : null}
        <div className="eps">
          {data.docs.map((e) => (
            <EpisodeCard key={e.id} ep={e} />
          ))}
        </div>
        <Pager base={kind ? `/podcast?tipo=${kind}` : '/podcast'} page={data.page ?? 1} pages={data.totalPages} />
      </main>
      <Footer />
    </>
  )
}
