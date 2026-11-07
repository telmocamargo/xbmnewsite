import { getP } from '../../../../lib/data'
import { answerCallback, editMessage, escapeHtml } from '../../../../lib/telegram'

export const dynamic = 'force-dynamic'

/** Webhook do Telegram: recebe os toques nos botões Aprovar e Descartar. */
export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!secret || req.headers.get('x-telegram-bot-api-secret-token') !== secret) return Response.json({ error: 'não autorizado' }, { status: 401 })
  const update = (await req.json()) as { callback_query?: { id: string; data?: string; message?: { message_id: number; chat: { id: number } } } }
  const cb = update.callback_query
  if (!cb?.data || !cb.message) return Response.json({ ok: true })
  if (String(cb.message.chat.id) !== String(process.env.TELEGRAM_CHAT_ID)) return Response.json({ ok: true })

  const [action, id] = cb.data.split(':')
  const payload = await getP()
  try {
    const c = await payload.findByID({ collection: 'candidates', id, depth: 0 })
    if (c.status !== 'pending') {
      await answerCallback(cb.id, 'Essa notícia já foi tratada.')
      return Response.json({ ok: true })
    }
    if (action === 'ap') {
      await payload.update({ collection: 'candidates', id, data: { status: 'approved' } })
      await answerCallback(cb.id, 'Aprovada e publicada.')
      await editMessage(cb.message.chat.id, cb.message.message_id, `<b>Publicada</b>: ${escapeHtml(c.title)}`)
    } else if (action === 'di') {
      await payload.update({ collection: 'candidates', id, data: { status: 'discarded' }, context: { skipPromote: true } })
      await answerCallback(cb.id, 'Descartada.')
      await editMessage(cb.message.chat.id, cb.message.message_id, `<s>${escapeHtml(c.title)}</s> (descartada)`)
    }
  } catch {
    await answerCallback(cb.id, 'Não consegui concluir. Tente pelo painel.')
  }
  return Response.json({ ok: true })
}
