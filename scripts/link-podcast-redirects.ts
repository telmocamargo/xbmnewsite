/**
 * Liga os endereços antigos dos episódios (WordPress) aos episódios importados do YouTube,
 * para os links antigos continuarem funcionando (redirecionamento permanente).
 * O pareamento é feito pelo número do episódio ou por título parecido.
 *
 *   npm run link:podcast                 mostra o que seria ligado (nada é gravado)
 *   npm run link:podcast -- --run        grava os endereços antigos nos episódios
 * Opção: --origin https://xboxmania.com.br
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { similarity, titleTokens } from '../src/lib/relevance'

const arg = (n: string) => process.argv.includes(`--${n}`)
const val = (n: string, d: string) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d }
const ORIGIN = val('origin', 'https://xboxmania.com.br').replace(/\/$/, '')
const RUN = arg('run')

const decode = (s: string) => s.replace(/&#8211;|&#8212;/g, '-').replace(/&#8217;|&#039;/g, "'").replace(/&#038;|&amp;/g, '&').replace(/<[^>]+>/g, '')
// reconhece "EP 69", "Episódio 113", "#76" e o formato antigo "GAMEMANIA – 70 – título"
const num = (t: string) => { const m = /(?:\bEP\.?\s*|Epis[oó]dio\s*|#\s*|\bGame\s?mania\s*[-–]\s*)(\d{1,3})\b/i.exec(t); return m ? Number(m[1]) : undefined }
const clean = (t: string) => titleTokens(t.replace(/gamemania( podcast| pocket)?/gi, ' '))

const old: { slug: string; title: string }[] = []
for (let page = 1; ; page++) {
  const res = await fetch(`${ORIGIN}/wp-json/wp/v2/posts?categories=5398&per_page=100&page=${page}&_fields=slug,title`, { headers: { 'user-agent': 'XboxmaniaMigration/1.0' } })
  if (res.status === 400) break
  if (!res.ok) throw new Error(`WordPress respondeu ${res.status}`)
  const batch = (await res.json()) as { slug: string; title: { rendered: string } }[]
  old.push(...batch.map((b) => ({ slug: b.slug, title: decode(b.title.rendered) })))
  if (batch.length < 100) break
}
console.log(`Episódios no site antigo: ${old.length}`)

const payload = await getPayload({ config })
const eps = (await payload.find({ collection: 'episodes', limit: 1000, pagination: false, depth: 0 })).docs
const toks = eps.map((e) => ({ e, t: clean(e.title), n: e.episodeNumber ?? num(e.title) }))

let matched = 0
const lost: string[] = []
for (const o of old) {
  const ot = clean(o.title), on = num(o.title)
  let best: (typeof toks)[number] | null = null, score = 0
  for (const c of toks) {
    let s = similarity(ot, c.t)
    if (on !== undefined && c.n === on) s = Math.max(s, 0.9)
    if (s > score) { score = s; best = c }
  }
  if (!best || score < 0.5) { lost.push(`${o.slug}  ←  "${o.title}"`); continue }
  matched++
  if (RUN) {
    const cur = (best.e.legacySlugs || []).map((x) => x.slug)
    if (!cur.includes(o.slug)) {
      await payload.update({ collection: 'episodes', id: best.e.id, overrideAccess: true, data: { legacySlugs: [...cur, o.slug].map((slug) => ({ slug })) } })
      best.e.legacySlugs = [...cur, o.slug].map((slug) => ({ slug }))
    }
  }
}
console.log(`Pareados: ${matched} de ${old.length}${RUN ? ' (gravados)' : ' (nada foi gravado, use --run)'}`)
if (lost.length) {
  console.log(`\nSem correspondência (${lost.length}). Esses endereços antigos vão para a página 404:`)
  for (const l of lost.slice(0, 40)) console.log('  ' + l)
}
process.exit(0)
