import type { CollectionConfig } from 'payload'
import { slugFromTitle } from '../lib/slug'

const publishedOnly = ({ req }: { req: { user?: unknown } }) =>
  req.user ? true : { _status: { equals: 'published' as const } }

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Post', plural: 'Posts' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'kind', '_status', 'publishedAt'],
    group: 'Conteúdo',
    livePreview: undefined,
  },
  access: { read: publishedOnly },
  versions: { drafts: { autosave: { interval: 2000 }, schedulePublish: true }, maxPerDoc: 15 },
  defaultSort: '-publishedAt',
  fields: [
    { name: 'title', label: 'Título', type: 'text', required: true },
    { name: 'slug', type: 'text', unique: true, index: true, admin: { position: 'sidebar' }, hooks: { beforeValidate: [slugFromTitle()] } },
    {
      name: 'kind',
      label: 'Tipo',
      type: 'select',
      required: true,
      defaultValue: 'noticia',
      index: true,
      admin: { position: 'sidebar' },
      options: [
        { label: 'Notícia', value: 'noticia' },
        { label: 'Artigo', value: 'artigo' },
        { label: 'Coluna', value: 'coluna' },
        { label: 'Caixa Indie', value: 'caixa-indie' },
        { label: 'Podcast', value: 'podcast' },
      ],
    },
    { name: 'excerpt', label: 'Resumo', type: 'textarea', maxLength: 300 },
    { name: 'heroImage', label: 'Imagem de destaque', type: 'upload', relationTo: 'media' },
    { name: 'content', label: 'Conteúdo', type: 'richText' },
    {
      name: 'legacyHtml',
      label: 'HTML importado do WordPress',
      type: 'textarea',
      admin: { description: 'Conteúdo antigo preservado como estava. Se o campo Conteúdo for preenchido, ele tem prioridade.', condition: (d) => !!d?.legacyHtml },
    },
    { name: 'category', label: 'Categoria', type: 'relationship', relationTo: 'categories', admin: { position: 'sidebar' } },
    { name: 'tags', label: 'Tags', type: 'array', admin: { position: 'sidebar' }, fields: [{ name: 'tag', type: 'text', required: true }] },
    { name: 'game', label: 'Jogo relacionado', type: 'relationship', relationTo: 'games', admin: { position: 'sidebar' } },
    { name: 'author', label: 'Autor', type: 'relationship', relationTo: 'users', admin: { position: 'sidebar' } },
    { name: 'authorName', label: 'Nome do autor (importado)', type: 'text', admin: { position: 'sidebar' } },
    { name: 'featured', label: 'Destaque na home', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    { name: 'publishedAt', label: 'Data de publicação', type: 'date', admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } } },
    {
      name: 'source',
      label: 'Fonte original',
      type: 'group',
      fields: [
        { name: 'name', label: 'Nome da fonte', type: 'text' },
        { name: 'url', label: 'Link da fonte', type: 'text' },
        { name: 'comment', label: 'Comentário do Xboxmania', type: 'textarea' },
        { name: 'rumor', label: 'É um rumor', type: 'checkbox', defaultValue: false },
      ],
    },
    {
      name: 'seo',
      label: 'SEO',
      type: 'group',
      fields: [
        { name: 'metaTitle', label: 'Título para buscadores', type: 'text', maxLength: 70 },
        { name: 'metaDescription', label: 'Descrição para buscadores', type: 'textarea', maxLength: 170 },
      ],
    },
    { name: 'wpId', label: 'ID no WordPress', type: 'number', index: true, admin: { position: 'sidebar', readOnly: true, condition: (d) => !!d?.wpId } },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (data._status === 'published' && !data.publishedAt) data.publishedAt = new Date().toISOString()
        return data
      },
    ],
  },
}
