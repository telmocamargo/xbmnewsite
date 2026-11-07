export const dynamic = 'force-dynamic'

export function GET() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
  const body = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\n\nSitemap: ${base}/sitemap.xml\n`
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
