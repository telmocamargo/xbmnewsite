import Link from 'next/link'
import type { Game } from '../payload-types'
import { CookiePrefsButton } from './CookieConsent'
import { AdUnit } from './AdUnit'
import { LINKS } from '../content/pages'

const Ic = ({ n }: { n: string }) => (
  <svg className="ic" aria-hidden="true">
    <use href={`#i-${n}`} />
  </svg>
)

type Item = { k: string; l: string; i: string; c: string; h: string; n?: string; r?: boolean; dd?: { f: [string, string]; l: [string, string][] } }
const ITEMS: Item[] = [
  { k: 'home', l: 'Início', i: 'home', c: '#70be48', h: '/' },
  { k: 'noticias', l: 'Notícias', i: 'news', c: '#70be48', h: '/noticias' },
  { k: 'analises', l: 'Análises', i: 'star', c: '#f2b134', h: '/analises', dd: { f: ['Análises do Xboxmania', 'Notas e opinião sobre os jogos que testamos'], l: [['star', 'Todas as análises'], ['clock', 'Mais recentes']] } },
  { k: 'gamepass', l: 'Game Pass', i: 'pad', c: '#2fd1a8', h: '/noticias', n: 'NOVO', dd: { f: ['Game Pass', 'O que entra e o que sai do catálogo'], l: [['gift', 'Novidades do catálogo'], ['clock', 'Saindo em breve']] } },
  { k: 'artigos', l: 'Artigos', i: 'book', c: '#c58bff', h: '/artigos' },
  { k: 'podcast', l: 'Podcast', i: 'mic', c: '#ff6fa8', h: '/podcast' },
]

export function Header({ active = 'home' }: { active?: string }) {
  return (
    <>
      <header className="site-head">
        <div className="wrap brand">
          <Link href="/" aria-label="Xboxmania, página inicial">
            <img src="/brand/logo-h-dark.svg" alt="Xboxmania" width={162} height={34} />
          </Link>
          <div className="head-actions">
            <form className="search" action="/busca" method="get" role="search">
              <Ic n="search" />
              <input id="busca-input" type="search" name="q" placeholder="Buscar jogos, notícias…" aria-label="Buscar no site" autoComplete="off" maxLength={80} />
              <kbd aria-hidden="true">/</kbd>
            </form>
            <Link className="btn ghost" href="/feed.xml">
              <Ic n="mail" />
              RSS
            </Link>
          </div>
        </div>
      </header>
      <nav className="main" aria-label="Principal">
        <div className="wrap nav-in">
          <Link className="nav-logo" href="/" aria-label="Início">
            <img src="/brand/icon.svg" alt="" width={30} height={30} />
          </Link>
          {ITEMS.map((it) => (
            <div className="ni" key={it.k} style={{ ['--c' as string]: it.c }}>
              <Link href={it.h} className={it.k === active ? 'on' : undefined}>
                <Ic n={it.i} />
                <span>{it.l}</span>
                {it.n ? <b className="new">{it.n}</b> : null}
              </Link>
              {it.dd ? (
                <div className="dd">
                  {it.dd.l.map(([ic, label]) => (
                    <Link href={it.h} key={label}>
                      <Ic n={ic} />
                      {label}
                      <em>→</em>
                    </Link>
                  ))}
                  <Link className="feat" href={it.h}>
                    <small>Em destaque</small>
                    <b>{it.dd.f[0]}</b>
                    <span style={{ fontSize: 12, color: '#aab1ad' }}>{it.dd.f[1]}</span>
                  </Link>
                </div>
              ) : null}
            </div>
          ))}
          <div className="ni right" style={{ ['--c' as string]: '#ff5d73' }}>
            <a href={LINKS.padrim} rel="noopener" target="_blank">
              <Ic n="heart" />
              <span>Colabore</span>
            </a>
          </div>
        </div>
        <div className="prog" />
      </nav>
    </>
  )
}

export function Ticker({ games }: { games: { entering: Game[]; leaving: Game[] } }) {
  const parts: string[] = []
  if (games.entering.length) parts.push(`Chegando ao Game Pass: ${games.entering.map((g) => g.title).join(', ')}`)
  if (games.leaving.length) parts.push(`Saindo do Game Pass: ${games.leaving.map((g) => g.title).join(', ')}`)
  if (!parts.length) return null
  const grp = (
    <div className="grp">
      {parts.map((p) => (
        <span key={p}>
          <em>GAME PASS</em>
          {p}
        </span>
      ))}
    </div>
  )
  return (
    <div className="ticker" aria-label="Game Pass">
      <div className="track">
        {grp}
        <div aria-hidden="true">{grp}</div>
      </div>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="site">
      <div className="wrap">
        <img src="/brand/logo-h-dark.svg" alt="Xboxmania" width={120} height={26} />
        <span>© 2017–{new Date().getFullYear()} · Sinal verde para a sua mania</span>
        <nav aria-label="Rodapé">
          <Link href="/sobre">Sobre</Link>
          <Link href="/contato">Contato</Link>
          <Link href="/politica-de-privacidade">Política de privacidade</Link>
          <CookiePrefsButton />
          <Link href="/feed.xml">RSS</Link>
          <a href={LINKS.discord} rel="noopener" target="_blank">Discord</a>
        </nav>
      </div>
    </footer>
  )
}

const SLOTS = { lb: process.env.NEXT_PUBLIC_ADSENSE_SLOT_LB, rect: process.env.NEXT_PUBLIC_ADSENSE_SLOT_RECT, inline: process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE }

/** Diz se haverá anúncio deste tipo (em produção, só com o ID do bloco configurado). */
export const hasAd = (kind: 'lb' | 'rect' | 'inline') =>
  process.env.NODE_ENV !== 'production' || !!(process.env.NEXT_PUBLIC_ADSENSE_CLIENT && SLOTS[kind])

export function AdSlot({ kind }: { kind: 'lb' | 'rect' | 'inline' }) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
  if (!client) {
    if (process.env.NODE_ENV === 'production') return null
    return <div className={`ad ${kind}`}>ESPAÇO DE ANÚNCIO ({kind}) · ativa com NEXT_PUBLIC_ADSENSE_CLIENT</div>
  }
  const slot = SLOTS[kind]
  // Sem o ID do bloco, o AdSense usa os anúncios automáticos e nada é reservado aqui.
  return slot ? <AdUnit client={client} slot={slot} kind={kind} /> : null
}
