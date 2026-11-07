import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Mídia', plural: 'Mídia' },
  admin: { group: 'Conteúdo' },
  access: { read: () => true },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*'],
    imageSizes: [
      { name: 'thumb', width: 400, height: 300, position: 'centre', formatOptions: { format: 'webp' } },
      { name: 'card', width: 800, height: 450, position: 'centre', formatOptions: { format: 'webp' } },
      { name: 'hero', width: 1600, height: 900, position: 'centre', formatOptions: { format: 'webp' } },
    ],
    formatOptions: { format: 'webp', options: { quality: 82 } },
  },
  fields: [
    { name: 'alt', label: 'Texto alternativo', type: 'text', required: true },
    { name: 'credit', label: 'Crédito', type: 'text' },
    {
      name: 'origin',
      label: 'Origem da imagem',
      type: 'select',
      defaultValue: 'own',
      options: [
        { label: 'Própria', value: 'own' },
        { label: 'Divulgação / press kit', value: 'press' },
        { label: 'Imagem da fonte (confirmar licença)', value: 'source' },
        { label: 'Importada do WordPress', value: 'legacy' },
      ],
    },
    { name: 'sourceUrl', label: 'URL de origem', type: 'text' },
  ],
}
