import type React from 'react'
import Link from 'next/link'
import { hue, mediaAlt, mediaUrl, fmtDate, fmtScore } from '../lib/data'

export function Cover({ media, title, size = 'card', score, eager }: { media?: unknown; title: string; size?: 'thumb' | 'card' | 'hero'; score?: number | null; eager?: boolean }) {
  const url = mediaUrl(media, size)
  return (
    <div className="art" style={{ '--h': hue(title) } as React.CSSProperties}>
      {url ? <img className="cover" src={url} alt={mediaAlt(media, title)} loading={eager ? 'eager' : 'lazy'} decoding="async" /> : null}
      {score != null ? <span className="score">{fmtScore(score)}</span> : null}
    </div>
  )
}

export function NewsItem({ href, title, tag, excerpt, date, media }: { href: string; title: string; tag: string; excerpt?: string | null; date?: string | null; media?: unknown }) {
  return (
    <Link className="item" href={href}>
      <Cover media={media} title={title} size="thumb" />
      <div>
        <div className="tag">{tag}</div>
        <br />
        <h3>{title}</h3>
        {excerpt ? <p>{excerpt}</p> : null}
        <div className="meta">{fmtDate(date)}</div>
      </div>
    </Link>
  )
}

export function ReviewCard({ href, title, platform, score, date, media }: { href: string; title: string; platform?: string | null; score?: number | null; date?: string | null; media?: unknown }) {
  return (
    <Link className="rv" href={href}>
      <Cover media={media} title={title} size="card" score={score} />
      <div className="body">
        <div className="tag">{platform || 'Análise'}</div>
        <h3>{title}</h3>
        <div className="meta">{fmtDate(date, { day: 'numeric', month: 'short' })}</div>
      </div>
    </Link>
  )
}

export function Pager({ base, page, pages }: { base: string; page: number; pages: number }) {
  if (pages <= 1) return null
  const href = (p: number) => (p === 1 ? base : `${base}?page=${p}`)
  return (
    <nav className="pager" aria-label="Paginação">
      {page > 1 ? <Link href={href(page - 1)}>← Anterior</Link> : <span className="off">← Anterior</span>}
      <span>
        {page} de {pages}
      </span>
      {page < pages ? <Link href={href(page + 1)}>Próxima →</Link> : <span className="off">Próxima →</span>}
    </nav>
  )
}
