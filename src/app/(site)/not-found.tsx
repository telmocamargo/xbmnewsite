import Link from 'next/link'
import { Header, Footer } from '../../components/Chrome'

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="conteudo" className="wrap">
        <div className="page-title">
          <h1>Página não encontrada</h1>
          <p>O endereço pode ter mudado. Veja as <Link href="/analises" style={{ color: 'var(--accent)' }}>análises</Link> ou volte ao <Link href="/" style={{ color: 'var(--accent)' }}>início</Link>.</p>
        </div>
      </main>
      <Footer />
    </>
  )
}
