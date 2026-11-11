import type { CollectionConfig } from 'payload'
import { slugFromTitle } from '../lib/slug'
import { buildSearchText } from '../lib/search'
import { parseYouTube } from '../lib/youtube'

export const Episodes: CollectionConfig = {
  slug: 'episodes',
  labels: { singular: 'Episódio', plural: 'Podcast e vídeos' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'kind', 'episodeNumber', 'featured', 'publishedAt'],
    group: 'Conteúdo',
    description: 'Episódios do Gamemania Podcast e vídeos do canal, importados do YouTube. Marque "Destaque" para aparecer em primeiro na home.',
  },
  access: { read: () => true },
  defaultSort: '-publishedAt',
  fields: [
    { name: 'title', label: 'Título', type: 'text', required: true },
    { name: 'slug', type: 'text', unique: true, index: true, admin: { position: 'sidebar' }, hooks: { beforeValidate: [slugFromTitle()] } },
    {
      name: 'youtubeId',
      label: 'Vídeo do YouTube',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Cole o link ou o código do vídeo.' },
      hooks: { beforeValidate: [({ value }) => (typeof value === 'string' ? parseYouTube(value)?.id ?? value.trim() : value)] },
      validate: (v: unknown) => (typeof v === 'string' && /^[\w-]{11}$/.test(v) ? true : 'Link ou código do YouTube inválido'),
    },
    {
      name: 'kind',
      label: 'Tipo',
      type: 'select',
      required: true,
      defaultValue: 'podcast',
      index: true,
      admin: { position: 'sidebar' },
      options: [{ label: 'Podcast', value: 'podcast' }, { label: 'Vídeo', value: 'video' }],
    },
    { name: 'featured', label: 'Destaque na home', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    { name: 'episodeNumber', label: 'Número do episódio', type: 'number', admin: { position: 'sidebar' } },
    { name: 'publishedAt', label: 'Data de publicação', type: 'date', index: true, admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'duration', label: 'Duração (segundos)', type: 'number', admin: { position: 'sidebar' } },
    { name: 'cover', label: 'Capa', type: 'upload', relationTo: 'media' },
    { name: 'description', label: 'Descrição', type: 'textarea', admin: { rows: 10 } },
    { name: 'spotifyUrl', label: 'Link no Spotify (opcional)', type: 'text' },
    {
      name: 'legacySlugs',
      label: 'Endereços antigos (WordPress)',
      type: 'array',
      admin: { description: 'Endereços do site antigo que redirecionam para este episódio.' },
      fields: [{ name: 'slug', type: 'text', required: true }],
    },
    { name: 'searchText', label: 'Texto de busca', type: 'textarea', admin: { hidden: true }, access: { read: ({ req }) => !!req.user } },
  ],
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        data.searchText = buildSearchText({ ...originalDoc, ...data })
        return data
      },
    ],
  },
}
