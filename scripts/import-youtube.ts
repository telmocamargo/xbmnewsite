/**
 * Importa os vídeos do canal do YouTube para a coleção "Podcast e vídeos".
 * Precisa de uma chave da API do YouTube (YouTube Data API v3) na variável YOUTUBE_API_KEY.
 *
 * Por padrão só CONSULTA e mostra o que seria importado (nada é gravado). Para gravar, use --run.
 *   npm run import:youtube                       mostra as contagens
 *   npm run import:youtube -- --run --limit 5    teste: importa só 5 vídeos
 *   npm run import:youtube -- --run              importa tudo (pode ser repetido; pula o que já existe)
 * Opções: --handle gamemaniapodcast   --min-podcast 1200 (segundos para contar como podcast)
 *         --include-shorts            (por padrão, vídeos de até 60 s são ignorados)
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { downloadMedia } from '../src/lib/promote'
import { toSlug } from '../src/lib/slug'

const arg = (n: string) => process.argv.includes(`--${n}`)
const val = (n: string, d: string) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d }
const RUN = arg('run')
const HANDLE = val('handle', 'gamemaniapodcast').replace(/^@/, '')
const LIMIT = Number(val('limit', '0')) || Infinity
const MIN_PODCAST = Number(val('min-podcast', '1200'))
const BASE = process.env.YOUTUBE_API_BASE || 'https://www.googleapis.com/youtube/v3'
const KEY = process.env.YOUTUBE_API_KEY

if (!KEY) {
  console.error('Falta a variável YOUTUBE_API_KEY (chave da API do YouTube).')
  process.exit(1)
}

async function api(path: string, params: Record<string, string>) {
  const url = new URL(BASE + path)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  url.searchParams.set('key', KEY!)
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
  if (!res.ok) {
    const body = (await res.text()).replace(KEY!, '***').slice(0, 300)
    throw new Error(`API do YouTube respondeu ${res.status}: ${body}`)
  }
  return (await res.json()) as any
}

const seconds = (iso: string) => {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || '')
  return m ? Number(m[1] || 0) * 86400 + Number(m[2] || 0) * 3600 + Number(m[3] || 0) * 60 + Number(m[4] || 0) : 0
}
const episodeNumber = (title: string) => {
  const m = /(?:\bEP\.?\s*|Epis[oó]dio\s*|#\s*)(\d{1,3})\b/i.exec(title)
  return m ? Number(m[1]) : undefined
}

// 1) canal -> playlist de uploads
const ch = await api('/channels', { part: 'snippet,contentDetails', forHandle: HANDLE })
const channel = ch.items?.[0]
if (!channel) {
  console.error(`Canal "@${HANDLE}" não encontrado.`)
  process.exit(1)
}
const uploads: string = channel.contentDetails.relatedPlaylists.uploads
console.log(`Canal: ${channel.snippet.title} (@${HANDLE})`)

// 2) todos os IDs de vídeo
const ids: string[] = []
let pageToken = ''
do {
  const r = await api('/playlistItems', { part: 'contentDetails', playlistId: uploads, maxResults: '50', ...(pageToken ? { pageToken } : {}) })
  for (const it of r.items || []) ids.push(it.contentDetails.videoId)
  pageToken = r.nextPageToken || ''
} while (pageToken)

// 3) detalhes (título, descrição, duração, miniaturas)
type V = { id: string; title: string; description: string; publishedAt: string; seconds: number; thumb?: string }
const videos: V[] = []
for (let i = 0; i < ids.length; i += 50) {
  const r = await api('/videos', { part: 'snippet,contentDetails', id: ids.slice(i, i + 50).join(',') })
  for (const v of r.items || []) {
    if (v.snippet.liveBroadcastContent === 'upcoming') continue
    const t = v.snippet.thumbnails || {}
    videos.push({ id: v.id, title: v.snippet.title, description: v.snippet.description || '', publishedAt: v.snippet.publishedAt, seconds: seconds(v.contentDetails.duration), thumb: (t.maxres || t.standard || t.high || t.medium || t.default)?.url })
  }
}
videos.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))

const shorts = videos.filter((v) => v.seconds <= 60)
const keep = arg('include-shorts') ? videos : videos.filter((v) => v.seconds > 60)
const pods = keep.filter((v) => v.seconds >= MIN_PODCAST)
console.log(`Vídeos no canal:        ${videos.length}`)
console.log(`Podcasts (≥ ${Math.round(MIN_PODCAST / 60)} min):   ${pods.length}`)
console.log(`Vídeos (mais curtos):   ${keep.length - pods.length}`)
console.log(`Shorts ignorados:       ${arg('include-shorts') ? 0 : shorts.length}`)
console.log(`Mais recente: ${keep[0]?.publishedAt?.slice(0, 10)} · mais antigo: ${keep[keep.length - 1]?.publishedAt?.slice(0, 10)}`)

if (!RUN) {
  console.log('\nExemplos:')
  for (const v of keep.slice(0, 5)) console.log(`  ${v.publishedAt.slice(0, 10)}  ${Math.round(v.seconds / 60)} min  ${v.title}`)
  console.log('\nModo de consulta (nada foi gravado). Use --run para importar.')
  process.exit(0)
}

const payload = await getPayload({ config })
let created = 0, skipped = 0, failed = 0
for (const v of keep.slice(0, LIMIT)) {
  try {
    const exists = await payload.find({ collection: 'episodes', where: { youtubeId: { equals: v.id } }, limit: 1, depth: 0 })
    if (exists.totalDocs) { skipped++; continue }
    let slug = toSlug(v.title) || v.id
    const clash = await payload.find({ collection: 'episodes', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
    if (clash.totalDocs) slug = `${slug}-${v.id.slice(0, 4).toLowerCase()}`
    const cover = v.thumb ? await downloadMedia(payload, v.thumb, v.title, 'Gamemania Podcast', 'own') : null
    await payload.create({
      collection: 'episodes',
      overrideAccess: true,
      data: {
        title: v.title, slug, youtubeId: v.id,
        kind: v.seconds >= MIN_PODCAST ? 'podcast' : 'video',
        episodeNumber: episodeNumber(v.title),
        publishedAt: v.publishedAt, duration: v.seconds,
        description: v.description.slice(0, 8000),
        cover: cover ? Number(cover) : undefined,
      },
    })
    created++
    console.log(`  ok  ${v.publishedAt.slice(0, 10)}  ${v.title}`)
  } catch (e) {
    failed++
    console.error(`  ERRO ${v.title}: ${e instanceof Error ? e.message : e}`)
  }
}
console.log(`\nConcluído: ${created} criados, ${skipped} já existiam, ${failed} com erro.`)
process.exit(failed ? 1 : 0)
