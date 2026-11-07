import { getP, SITE } from '../../../../lib/data'
import { escapeHtml, sendText } from '../../../../lib/telegram'

export const dynamic = 'force-dynamic'

const SUBJECTS: Record<string, string> = {
  pauta: 'Sugestão de pauta',
  divulgacao: 'Divulgação ou cópia para análise',
  parceria: 'Parceria',
  correcao: 'Correção de erro',
  privacidade: 'Privacidade',
  outro: 'Outro',
}

// Limite simples por IP (5 envios por hora). Vale por processo, o que basta para um site deste porte.
const hits = new Map<string, number[]>()
function limited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < 3600e3)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) hits.clear()
  return recent.length > 5
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\u0000/g, '').trim().slice(0, max) : '')

export async function POST(req: Request) {
  let data: Record<string, unknown>
  try {
    data = await req.json()
  } catch {
    return Response.json({ error: 'Pedido inválido.' }, { status: 400 })
  }

  // robôs: campo-isca preenchido ou envio rápido demais. Responde "ok" para não dar pista.
  if (clean(data.company, 50) || Number(data.elapsed) < 3000) return Response.json({ ok: true })

  const ip = (req.headers.get('x-forwarded-for') || 'local').split(',')[0].trim()
  if (limited(ip)) return Response.json({ error: 'Muitas mensagens em pouco tempo. Tente de novo mais tarde.' }, { status: 429 })

  const name = clean(data.name, 120)
  const email = clean(data.email, 160)
  const subject = clean(data.subject, 30)
  const body = clean(data.body, 4000)
  const site = clean(data.site, 200)
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !SUBJECTS[subject] || body.length < 10) return Response.json({ error: 'Confira os campos e tente de novo.' }, { status: 400 })
  if (data.consent !== true) return Response.json({ error: 'É preciso concordar com a política de privacidade.' }, { status: 400 })

  try {
    const payload = await getP()
    const doc = await payload.create({ collection: 'messages', overrideAccess: true, data: { name, email, subject: subject as any, subjectLabel: SUBJECTS[subject], site: site || undefined, body, consent: true } })
    await sendText(`<b>Nova mensagem no site</b>\n${escapeHtml(SUBJECTS[subject])} · ${escapeHtml(name)}\n${escapeHtml(body.slice(0, 200))}${body.length > 200 ? '…' : ''}\n${SITE()}/admin/collections/messages/${doc.id}`).catch(() => false)
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Não foi possível enviar agora. Tente novamente em alguns minutos.' }, { status: 500 })
  }
}
