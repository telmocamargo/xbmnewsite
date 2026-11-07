/**
 * Migra análises e artigos do WordPress atual para o Payload, preservando slug e data.
 * Baixa as imagens para a mídia do novo site e reescreve os links no texto.
 *
 * Por padrão só LISTA o que seria migrado (nada é gravado). Para gravar, use --run.
 *   npm run migrate:wp                       lista contagens
 *   npm run migrate:wp -- --run --limit 3    migra 3 itens de cada grupo (teste)
 *   npm run migrate:wp -- --run --all        migra tudo
 *   npm run migrate:wp -- --run --all --podcast   inclui o acervo do podcast
 * Outras opções: --origin https://xboxmania.com.br
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { downloadMedia } from '../src/lib/promote'

const arg = (n: string) => process.argv.includes(`--${n}`)
const val = (n: string, d: string) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d }
const ORIGIN = val('origin', 'https://xboxmania.com.br').replace(/\/$/, '')
const RUN = arg('run')
const LIMIT = arg('all') ? Infinity : Number(val('limit', '5'))

// IDs de categoria do WordPress atual
const REVIEW_CATS = [8]
const ARTICLE_CATS: Record<number, 'artigo' | 'coluna' | 'caixa-indie'> = { 60: 'artigo', 8892: 'coluna', 11: 'artigo', 7087: 'caixa-indie', 8495: 'caixa-indie', 5394: 'artigo' }
const PODCAST_CATS = [5398]

type WPPost = {
  id: number; slug: string; date_gmt: string; title: { rendered: string }; content: { rendered: string }; excerpt: { rendered: string }
  categories: number[]
  _embedded?: { 'wp:featuredmedia'?: { source_url?: string; alt_text?: string }[]; author?: { name?: string }[] }
}

const decode = (s: string) => s.replace(/&#8211;/g, '–').replace(/&#8212;/g, '—').replace(/&#8217;|&#039;/g, '’').replace(/&#8216;/g, '‘').replace(/&#8220;|&#8221;|&quot;/g, '"').replace(/&#038;|&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&hellip;|&#8230;/g, '…')
const plain = (h: string) => decode(h.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()

async function fetchAll(cats: number[]): Promise<WPPost[]> {
  const out: WPPost[] = []
  for (let page = 1; out.length < LIMIT; page++) {
    const url = `${ORIGIN}/wp-json/wp/v2/posts?per_page=${Math.min(100, Number.isFinite(LIMIT) ? LIMIT : 100)}&page=${page}&categories=${cats.join(',')}&orderby=date&order=desc&_embed=wp:featuredmedia,author`
    const res = await fetch(url, { headers: { 'user-agent': 'XboxmaniaMigration/1.0' } })
    if (res.status === 400) break // página além do fim
    if (!res.ok) throw new Error(`WordPress respondeu ${res.status} em ${url}`)
    const batch = (await res.json()) as WPPost[]
    out.push(...batch)
    if (batch.length === 0 || page >= Number(res.headers.get('x-wp-totalpages') || 1)) break
  }
  return out.slice(0, LIMIT)
}

async function count(cats: number[]) {
  const res = await fetch(`${ORIGIN}/wp-json/wp/v2/posts?per_page=1&categories=${cats.join(',')}`)
  return Number(res.headers.get('x-wp-total') || 0)
}

if (!RUN) {
  console.log('Modo de consulta (nada será gravado). Use --run para migrar.\n')
  console.log(`Análises:            ${await count(REVIEW_CATS)}`)
  console.log(`Artigos e colunas:   ${await count(Object.keys(ARTICLE_CATS).map(Number))} (pode haver itens em mais de uma categoria)`)
  console.log(`Podcast (opcional):  ${await count(PODCAST_CATS)}`)
  process.exit(0)
}

const payload = await getPayload({ config })
const imgCache = new Map<string, string | null>()

async function localImage(url: string, alt: string): Promise<{ id: number; url: string } | null> {
  const full = url.replace(/-\d+x\d+(\.[a-z0-9]+)$/i, '$1')
  if (imgCache.has(full)) { const u = imgCache.get(full)!; return u ? { id: -1, url: u } : null }
  const id = (await downloadMedia(payload, full, alt, '', 'legacy')) ?? (full !== url ? await downloadMedia(payload, url, alt, '', 'legacy') : null)
  if (!id) { imgCache.set(full, null); return null }
  const doc = await payload.findByID({ collection: 'media', id, depth: 0 })
  imgCache.set(full, doc.url ?? null)
  return doc.url ? { id: Number(id), url: doc.url } : null
}

async function rewriteImages(html: string, alt: string) {
  const re = /(<img[^>]+?src=["'])(https?:\/\/(?:www\.)?xboxmania\.com\.br\/wp-content\/uploads\/[^"']+)(["'][^>]*>)/gi
  const found = [...html.matchAll(re)]
  let out = html
  for (const m of found) {
    const img = await localImage(m[2], alt)
    if (img) out = out.split(m[2]).join(img.url)
  }
  // remove srcset antigos, que apontariam para o domínio antigo
  return out.replace(/\s(srcset|sizes)=["'][^"']*["']/gi, '')
}

async function catId(slug: string, name: string) {
  const hit = await payload.find({ collection: 'categories', where: { slug: { equals: slug } }, limit: 1 })
  return hit.docs[0]?.id ?? (await payload.create({ collection: 'categories', data: { name, slug } })).id
}

let created = 0, skipped = 0, failed = 0
async function migrate(posts: WPPost[], kind: 'review' | 'artigo' | 'coluna' | 'caixa-indie' | 'podcast') {
  for (const wp of posts) {
    const collection = kind === 'review' ? 'reviews' : 'posts'
    try {
      const exists = await payload.find({ collection, where: { or: [{ wpId: { equals: wp.id } }, { slug: { equals: wp.slug } }] }, limit: 1, depth: 0, draft: true })
      const other = collection === 'posts' ? await payload.find({ collection: 'reviews', where: { wpId: { equals: wp.id } }, limit: 1, depth: 0, draft: true }) : { totalDocs: 0 }
      if (exists.totalDocs || other.totalDocs) { skipped++; continue }

      const title = decode(wp.title.rendered)
      const hero = wp._embedded?.['wp:featuredmedia']?.[0]
      const heroId = hero?.source_url ? await downloadMedia(payload, hero.source_url.replace(/-\d+x\d+(\.[a-z0-9]+)$/i, '$1'), hero.alt_text || title, '', 'legacy') : null
      const html = await rewriteImages(wp.content.rendered, title)
      const base = {
        title, slug: wp.slug, wpId: wp.id, legacyHtml: html,
        publishedAt: new Date(wp.date_gmt + 'Z').toISOString(),
        authorName: wp._embedded?.author?.[0]?.name || undefined,
        heroImage: heroId ? Number(heroId) : undefined,
        _status: 'published' as const,
      }
      if (kind === 'review') {
        await payload.create({ collection: 'reviews', draft: false, data: { ...base, dek: plain(wp.excerpt.rendered).slice(0, 240) } })
      } else {
        const slug = kind === 'podcast' ? 'podcast' : kind === 'caixa-indie' ? 'caixa-indie' : kind === 'coluna' ? 'colunistas' : 'artigos'
        await payload.create({ collection: 'posts', draft: false, data: { ...base, kind, excerpt: plain(wp.excerpt.rendered).slice(0, 300), category: await catId(slug, slug) } })
      }
      created++
      console.log(`  ok  ${kind.padEnd(11)} ${wp.slug}`)
    } catch (e) {
      failed++
      console.error(`  ERRO ${wp.slug}: ${e instanceof Error ? e.message : e}`)
    }
  }
}

console.log(`Migrando de ${ORIGIN} (limite por grupo: ${Number.isFinite(LIMIT) ? LIMIT : 'todos'})\n`)
console.log('Análises…')
await migrate(await fetchAll(REVIEW_CATS), 'review')
for (const [cat, kind] of Object.entries(ARTICLE_CATS)) {
  console.log(`Artigos (categoria ${cat})…`)
  await migrate(await fetchAll([Number(cat)]), kind)
}
if (arg('podcast')) { console.log('Podcast…'); await migrate(await fetchAll(PODCAST_CATS), 'podcast') }
console.log(`\nConcluído: ${created} criados, ${skipped} já existiam, ${failed} com erro.`)
process.exit(failed ? 1 : 0)
