import { getPayload } from 'payload'
import config from '../payload.config'
import { llmEnabled } from './llm'
import { writeDraft } from './writer'
import { sendMessage, sendText, sendDraftPreview, escapeHtml, site } from './telegram'
import { titleTokens } from './relevance'
import { postPath, reviewPath } from './data'

const LIMIT = () => Number(process.env.NEWS_OPINION_DAILY_LIMIT || 4)
const SKIP = { skipPromote: true }
const getP = () => getPayload({ config })

/** Início do dia de hoje no horário de Brasília (UTC-3), em ISO. */
export function startOfTodayBRT(now = new Date()): string {
  const brt = new Date(now.getTime() - 3 * 3600e3)
  brt.setUTCHours(0, 0, 0, 0)
  return new Date(brt.getTime() + 3 * 3600e3).toISOString()
}

async function opinionsToday() {
  const p = await getP()
  const r = await p.find({ collection: 'candidates', where: { opinionAt: { greater_than_equal: startOfTodayBRT() } }, limit: 1, depth: 0 })
  return r.totalDocs
}

/** Até duas análises ou notícias do site que falam do mesmo assunto (2 ou mais palavras em comum no título). */
async function relatedLinks(title: string): Promise<{ title: string; path: string }[]> {
  const p = await getP()
  const mine = [...titleTokens(title)].filter((t) => t.length >= 4)
  if (mine.length < 2) return []
  const live = { _status: { equals: 'published' } } as any
  const [posts, reviews] = await Promise.all([
    p.find({ collection: 'posts', where: live, limit: 300, depth: 0, sort: '-publishedAt', select: { title: true, slug: true, kind: true } }),
    p.find({ collection: 'reviews', where: live, limit: 300, depth: 0, sort: '-publishedAt', select: { title: true, slug: true } }),
  ])
  const pool = [...reviews.docs.map((r) => ({ title: r.title, path: reviewPath({ slug: r.slug }) })), ...posts.docs.map((d) => ({ title: d.title, path: postPath({ slug: d.slug, kind: d.kind }) }))]
  return pool
    .map((x) => ({ x, n: mine.filter((t) => titleTokens(x.title).has(t)).length }))
    .filter((r) => r.n >= 2)
    .sort((a, b) => b.n - a.n)
    .slice(0, 2)
    .map((r) => r.x)
}

/** Passo 1: o editor tocou em "Escrever com a minha opinião". */
export async function startOpinion(id: number | string) {
  const p = await getP()
  const c = await p.findByID({ collection: 'candidates', id, depth: 0 })
  if (!llmEnabled()) return void (await sendText('A IA ainda não está configurada no servidor. Use "Só o resumo".'))
  if (!['pending', 'awaiting_opinion', 'draft_ready'].includes(c.status)) return void (await sendText('Essa notícia já foi tratada.'))
  const already = !!c.opinionAt && c.opinionAt >= startOfTodayBRT()
  if (!already && (await opinionsToday()) >= LIMIT()) {
    return void (await sendText(`Você já atingiu o limite de ${LIMIT()} notícias com opinião hoje. Use "Só o resumo" ou deixe para amanhã.`))
  }
  const msgId = await sendMessage(`<b>${escapeHtml(c.title)}</b>\n\nMande a sua opinião sobre essa notícia, em uma ou duas frases, respondendo a esta mensagem. Dica: use o microfone do teclado do celular. Para desistir, envie /cancelar.`, {
    force_reply: true,
    input_field_placeholder: 'Sua opinião...',
  })
  await p.update({ collection: 'candidates', id, data: { status: 'awaiting_opinion', promptMessageId: msgId ? String(msgId) : undefined }, context: SKIP })
}

/** Passo 2: chegou a opinião. Gera o rascunho e mostra no Telegram. */
export async function receiveOpinion(id: number | string, text: string) {
  const p = await getP()
  const c = await p.findByID({ collection: 'candidates', id, depth: 0 })
  if (c.status !== 'awaiting_opinion') return
  if (text.trim().length < 8) return void (await sendText('Escreva um pouco mais, para eu entender o que você achou. Responda de novo à mensagem anterior.'))
  await p.update({ collection: 'candidates', id, data: { opinion: text.trim().slice(0, 1500), opinionAt: new Date().toISOString(), status: 'drafting' }, context: SKIP })
  await sendText('Anotado. Escrevendo o rascunho…')
  await generateDraft(id)
}

export async function generateDraft(id: number | string) {
  const p = await getP()
  const c = await p.findByID({ collection: 'candidates', id, depth: 0 })
  try {
    const related = await relatedLinks(c.originalTitle || c.title)
    const sourceText = c.sourceText || c.summary || ''
    const d = await writeDraft({
      sourceName: c.sourceName || 'Fonte',
      sourceUrl: c.url,
      originalTitle: c.originalTitle || c.title,
      sourceText,
      isRumor: !!c.isRumor,
      opinion: c.opinion || '',
      related,
    })
    if (sourceText.length < 300) d.checks.push({ ok: false, text: 'A fonte trouxe pouco texto no feed: abra o link e confira os fatos' })
    const saved = await p.update({
      collection: 'candidates',
      id,
      context: SKIP,
      data: { draftTitle: d.title, draftBody: d.paragraphs.join('\n\n'), summary: d.excerpt, draftChecks: d.checks, draftAt: new Date().toISOString(), status: 'draft_ready' },
    })
    await sendDraftPreview(saved)
  } catch (e) {
    // não conta no limite diário: devolve a notícia à fila
    await p.update({ collection: 'candidates', id, data: { status: 'pending', opinionAt: null }, context: SKIP })
    const why = e instanceof Error ? e.message.slice(0, 120) : 'erro desconhecido'
    await sendText(`Não consegui escrever o rascunho agora (${escapeHtml(why)}). Toque em "Escrever com a minha opinião" para tentar de novo, ou use "Só o resumo".`)
  }
}

export const redo = (id: number | string) => generateDraft(id)

/** Passo 3: o editor aprovou. O gancho da coleção cria o post a partir do rascunho. */
export async function publishDraft(id: number | string, mode: 'approved' | 'scheduled') {
  const p = await getP()
  const c = await p.findByID({ collection: 'candidates', id, depth: 0 })
  if (c.status !== 'draft_ready') return void (await sendText('Esse rascunho já foi tratado.'))
  await p.update({ collection: 'candidates', id, data: { status: mode } })
  const done = await p.findByID({ collection: 'candidates', id, depth: 1 })
  const post = typeof done.post === 'object' && done.post ? done.post : null
  if (mode === 'approved' && post) await sendText(`<b>Publicado.</b>\n${site()}${postPath({ slug: post.slug, kind: post.kind })}`)
  else await sendText(mode === 'scheduled' ? '<b>Agendado</b> para amanhã, 09:00.' : 'Aprovado.')
}

/** O editor desistiu de dar opinião: a notícia volta para a fila. */
export async function cancelOpinion(id: number | string) {
  const p = await getP()
  await p.update({ collection: 'candidates', id, data: { status: 'pending' }, context: SKIP })
  await sendText('Ok, a notícia voltou para a fila.')
}
