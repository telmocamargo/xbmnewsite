import type { MetadataRoute } from 'next'
import { getP, SITE, postPath, reviewPath, SECTIONS } from '../../lib/data'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getP()
  const w = { _status: { equals: 'published' } } as const
  const [pages, posts, reviews] = await Promise.all([
    payload.find({ collection: 'pages', limit: 100, depth: 0, pagination: false, select: { slug: true, updatedAt: true } }),
    payload.find({ collection: 'posts', where: w, limit: 5000, depth: 0, pagination: false, select: { slug: true, kind: true, updatedAt: true } }),
    payload.find({ collection: 'reviews', where: w, limit: 5000, depth: 0, pagination: false, select: { slug: true, updatedAt: true } }),
  ])
  const base = SITE()
  return [
    { url: base, changeFrequency: 'hourly', priority: 1 },
    ...Object.keys(SECTIONS).map((s) => ({ url: `${base}/${s}`, changeFrequency: 'daily' as const, priority: 0.7 })),
    ...pages.docs.map((p) => ({ url: `${base}/${p.slug}`, lastModified: p.updatedAt, priority: 0.3 })),
    ...posts.docs.map((p) => ({ url: base + postPath(p), lastModified: p.updatedAt })),
    ...reviews.docs.map((r) => ({ url: base + reviewPath(r), lastModified: r.updatedAt, priority: 0.8 })),
  ]
}
