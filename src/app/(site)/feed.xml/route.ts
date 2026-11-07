import { latestPosts, latestReviews, SITE, postPath, reviewPath } from '../../../lib/data'

export const dynamic = 'force-dynamic'
const x = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export async function GET() {
  const [p, r] = await Promise.all([latestPosts({ limit: 20 }), latestReviews({ limit: 10 })])
  const base = SITE()
  const items = [
    ...p.docs.map((d) => ({ t: d.title, u: base + postPath(d), at: d.publishedAt, e: d.excerpt || '' })),
    ...r.docs.map((d) => ({ t: d.title, u: base + reviewPath(d), at: d.publishedAt, e: d.dek || '' })),
  ]
    .sort((a, b) => +new Date(b.at || 0) - +new Date(a.at || 0))
    .slice(0, 30)
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Xboxmania</title><link>${base}</link><description>Notícias, análises e artigos sobre o ecossistema Xbox</description><language>pt-BR</language>${items
    .map((i) => `<item><title>${x(i.t)}</title><link>${i.u}</link><guid>${i.u}</guid>${i.at ? `<pubDate>${new Date(i.at).toUTCString()}</pubDate>` : ''}<description>${x(i.e)}</description></item>`)
    .join('')}</channel></rss>`
  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } })
}
