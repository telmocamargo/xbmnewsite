import { sendDigest } from '../../../../../lib/ingest'

export const dynamic = 'force-dynamic'

const authorized = (req: Request) => {
  const s = process.env.CRON_SECRET
  return !!s && (req.headers.get('authorization') === `Bearer ${s}` || req.headers.get('x-cron-secret') === s)
}

async function handle(req: Request) {
  if (!authorized(req)) return Response.json({ error: 'não autorizado' }, { status: 401 })
  return Response.json(await sendDigest())
}
export const GET = handle
export const POST = handle
