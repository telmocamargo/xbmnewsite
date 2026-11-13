import type { Payload, PayloadRequest } from 'payload'
import { toSlug } from './slug'
import { lexical } from './lexical'

const MAX_IMAGE = 8 * 1024 * 1024

export async function downloadMedia(payload: Payload, url: string, alt: string, credit: string, origin: 'source' | 'legacy' | 'press' | 'own' = 'source', req?: PayloadRequest) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { 'user-agent': 'XboxmaniaBot/1.0' } })
    const mimetype = (res.headers.get('content-type') || '').split(';')[0]
    if (!res.ok || !mimetype.startsWith('image/')) return null
    const data = Buffer.from(await res.arrayBuffer())
    if (data.length > MAX_IMAGE || data.length === 0) return null
    const ext = mimetype.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
    const base = toSlug(new URL(url).pathname.split('/').pop()?.replace(/\.[a-z0-9]+$/i, '') || alt) || 'imagem'
    const doc = await payload.create({
      collection: 'media',
      data: { alt: alt.slice(0, 200), credit, origin, sourceUrl: url },
      file: { data, mimetype, name: `${base}.${ext}`, size: data.length },
      req,
    })
    return doc.id
  } catch {
    return null
  }
}

async function uniqueSlug(payload: Payload, title: string, req?: PayloadRequest) {
  const base = toSlug(title) || 'noticia'
  const hit = await payload.find({ collection: 'posts', where: { slug: { equals: base } }, limit: 1, depth: 0, overrideAccess: true, draft: true, req })
  return hit.totalDocs ? `${base}-${Date.now().toString(36)}` : base
}

function nextMorning(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setUTCHours(12, 0, 0, 0) // 09:00 em Brasília (UTC-3)
  return d.toISOString()
}

/** Cria o post a partir de uma notícia do pré-feed aprovada ou agendada. */
/** Recebe o req do hook para participar da mesma transação (evita travar na linha já bloqueada). */
export async function promoteCandidate(payload: Payload, id: number | string, req?: PayloadRequest) {
  const c = await payload.findByID({ collection: 'candidates', id, depth: 0, overrideAccess: true, req })
  if (c.post) return
  const publishNow = c.status === 'approved'
  const when = publishNow ? new Date().toISOString() : c.scheduledFor || nextMorning()

  let heroImage: number | null = null
  if (c.imageUrl) {
    const m = await downloadMedia(payload, c.imageUrl, c.title, c.sourceName || 'Fonte', 'source', req)
    if (m) heroImage = Number(m)
  }

  const hasDraft = !!c.draftBody?.trim()
  const post = await payload.create({
    collection: 'posts',
    draft: !publishNow,
    overrideAccess: true,
    data: {
      title: hasDraft ? c.draftTitle || c.title : c.title,
      slug: await uniqueSlug(payload, hasDraft ? c.draftTitle || c.title : c.title, req),
      kind: 'noticia',
      excerpt: c.summary || undefined,
      ...(hasDraft ? { content: lexical(c.draftBody!.split(/\n{2,}/).map((t) => t.trim()).filter(Boolean).map((t) => ['p', t] as ['p', string])), aiAssisted: true } : {}),
      heroImage: heroImage ?? undefined,
      category: typeof c.category === 'object' && c.category ? c.category.id : (c.category as number | null | undefined) ?? undefined,
      publishedAt: when,
      source: { name: c.sourceName || '', url: c.url, comment: hasDraft ? '' : c.comment || '', rumor: !!c.isRumor },
      _status: publishNow ? 'published' : 'draft',
    },
    req,
  })

  await payload.update({
    collection: 'candidates',
    id,
    overrideAccess: true,
    context: { skipPromote: true },
    data: { post: post.id, status: publishNow ? 'published' : 'scheduled', scheduledFor: publishNow ? c.scheduledFor : when },
    req,
  })
}

/** Publica as notícias agendadas cujo horário chegou. */
export async function publishDue(payload: Payload) {
  const due = await payload.find({
    collection: 'candidates',
    where: { and: [{ status: { equals: 'scheduled' } }, { scheduledFor: { less_than_equal: new Date().toISOString() } }] },
    limit: 50,
    depth: 0,
    overrideAccess: true,
  })
  let n = 0
  for (const c of due.docs) {
    const postId = typeof c.post === 'object' && c.post ? c.post.id : c.post
    if (!postId) continue
    await payload.update({ collection: 'posts', id: postId, draft: false, overrideAccess: true, data: { _status: 'published' } })
    await payload.update({ collection: 'candidates', id: c.id, overrideAccess: true, context: { skipPromote: true }, data: { status: 'published' } })
    n++
  }
  return n
}
