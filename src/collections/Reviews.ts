import type { CollectionConfig } from 'payload'
import { slugFromTitle } from '../lib/slug'
import { buildSearchText } from '../lib/search'

const publishedOnly = ({ req }: { req: { user?: unknown } }) =>
  req.user ? true : { _status: { equals: 'published' as const } }

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: { singular: 'Análise', plural: 'Análises' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'score', '_status', 'publishedAt'], group: 'Conteúdo' },
  access: { read: publishedOnly },
  versions: { drafts: { autosave: { interval: 2000 }, schedulePublish: true }, maxPerDoc: 15 },
  defaultSort: '-publishedAt',
  fields: [
    { name: 'title', label: 'Título', type: 'text', required: true },
    { name: 'slug', type: 'text', unique: true, index: true, admin: { position: 'sidebar' }, hooks: { beforeValidate: [slugFromTitle()] } },
    { name: 'game', label: 'Jogo', type: 'relationship', relationTo: 'games', admin: { position: 'sidebar' } },
    { name: 'dek', label: 'Linha fina', type: 'textarea', maxLength: 240 },
    { name: 'heroImage', label: 'Imagem de destaque', type: 'upload', relationTo: 'media' },
    {
      name: 'score',
      label: 'Nota (0 a 10)',
      type: 'number',
      min: 0,
      max: 10,
      admin: { step: 0.5, position: 'sidebar', description: 'Deixe vazio em análises importadas até definir a nota.' },
    },
    {
      name: 'subscores',
      label: 'Notas por categoria',
      type: 'group',
      fields: [
        { name: 'gameplay', label: 'Jogabilidade', type: 'number', min: 0, max: 10 },
        { name: 'visual', label: 'Visual', type: 'number', min: 0, max: 10 },
        { name: 'sound', label: 'Som', type: 'number', min: 0, max: 10 },
        { name: 'performance', label: 'Desempenho', type: 'number', min: 0, max: 10 },
      ],
    },
    { name: 'pros', label: 'Pontos positivos', type: 'array', fields: [{ name: 'text', type: 'text', required: true }] },
    { name: 'cons', label: 'Pontos negativos', type: 'array', fields: [{ name: 'text', type: 'text', required: true }] },
    { name: 'platformTested', label: 'Plataforma testada', type: 'text' },
    { name: 'playTime', label: 'Tempo de jogo', type: 'text' },
    {
      name: 'copy',
      label: 'Cópia do jogo',
      type: 'select',
      defaultValue: 'provided',
      options: [
        { label: 'Cedida pela desenvolvedora', value: 'provided' },
        { label: 'Comprada pelo Xboxmania', value: 'bought' },
        { label: 'Game Pass', value: 'gamepass' },
      ],
    },
    { name: 'content', label: 'Texto da análise', type: 'richText' },
    {
      name: 'legacyHtml',
      label: 'HTML importado do WordPress',
      type: 'textarea',
      admin: { condition: (d) => !!d?.legacyHtml },
    },
    { name: 'author', label: 'Autor', type: 'relationship', relationTo: 'users', admin: { position: 'sidebar' } },
    { name: 'authorName', label: 'Nome do autor (importado)', type: 'text', admin: { position: 'sidebar' } },
    { name: 'publishedAt', label: 'Data de publicação', type: 'date', admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } } },
    {
      name: 'seo',
      label: 'SEO',
      type: 'group',
      fields: [
        { name: 'metaTitle', label: 'Título para buscadores', type: 'text', maxLength: 70 },
        { name: 'metaDescription', label: 'Descrição para buscadores', type: 'textarea', maxLength: 170 },
      ],
    },
    { name: 'searchText', label: 'Texto de busca', type: 'textarea', admin: { hidden: true }, access: { read: ({ req }) => !!req.user } },
    { name: 'wpId', label: 'ID no WordPress', type: 'number', index: true, admin: { position: 'sidebar', readOnly: true, condition: (d) => !!d?.wpId } },
  ],
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        if (data._status === 'published' && !data.publishedAt) data.publishedAt = new Date().toISOString()
        data.searchText = buildSearchText({ ...originalDoc, ...data })
        return data
      },
    ],
  },
}
