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

/**
 * Gera título e resumo curtos em português, com palavras próprias, usando a API da Anthropic.
 * Sem chave configurada, devolve um trecho do feed e marca como "precisa de reescrita".
 */
export async function summarize(input: { title: string; text: string; lang: 'en' | 'pt' }): Promise<Summary> {
  const text = strip(input.text).slice(0, 3500)
  const fallback: Summary = { title: input.title, summary: text.slice(0, 240).replace(/\s+\S*$/, '') + (text.length > 240 ? '…' : ''), rewritten: false }
  const key = process.env.ANTHROPIC_API_KEY
  if (!key || !text) return fallback
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        model: process.env.SUMMARY_MODEL || 'claude-haiku-5-5',
        max_tokens: 400,
        system:
          'Você é editor do site Xboxmania. Escreva em português do Brasil. Nunca copie frases do texto original: reescreva com palavras próprias, de forma factual, sem opinião e sem inventar dados. Se for rumor, deixe claro no texto que não há confirmação oficial. Responda apenas com JSON válido: {"title": "...", "summary": "..."}. O título tem no máximo 90 caracteres. O resumo tem no máximo 2 frases curtas (até 280 caracteres).',
        messages: [{ role: 'user', content: `Título original: ${input.title}\n\nTexto: ${text}` }],
      }),
    })
    if (!res.ok) throw new Error(`API ${res.status}`)
    const data = (await res.json()) as { content?: { type: string; text?: string }[] }
    const raw = data.content?.find((c) => c.type === 'text')?.text ?? ''
    const json = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)) as { title?: string; summary?: string }
    if (!json.title || !json.summary) throw new Error('resposta incompleta')
    return { title: json.title.slice(0, 120), summary: json.summary.slice(0, 400), rewritten: true }
  } catch {
    return fallback
  }
}
