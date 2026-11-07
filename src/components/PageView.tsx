import { Header, Footer } from './Chrome'
import { Body } from './Body'
import { ContactForm } from './ContactForm'
import { fmtDate } from '../lib/data'
import type { Page } from '../payload-types'

export function PageView({ page }: { page: Page }) {
  return (
    <>
      <Header active="" />
      <main id="conteudo" className="wrap main-pad">
        <div className="page-title">
          <h1>{page.title}</h1>
        </div>
        <article className="prose page-prose">
          <Body content={page.content} />
          {page.slug === 'contato' ? <ContactForm /> : null}
          {page.slug === 'politica-de-privacidade' ? <p className="meta">Última atualização: {fmtDate(page.updatedAt)}</p> : null}
        </article>
      </main>
      <Footer />
    </>
  )
}
