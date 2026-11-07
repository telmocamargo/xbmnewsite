const API = (m: string) => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${m}`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
export const site = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
export const telegramEnabled = () => !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)

async function call(method: string, body: Record<string, unknown>) {
  const res = await fetch(API(method), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) })
  return (await res.json()) as { ok: boolean; result?: { message_id?: number }; description?: string }
}

export async function notifyCandidate(c: { id: number | string; title: string; summary?: string | null; sourceName?: string | null; relevance?: number | null; isRumor?: boolean | null; duplicates?: number | null }) {
  if (!telegramEnabled()) return false
  const lines = [
    `<b>${esc(c.sourceName || 'Fonte')}</b> · relevância ${c.relevance ?? '-'}${c.isRumor ? ' · <b>RUMOR</b>' : ''}`,
    `<b>${esc(c.title)}</b>`,
    esc(c.summary || ''),
    c.duplicates ? `<i>Outras ${c.duplicates} fontes cobriram o assunto</i>` : '',
  ].filter(Boolean)
  const r = await call('sendMessage', {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    text: lines.join('\n'),
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Aprovar', callback_data: `ap:${c.id}` },
          { text: 'Editar', url: `${site()}/admin/collections/candidates/${c.id}` },
          { text: 'Descartar', callback_data: `di:${c.id}` },
        ],
      ],
    },
  })
  return r.ok
}

export async function sendText(text: string) {
  if (!telegramEnabled()) return false
  return (await call('sendMessage', { chat_id: process.env.TELEGRAM_CHAT_ID, parse_mode: 'HTML', text })).ok
}

export const answerCallback = (id: string, text: string) => call('answerCallbackQuery', { callback_query_id: id, text })
export const editMessage = (chat_id: number | string, message_id: number, text: string) =>
  call('editMessageText', { chat_id, message_id, text, parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } })
export const escapeHtml = esc
