/** Texto de busca: minúsculas e sem acentos, para "analise" encontrar "análise". */
export const normalize = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const stripHtml = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#\d+;|&[a-z]+;/gi, ' ')

function lexicalText(node: any): string {
  if (!node) return ''
  if (typeof node.text === 'string') return node.text + ' '
  return Array.isArray(node.children) ? node.children.map(lexicalText).join('') : ''
}

const MAX = 40000

/** Junta título, resumo, autor e corpo do texto em uma única linha normalizada. */
export function buildSearchText(doc: Record<string, any>): string {
  const parts = [doc.title, doc.excerpt, doc.dek, doc.authorName, doc.source?.name, doc.platformTested]
  if (doc.content?.root) parts.push(lexicalText(doc.content.root))
  if (typeof doc.legacyHtml === 'string') parts.push(stripHtml(doc.legacyHtml))
  return normalize(parts.filter((p) => typeof p === 'string').join(' ')).slice(0, MAX)
}
