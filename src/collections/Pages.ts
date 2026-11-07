import type { CollectionConfig } from 'payload'
import { slugFromTitle } from '../lib/slug'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Página', plural: 'Páginas' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', 'updatedAt'], group: 'Conteúdo', description: 'Páginas fixas do site: Sobre, Contato, Política de privacidade e outras.' },
  access: { read: () => true },
  fields: [
    { name: 'title', label: 'Título', type: 'text', required: true },
    { name: 'slug', type: 'text', unique: true, index: true, required: true, admin: { position: 'sidebar', description: 'Endereço da página: /slug' }, hooks: { beforeValidate: [slugFromTitle()] } },
    { name: 'description', label: 'Descrição para buscadores', type: 'textarea', maxLength: 170 },
    { name: 'content', label: 'Conteúdo', type: 'richText' },
  ],
}
