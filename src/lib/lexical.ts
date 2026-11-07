/** Monta conteúdo do editor (Lexical) a partir de um texto simples. Usado nos textos iniciais das páginas. */
type Block = ['h2' | 'h3' | 'p', string] | ['ul', string[]]

const text = (t: string, bold = false) => ({ type: 'text', version: 1, text: t, detail: 0, format: bold ? 1 : 0, mode: 'normal', style: '' })
const base = { version: 1, format: '' as const, indent: 0, direction: 'ltr' as const }

/** Aceita **negrito** e [texto](https://link). */
function inline(md: string) {
  const out: any[] = []
  const re = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g
  let last = 0
  for (const m of md.matchAll(re)) {
    if (m.index! > last) out.push(text(md.slice(last, m.index)))
    const tok = m[0]
    if (tok.startsWith('**')) out.push(text(tok.slice(2, -2), true))
    else {
      const [, label, url] = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok)!
      out.push({ type: 'link', ...base, version: 3, fields: { linkType: 'custom', url, newTab: url.startsWith('http') }, children: [text(label)] })
    }
    last = m.index! + tok.length
  }
  if (last < md.length) out.push(text(md.slice(last)))
  return out
}

export function lexical(blocks: Block[]) {
  const children = blocks.map((b) => {
    if (b[0] === 'ul')
      return { type: 'list', listType: 'bullet', start: 1, tag: 'ul', ...base, children: b[1].map((it, i) => ({ type: 'listitem', value: i + 1, ...base, children: inline(it) })) }
    if (b[0] === 'p') return { type: 'paragraph', ...base, textFormat: 0, children: inline(b[1]) }
    return { type: 'heading', tag: b[0], ...base, children: inline(b[1]) }
  })
  return { root: { type: 'root', ...base, children } } as any
}
export type { Block }
