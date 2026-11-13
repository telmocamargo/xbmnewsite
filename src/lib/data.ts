import { getPayload } from 'payload'
import config from '../payload.config'
import type { Media, Post, Review, Game, Episode } from '../payload-types'
import { normalize } from './search'

export const getP = () => getPayload({ config })
export const SITE = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

export const SECTIONS = {
  noticias: { label: 'Notícias', collection: 'posts' as const, kinds: ['noticia'], blurb: 'As novidades do ecossistema Xbox.' },
  artigos: { label: 'Artigos', collection: 'posts' as const, kinds: ['artigo', 'coluna', 'caixa-indie'], blurb: 'Colunas, memórias e a Caixa Indie.' },
  podcast: { label: 'Podcast', collection: 'posts' as const, kinds: ['podcast'], blurb: 'O acervo do Gamemania Podcast.' },
  analises: { label: 'Análises', collection: 'reviews' as const, kinds: [], blurb: 'Jogos testados e avaliados pelo Xboxmania.' },
}
export type SectionKey = keyof typeof SECTIONS
export const isSection = (s: string): s is SectionKey => s in SECTIONS

export const postPath = (p: Pick<Post, 'slug' | 'kind'>) =>
  `/${p.kind === 'noticia' ? 'noticias' : p.kind === 'podcast' ? 'podcast' : 'artigos'}/${p.slug}`
export const reviewPath = (r: Pick<Review, 'slug'>) => `/analises/${r.slug}`
export const episodePath = (e: Pick<Episode, 'slug'>) => `/podcast/${e.slug}`
/** Linha de transparência das notícias escritas com apoio de IA. */
export const AI_NOTE = () => process.env.AI_DISCLOSURE || 'Texto produzido com apoio de IA e revisado por Telmo Camargo.'
export const CHANNEL_URL = 'https://www.youtube.com/@gamemaniapodcast'

export function fmtDuration(sec?: number | null) {
  if (!sec) return ''
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`
}

export const live = () => ({ and: [{ _status: { equals: 'published' } }, { or: [{ publishedAt: { less_than_equal: new Date().toISOString() } }, { publishedAt: { exists: false } }] }] })

export async function latestPosts(opts: { limit?: number; page?: number; kinds?: string[]; exceptIds?: number[] } = {}) {
  const payload = await getP()
  const and: any[] = [live()]
  if (opts.kinds?.length) and.push({ kind: { in: opts.kinds } })
  if (opts.exceptIds?.length) and.push({ id: { not_in: opts.exceptIds } })
  return payload.find({ collection: 'posts', where: { and }, sort: '-publishedAt', limit: opts.limit ?? 10, page: opts.page ?? 1, depth: 1 })
}

export async function latestReviews(opts: { limit?: number; page?: number } = {}) {
  const payload = await getP()
  return payload.find({ collection: 'reviews', where: live() as any, sort: '-publishedAt', limit: opts.limit ?? 8, page: opts.page ?? 1, depth: 1 })
}

export async function searchContent(raw: string) {
  const terms = normalize(raw).split(' ').filter((t) => t.length >= 2).slice(0, 6)
  if (!terms.length) return { terms, reviews: [] as Review[], posts: [] as Post[], episodes: [] as Episode[] }
  const payload = await getP()
  const where = { and: [live(), ...terms.map((t) => ({ searchText: { contains: t } }))] } as any
  const epWhere = { and: terms.map((t) => ({ searchText: { contains: t } })) } as any
  const [reviews, posts, episodes] = await Promise.all([
    payload.find({ collection: 'reviews', where, sort: '-publishedAt', limit: 24, depth: 1 }),
    payload.find({ collection: 'posts', where, sort: '-publishedAt', limit: 24, depth: 1 }),
    payload.find({ collection: 'episodes', where: epWhere, sort: '-publishedAt', limit: 24, depth: 1 }),
  ])
  return { terms, reviews: reviews.docs, posts: posts.docs, episodes: episodes.docs }
}

export async function latestEpisodes(opts: { limit?: number; page?: number; kind?: 'podcast' | 'video'; featured?: boolean; exceptIds?: number[] } = {}) {
  const payload = await getP()
  const and: any[] = []
  if (opts.kind) and.push({ kind: { equals: opts.kind } })
  if (opts.featured) and.push({ featured: { equals: true } })
  if (opts.exceptIds?.length) and.push({ id: { not_in: opts.exceptIds } })
  return payload.find({ collection: 'episodes', where: and.length ? { and } : {}, sort: '-publishedAt', limit: opts.limit ?? 12, page: opts.page ?? 1, depth: 1 })
}

export async function findEpisode(slug: string) {
  const payload = await getP()
  const r = await payload.find({ collection: 'episodes', where: { slug: { equals: slug } }, limit: 1, depth: 1 })
  return r.docs[0] ?? null
}

/** Episódio que tinha este endereço no site antigo (para redirecionar). */
export async function findEpisodeByLegacy(slug: string) {
  const payload = await getP()
  const r = await payload.find({ collection: 'episodes', where: { 'legacySlugs.slug': { equals: slug } }, limit: 1, depth: 0 })
  return r.docs[0] ?? null
}

export async function findBySlug(slug: string) {
  const payload = await getP()
  const w = { and: [{ slug: { equals: slug } }, live()] } as any
  const [p, r] = await Promise.all([
    payload.find({ collection: 'posts', where: w, limit: 1, depth: 2 }),
    payload.find({ collection: 'reviews', where: w, limit: 1, depth: 2 }),
  ])
  if (p.docs[0]) return { type: 'post' as const, doc: p.docs[0] }
  if (r.docs[0]) return { type: 'review' as const, doc: r.docs[0] }
  return null
}

export async function findPage(slug: string) {
  const payload = await getP()
  const r = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  return r.docs[0] ?? null
}

export async function gamePassGames() {
  const payload = await getP()
  const now = new Date().toISOString()
  const [entering, leaving, upcoming] = await Promise.all([
    payload.find({ collection: 'games', where: { and: [{ gamePass: { equals: true } }, { gamePassEntry: { greater_than_equal: now } }] }, sort: 'gamePassEntry', limit: 4, depth: 0 }),
    payload.find({ collection: 'games', where: { and: [{ gamePass: { equals: true } }, { gamePassExit: { greater_than_equal: now } }] }, sort: 'gamePassExit', limit: 4, depth: 0 }),
    payload.find({ collection: 'games', where: { releaseDate: { greater_than_equal: now } }, sort: 'releaseDate', limit: 4, depth: 0 }),
  ])
  return { entering: entering.docs, leaving: leaving.docs, upcoming: upcoming.docs }
}

export const mediaUrl = (m: unknown, size: 'thumb' | 'card' | 'hero' | 'full' = 'card'): string | null => {
  if (!m || typeof m !== 'object') return null
  const media = m as Media
  if (size !== 'full') {
    const s = media.sizes?.[size]?.url
    if (s) return s
  }
  return media.url ?? null
}
export const mediaAlt = (m: unknown, fallback: string): string => (m && typeof m === 'object' ? (m as Media).alt : '') || fallback

export const hue = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360
  return h
}

export const fmtDate = (d?: string | null, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  d ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', ...opts }).format(new Date(d)) : ''

export const scoreLabel = (n: number) => (n >= 9 ? 'Excelente' : n >= 8 ? 'Muito bom' : n >= 7 ? 'Bom' : n >= 5 ? 'Regular' : 'Fraco')
export const fmtScore = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
export const authorOf = (d: Post | Review) => (typeof d.author === 'object' && d.author?.name) || d.authorName || 'Redação Xboxmania'
export type { Post, Review, Game }
