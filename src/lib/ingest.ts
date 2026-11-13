import { createHash } from 'node:crypto'
import Parser from 'rss-parser'
import { getPayload } from 'payload'
import config from '../payload.config'
import { cleanText, summarize } from './summarize'
import { scoreRelevance, similarity, titleTokens } from './relevance'
import { notifyCandidate, sendText, telegramEnabled, site } from './telegram'
import { publishDue } from './promote'

type Item = Record<string, any>
const parser = new Parser<Record<string, never>, Item>({
  timeout: 15000,
  headers: { 'User-Agent': 'XboxmaniaBot/1.0' },
  customFields: { item: [['media:content', 'mediaContent'], ['media:thumbnail', 'mediaThumbnail'], ['media:group', 'mediaGroup'], ['content:encoded', 'contentEncoded']] },
})

const MAX_AGE_H = 72
const MAX_PER_SOURCE = 15
const DISCARD_BELOW = 30

function imageOf(item: Item): string | null {
  const m = item.mediaContent?.$?.url || item.mediaThumbnail?.$?.url || item.mediaGroup?.['media:thumbnail']?.[0]?.$?.url
  if (m) return m
  if (item.enclosure?.url && /image/.test(item.enclosure.type || 'image')) return item.enclosure.url
  const html = item.contentEncoded || item.content || ''
  return /<img[^>]+src=["']([^"']+)["']/i.exec(html)?.[1] ?? null
}

export type IngestStats = { sources: number; fetched: number; created: number; discarded: number; duplicates: number; notified: number; published: number; errors: string[] }

export async function runIngest(opts: { notify?: boolean } = {}): Promise<IngestStats> {
  const payload = await getPayload({ config })
  const stats: IngestStats = { sources: 0, fetched: 0, created: 0, discarded: 0, duplicates: 0, notified: 0, published: 0, errors: [] }
  const minNotify = Number(process.env.NOTIFY_MIN_RELEVANCE || 80)

  const cats = await payload.find({ collection: 'categories', limit: 100, depth: 0, pagination: false })
  const catId = (slug: string) => cats.docs.find((c) => c.slug === slug)?.id

  const sources = await payload.find({ collection: 'sources', where: { active: { equals: true } }, limit: 100, depth: 0, pagination: false })
  const since = new Date(Date.now() - 48 * 3600e3).toISOString()
  const recent = await payload.find({ collection: 'candidates', where: { and: [{ fetchedAt: { greater_than: since } }, { autoDiscarded: { equals: false } }] }, limit: 500, depth: 0, pagination: false })
  const pool = recent.docs.map((d) => ({ id: d.id, tokens: titleTokens(d.originalTitle || d.title), dup: d.duplicates || 0 }))

  for (const src of sources.docs) {
    stats.sources++
    try {
      const feed = await parser.parseURL(src.url)
      const items = (feed.items || []).slice(0, MAX_PER_SOURCE)
      for (const it of items) {
        const link = it.link as string | undefined
        const title = (it.title as string | undefined)?.trim()
        if (!link || !title) continue
        stats.fetched++
        const guid = createHash('sha1').update(`${src.id}:${it.guid || link}`).digest('hex')
        const exists = await payload.find({ collection: 'candidates', where: { guid: { equals: guid } }, limit: 1, depth: 0 })
        if (exists.totalDocs) continue

        const published = it.isoDate ? new Date(it.isoDate) : new Date()
        const ageHours = (Date.now() - published.getTime()) / 3600e3
        const text = cleanText(it.contentEncoded || it.content || it.contentSnippet || '')
        const base = { guid, url: link, originalTitle: title, sourceName: src.name, source: src.id, fetchedAt: new Date().toISOString(), sourcePublishedAt: published.toISOString() }

        if (ageHours > MAX_AGE_H) {
          await payload.create({ collection: 'candidates', data: { ...base, title, status: 'discarded', autoDiscarded: true, discardReason: 'Antiga demais' }, context: { skipPromote: true } })
          stats.discarded++
          continue
        }
        const { score, isRumor } = scoreRelevance({ title, text, official: src.trust === 'official', onlyXboxFeed: !!src.onlyXboxFeed, ageHours })
        if (score < DISCARD_BELOW) {
          await payload.create({ collection: 'candidates', data: { ...base, title, relevance: score, status: 'discarded', autoDiscarded: true, discardReason: 'Fora do tema Xbox' }, context: { skipPromote: true } })
          stats.discarded++
          continue
        }
        const tokens = titleTokens(title)
        const twin = pool.find((p) => similarity(tokens, p.tokens) >= 0.55)
        if (twin) {
          twin.dup++
          await payload.update({ collection: 'candidates', id: twin.id, data: { duplicates: twin.dup }, context: { skipPromote: true } })
          await payload.create({ collection: 'candidates', data: { ...base, title, relevance: score, status: 'discarded', autoDiscarded: true, discardReason: 'Mesmo assunto de outra fonte' }, context: { skipPromote: true } })
          stats.duplicates++
          continue
        }

        const s = await summarize({ title, text, lang: src.language === 'pt' ? 'pt' : 'en' })
        const rumor = isRumor || src.trust === 'rumor'
        const created = await payload.create({
          collection: 'candidates',
          context: { skipPromote: true },
          data: {
            ...base,
            title: s.title,
            summary: s.summary,
            sourceText: text.slice(0, 8000),
            imageUrl: imageOf(it) ?? undefined,
            relevance: score,
            isRumor: rumor,
            needsRewrite: !s.rewritten,
            category: /game ?pass/i.test(title) ? catId('xbox-game-pass') : catId('noticias'),
            status: 'pending',
          },
        })
        pool.push({ id: created.id, tokens, dup: 0 })
        stats.created++
        if (opts.notify !== false && score >= minNotify && telegramEnabled()) {
          if (await notifyCandidate({ id: created.id, title: s.title, summary: s.summary, sourceName: src.name, relevance: score, isRumor: rumor })) {
            await payload.update({ collection: 'candidates', id: created.id, data: { telegramNotified: true }, context: { skipPromote: true } })
            stats.notified++
          }
        }
      }
      await payload.update({ collection: 'sources', id: src.id, data: { lastCheckedAt: new Date().toISOString(), lastError: '', failures: 0 } })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      stats.errors.push(`${src.name}: ${msg}`)
      await payload.update({ collection: 'sources', id: src.id, data: { lastCheckedAt: new Date().toISOString(), lastError: msg.slice(0, 200), failures: (src.failures || 0) + 1 } })
    }
  }
  stats.published = await publishDue(payload)
  return stats
}

export async function sendDigest() {
  const payload = await getPayload({ config })
  const pending = await payload.find({ collection: 'candidates', where: { status: { equals: 'pending' } }, sort: '-relevance', limit: 10, depth: 0 })
  if (!pending.totalDocs) return { sent: false, pending: 0 }
  const lines = [`<b>Resumo diário</b>: ${pending.totalDocs} notícias aguardando`, ...pending.docs.slice(0, 5).map((d) => `• ${d.title} (${d.relevance})`), `${site()}/admin/collections/candidates?where[status][equals]=pending`]
  const sent = await sendText(lines.join('\n'))
  return { sent, pending: pending.totalDocs }
}
