/**
 * Recalcula o texto de busca de todas as análises e posts (use depois de migrar conteúdo
 * ou de atualizar a versão do site). Pode ser repetido sem problema.
 * Uso: npm run reindex   (ou, no contêiner: npx tsx scripts/reindex-search.ts)
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { buildSearchText } from '../src/lib/search'

const payload = await getPayload({ config })
let n = 0
for (const collection of ['reviews', 'posts'] as const) {
  for (let page = 1; ; page++) {
    const res = await payload.find({ collection, limit: 50, page, depth: 0, overrideAccess: true })
    for (const doc of res.docs as any[]) {
      const searchText = buildSearchText(doc)
      if (searchText !== doc.searchText) {
        await payload.update({ collection, id: doc.id, data: { searchText }, overrideAccess: true })
        n++
      }
    }
    if (page >= res.totalPages) break
  }
}
console.log(`Busca reindexada: ${n} itens atualizados.`)
process.exit(0)
