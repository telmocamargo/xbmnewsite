import { after } from 'next/server'
import { getP } from '../../../../lib/data'
import { answerCallback, editMessage, escapeHtml, sendText } from '../../../../lib/telegram'
import { startOpinion, receiveOpinion, publishDraft, redo, cancelOpinion } from '../../../../lib/opinion-flow'

export const dynamic = 'force-dynamic'

type Update = {
  callback_query?: { id: string; data?: string; message?: { message_id: number; chat: { id: number } } }
  message?: { message_id: number; text?: string; chat: { id: number }; reply_to_message?: { message_id: number } }
}

const ok = () => Response.json({ ok: true })

/** Webhook do Telegram: botões (Aprovar, Descartar, Escrever com a minha opinião...) e respostas com a opinião. */
export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!secret || req.headers.get('x-telegram-bot-api-secret-token') !== secret) return Response.json({ error: 'não autorizado' }, { status: 401 })
  const update = (await req.json()) as Update
  const chat = update.callback_query?.message?.chat.id ?? update.message?.chat.id
  if (String(chat) !== String(process.env.TELEGRAM_CHAT_ID)) return ok()

  const payload = await getP()

  // --- toques nos botões
  const cb = update.callback_query
  if (cb?.data && cb.message) {
    const [action, id] = cb.data.split(':')
    const log = (e: unknown) => console.error('telegram', action, e instanceof Error ? e.message : e)
    try {
      if (action === 'op') {
        await answerCallback(cb.id, 'Ok, me mande a sua opinião.')
        after(() => startOpinion(id).catch(log))
      } else if (action === 'pb' || action === 'sc') {
        await answerCallback(cb.id, action === 'pb' ? 'Publicando…' : 'Agendando…')
        after(() => publishDraft(id, action === 'pb' ? 'approved' : 'scheduled').catch(log))
      } else if (action === 'rd') {
        await answerCallback(cb.id, 'Refazendo o rascunho…')
        after(() => redo(id).catch(log))
      } else if (action === 'ap' || action === 'di') {
        const c = await payload.findByID({ collection: 'candidates', id, depth: 0 })
        if (!['pending', 'awaiting_opinion', 'draft_ready'].includes(c.status)) {
          await answerCallback(cb.id, 'Essa notícia já foi tratada.')
        } else if (action === 'ap') {
          await payload.update({ collection: 'candidates', id, data: { status: 'approved' } })
          await answerCallback(cb.id, 'Aprovada e publicada.')
          await editMessage(cb.message.chat.id, cb.message.message_id, `<b>Publicada</b>: ${escapeHtml(c.title)}`)
        } else {
          await payload.update({ collection: 'candidates', id, data: { status: 'discarded' }, context: { skipPromote: true } })
          await answerCallback(cb.id, 'Descartada.')
          await editMessage(cb.message.chat.id, cb.message.message_id, `<s>${escapeHtml(c.title)}</s> (descartada)`)
        }
      }
    } catch (e) {
      log(e)
      await answerCallback(cb.id, 'Não consegui concluir. Tente pelo painel.')
    }
    return ok()
  }

  // --- texto enviado pelo editor: a opinião (resposta à pergunta do bot) ou /cancelar
  const msg = update.message
  if (msg?.text) {
    const waiting = await payload.find({ collection: 'candidates', where: { status: { equals: 'awaiting_opinion' } }, sort: '-updatedAt', limit: 10, depth: 0 })
    const target = waiting.docs.find((d) => msg.reply_to_message && d.promptMessageId === String(msg.reply_to_message.message_id)) ?? waiting.docs[0]
    if (!target) {
      await sendText('Não há nenhuma notícia esperando a sua opinião. Toque em "Escrever com a minha opinião" em uma notícia.')
    } else if (/^\/cancelar/i.test(msg.text)) {
      after(() => cancelOpinion(target.id).catch(console.error))
    } else {
      after(() => receiveOpinion(target.id, msg.text!).catch(console.error))
    }
  }
  return ok()
}
