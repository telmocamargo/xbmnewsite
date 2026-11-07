import type { CollectionConfig } from 'payload'
import { slugFromTitle } from '../lib/slug'

export const Games: CollectionConfig = {
  slug: 'games',
  labels: { singular: 'Jogo', plural: 'Jogos' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'releaseDate', 'gamePass'], group: 'Conteúdo' },
  access: { read: () => true },
  fields: [
    { name: 'title', label: 'Título', type: 'text', required: true },
    { name: 'slug', type: 'text', unique: true, index: true, hooks: { beforeValidate: [slugFromTitle()] } },
    { name: 'developer', label: 'Desenvolvedora', type: 'text' },
    { name: 'publisher', label: 'Publicadora', type: 'text' },
    {
      name: 'platforms',
      label: 'Plataformas',
      type: 'select',
      hasMany: true,
      options: ['Xbox Series X|S', 'Xbox One', 'PC', 'PlayStation 5', 'Nintendo Switch', 'Mobile'].map((p) => ({ label: p, value: p })),
    },
    { name: 'releaseDate', label: 'Data de lançamento', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
    { name: 'gamePass', label: 'Está no Game Pass', type: 'checkbox', defaultValue: false },
    { name: 'gamePassEntry', label: 'Entra no Game Pass em', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' }, condition: (d) => !!d?.gamePass } },
    { name: 'gamePassExit', label: 'Sai do Game Pass em', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' }, condition: (d) => !!d?.gamePass } },
    { name: 'cover', label: 'Capa', type: 'upload', relationTo: 'media' },
  ],
}
