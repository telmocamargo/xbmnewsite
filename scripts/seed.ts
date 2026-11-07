/**
 * Dados iniciais: usuário administrador, categorias e fontes do pré-feed.
 * Com --demo, cria também conteúdo de exemplo para testar o visual.
 * Uso: npm run seed  |  npm run seed:demo
 */
import { randomBytes } from 'node:crypto'
import { getPayload } from 'payload'
import sharp from 'sharp'
import config from '../src/payload.config'

const demo = process.argv.includes('--demo')
const payload = await getPayload({ config })

const para = (text: string) => ({ type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0, children: [{ type: 'text', version: 1, text, detail: 0, format: 0, mode: 'normal', style: '' }] })
const rich = (...paras: string[]) => ({ root: { type: 'root', version: 1, direction: 'ltr' as const, format: '' as const, indent: 0, children: paras.map(para) } })

// --- usuário admin
const users = await payload.find({ collection: 'users', limit: 1 })
if (!users.totalDocs) {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@xboxmania.local'
  const password = process.env.SEED_ADMIN_PASSWORD || randomBytes(9).toString('base64url')
  await payload.create({ collection: 'users', data: { email, password, name: 'Administrador', role: 'admin' } })
  console.log(`\nUsuário criado: ${email}\nSenha: ${password}\n(troque a senha no primeiro acesso)\n`)
}

// --- categorias
const cats: [string, string][] = [
  ['Notícias', 'noticias'], ['Xbox Game Pass', 'xbox-game-pass'], ['Lançamentos', 'lancamentos'], ['Eventos', 'eventos'],
  ['Artigos', 'artigos'], ['Caixa Indie', 'caixa-indie'], ['Colunistas', 'colunistas'], ['Análises', 'analises'], ['Podcast', 'podcast'],
]
for (const [name, slug] of cats) {
  const hit = await payload.find({ collection: 'categories', where: { slug: { equals: slug } }, limit: 1 })
  if (!hit.totalDocs) await payload.create({ collection: 'categories', data: { name, slug } })
}

// --- fontes do pré-feed (confirme cada URL antes de ativar)
const sources = [
  { name: 'Xbox Wire (en)', url: 'https://news.xbox.com/en-us/feed/', language: 'en', trust: 'official', onlyXboxFeed: true, active: true },
  { name: 'Xbox Wire Brasil', url: 'https://news.xbox.com/pt-br/feed/', language: 'pt', trust: 'official', onlyXboxFeed: true, active: true },
  { name: 'Pure Xbox', url: 'https://www.purexbox.com/feeds/news', language: 'en', trust: 'trusted', onlyXboxFeed: true, active: false },
  { name: 'Windows Central', url: 'https://www.windowscentral.com/feeds.xml', language: 'en', trust: 'trusted', onlyXboxFeed: false, active: false },
  { name: 'YouTube · Xbox', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCjBp_7RuDBUYbd1LegWEJ8g', language: 'en', trust: 'official', onlyXboxFeed: true, active: false },
] as const
for (const s of sources) {
  const hit = await payload.find({ collection: 'sources', where: { url: { equals: s.url } }, limit: 1 })
  if (!hit.totalDocs) await payload.create({ collection: 'sources', data: { ...s, kind: s.url.includes('youtube') ? 'youtube' : 'rss' } })
}

if (demo) {
  const img = async (label: string, h: number) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h},55%,28%)"/><stop offset="1" stop-color="hsl(${h + 40},60%,10%)"/></linearGradient></defs><rect width="1600" height="900" fill="url(#g)"/><circle cx="1150" cy="260" r="360" fill="hsl(${h},80%,55%)" opacity=".25"/></svg>`
    const data = await sharp(Buffer.from(svg)).png().toBuffer()
    return (await payload.create({ collection: 'media', data: { alt: label, origin: 'own' }, file: { data, mimetype: 'image/png', name: `demo-${h}.png`, size: data.length } })).id
  }
  const catId = async (slug: string) => (await payload.find({ collection: 'categories', where: { slug: { equals: slug } }, limit: 1 })).docs[0]?.id
  const day = (n: number) => new Date(Date.now() + n * 864e5).toISOString()

  const g1 = await payload.create({ collection: 'games', data: { title: 'Jogo de exemplo A', developer: 'Estúdio Exemplo', platforms: ['Xbox Series X|S', 'PC'], gamePass: true, gamePassEntry: day(5), releaseDate: day(5) } })
  await payload.create({ collection: 'games', data: { title: 'Jogo de exemplo B', gamePass: true, gamePassExit: day(8) } })
  await payload.create({ collection: 'games', data: { title: 'Jogo de exemplo C', releaseDate: day(12), platforms: ['Xbox Series X|S'] } })

  await payload.create({
    collection: 'reviews', draft: false,
    data: { title: 'Análise de exemplo: um jogo tático de terror', game: g1.id, dek: 'Texto de exemplo para testar o layout da análise.', heroImage: await img('Imagem de exemplo', 140), score: 8.5, platformTested: 'Xbox Series X', playTime: '~14 h', pros: [{ text: 'Atmosfera consistente' }, { text: 'Combate tático profundo' }], cons: [{ text: 'Interface exige paciência' }], subscores: { gameplay: 8.8, visual: 8.2, sound: 9, performance: 7.8 }, content: rich('Parágrafo de exemplo da análise, só para validar a tipografia de leitura.', 'Segundo parágrafo de exemplo, com texto curto e direto.'), _status: 'published', publishedAt: day(-3) },
  })
  await payload.create({
    collection: 'posts', draft: false,
    data: { title: 'Notícia de exemplo: novidades no Game Pass', kind: 'noticia', excerpt: 'Resumo de exemplo em palavras próprias, com crédito e link da fonte.', heroImage: await img('Imagem de exemplo', 20), category: await catId('noticias'), source: { name: 'Fonte de exemplo', url: 'https://example.com/noticia', comment: 'Comentário de exemplo do Xboxmania.' }, _status: 'published', publishedAt: day(-1) },
  })
  await payload.create({
    collection: 'posts', draft: false,
    data: { title: 'Artigo de exemplo: memórias de um jogador', kind: 'artigo', excerpt: 'Coluna autoral de exemplo.', heroImage: await img('Imagem de exemplo', 300), category: await catId('artigos'), content: rich('Texto de exemplo de um artigo autoral.', 'Outro parágrafo de exemplo.'), _status: 'published', publishedAt: day(-2) },
  })
  console.log('Conteúdo de exemplo criado.')
}
console.log('Seed concluído.')
process.exit(0)
