import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import type { ZodType } from 'zod'

/** O SDK lê ANTHROPIC_API_KEY e, se existir, ANTHROPIC_BASE_URL. */
export const llmEnabled = () => !!process.env.ANTHROPIC_API_KEY

let client: Anthropic | null = null
const getClient = () => (client ??= new Anthropic({ maxRetries: 2, timeout: 120_000 }))

/** Redator das notícias com opinião e verificador. Padrão: o modelo mais capaz de uso geral. */
export const WRITER_MODEL = () => process.env.WRITER_MODEL || 'claude-opus-5-5'
/** Resumos em massa das notícias do pré-feed (dezenas por dia): um modelo menor, mais barato. */
export const SUMMARY_MODEL = () => process.env.SUMMARY_MODEL || 'claude-haiku-5-5'

type Opts<T> = { model: string; system: string; user: string; schema: ZodType<T>; maxTokens?: number; effort?: 'low' | 'medium' | 'high'; fallback?: boolean }

/**
 * Pede uma resposta em JSON validado por um esquema (saída estruturada).
 * Com `fallback`, ativa o reenvio automático a outro modelo se o primeiro recusar o pedido.
 */
export async function askJson<T>(o: Opts<T>): Promise<T> {
  const base = {
    model: o.model,
    max_tokens: o.maxTokens ?? 16000,
    system: o.system,
    messages: [{ role: 'user' as const, content: o.user }],
    output_config: { effort: o.effort ?? ('medium' as const), format: zodOutputFormat(o.schema) },
  }
  const res = o.fallback
    ? await getClient().beta.messages.parse({ ...base, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' })
    : await getClient().messages.parse(base)
  if (res.stop_reason === 'refusal') throw new Error('O modelo recusou o pedido')
  if (res.stop_reason === 'max_tokens') throw new Error('Resposta cortada pelo limite de tamanho')
  if (!res.parsed_output) throw new Error('Resposta fora do formato esperado')
  return res.parsed_output as T
}
