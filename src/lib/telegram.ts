import { llmEnabled } from './llm'

const base = () => (process.env.TELEGRAM_API_BASE || 'https://api.telegram.org').replace(/\/$/, '')
const API = (m: string) => `${base()}/bot${process.env.TELEGRAM_BOT_TOKEN}/${m}`
export const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const esc = escapeHtml
export const site = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
export const telegramEnabled = () => !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)

type Markup = Record<string, unknown>
type Resp = { ok: boolean; result?: { message_id?: number }; description?: string }

async function call(method: string, body: Record<string, unknown>): Promise<Resp> {
  const res = await fetch(API(method), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) })
  return (await res.json()) as Resp
}

/** Envia uma mensagem e devolve o id dela (ou null). */
export async function sendMessage(text: string, reply_markup?: Markup): Promise<number | null> {
  if (!telegramEnabled()) return null
  const r = await call('sendMessage', { chat_id: process.env.TELEGRAM_CHAT_ID, parse_mode: 'HTML', disable_web_page_preview: true, text: text.slice(0, 4000), ...(reply_markup ? { reply_markup } : {}) })
  return r.ok ? (r.result?.message_id ?? null) : null
}

export async function sendText(text: string) {
  return (await sendMessage(text)) !== null
}

export async function notifyCandidate(c: { id: number | string; title: string; summary?: string | null; sourceName?: string | null; relevance?: number | null; isRumor?: boolean | null; duplicates?: number | null }) {
  if (!telegramEnabled()) return false
  const lines = [
    `<b>${esc(c.sourceName || 'Fonte')}</b> · relevância ${c.relevance ?? '-'}${c.isRumor ? ' · <b>RUMOR</b>' : ''}`,
    `<b>${esc(c.title)}</b>`,
    esc(c.summary || ''),
    c.duplicates ? `<i>Outras ${c.duplicates} fontes cobriram o assunto</i>` : '',
  ].filter(Boolean)
  const rows: unknown[][] = []
  if (llmEnabled()) rows.push([{ text: 'Escrever com a minha opinião', callback_data: `op:${c.id}` }])
  rows.push([
    { text: 'Só o resumo', callback_data: `ap:${c.id}` },
    { text: 'Abrir', url: `${site()}/admin/collections/candidates/${c.id}` },
    { text: 'Descartar', callback_data: `di:${c.id}` },
  ])
  return (await sendMessage(lines.join('\n'), { inline_keyboard: rows })) !== null
}

/** Texto simples a partir do markdown leve do rascunho. */
const plain = (s: string) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')

export async function sendDraftPreview(c: { id: number | string; draftTitle?: string | null; draftBody?: string | null; draftChecks?: { ok?: boolean | null; text: string }[] | null }) {
  const body = (c.draftBody || '').split(/\n{2,}/).map((p) => esc(plain(p))).join('\n\n')
  const checks = (c.draftChecks || []).map((k) => `${k.ok ? '✓' : '⚠'} ${esc(k.text)}`).join('\n')
  const attention = (c.draftChecks || []).some((k) => !k.ok)
  const text = `<b>Rascunho pronto</b>\n<b>${esc(c.draftTitle || '')}</b>\n\n${body.slice(0, 2600)}\n\n<b>Conferências</b>\n${checks}${attention ? '\n\n<i>Há pontos para conferir. Abra no painel para ajustar antes de publicar.</i>' : ''}`
  return sendMessage(text, {
    inline_keyboard: [
      [{ text: 'Publicar', callback_data: `pb:${c.id}` }, { text: 'Agendar', callback_data: `sc:${c.id}` }],
      [{ text: 'Editar', url: `${site()}/admin/collections/candidates/${c.id}` }, { text: 'Refazer', callback_data: `rd:${c.id}` }, { text: 'Descartar', callback_data: `di:${c.id}` }],
    ],
  })
}

export const answerCallback = (id: string, text: string) => call('answerCallbackQuery', { callback_query_id: id, text })
export const editMessage = (chat_id: number | string, message_id: number, text: string) =>
  call('editMessageText', { chat_id, message_id, text, parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } })
