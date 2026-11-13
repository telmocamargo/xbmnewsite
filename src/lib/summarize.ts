import { z } from 'zod'
import { askJson, llmEnabled, SUMMARY_MODEL } from './llm'

export type Summary = { title: string; summary: string; rewritten: boolean }

const strip = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;|&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

export const cleanText = strip

const Out = z.object({ title: z.string(), summary: z.string() })

/**
 * Gera título e resumo curtos em português, com palavras próprias.
 * Sem chave da API (ou com erro), devolve um trecho do feed e marca como "precisa de reescrita".
 */
export async function summarize(input: { title: string; text: string; lang: 'en' | 'pt' }): Promise<Summary> {
  const text = strip(input.text).slice(0, 3500)
  const fallback: Summary = { title: input.title, summary: text.slice(0, 240).replace(/\s+\S*$/, '') + (text.length > 240 ? '…' : ''), rewritten: false }
  if (!llmEnabled() || !text) return fallback
  try {
    const out = await askJson({
      model: SUMMARY_MODEL(),
      maxTokens: 1024,
      effort: 'low',
      schema: Out,
      system:
        'Você é editor do site Xboxmania. Escreva em português do Brasil. Nunca copie frases do texto original: reescreva com palavras próprias, de forma factual, sem opinião e sem inventar dados. Se for rumor, deixe claro que não há confirmação oficial. O título tem no máximo 90 caracteres. O resumo tem no máximo 2 frases curtas (até 280 caracteres).',
      user: `Título original: ${input.title}\n\nTexto: ${text}`,
    })
    return { title: out.title.slice(0, 120), summary: out.summary.slice(0, 400), rewritten: true }
  } catch {
    return fallback
  }
}
