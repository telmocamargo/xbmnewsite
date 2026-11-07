import type { CollectionConfig } from 'payload'
import { slugFromTitle } from '../lib/slug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Categoria', plural: 'Categorias' },
  admin: { useAsTitle: 'name', group: 'Conteúdo' },
  access: { read: () => true },
  fields: [
    { name: 'name', label: 'Nome', type: 'text', required: true },
    { name: 'slug', type: 'text', unique: true, index: true, hooks: { beforeValidate: [slugFromTitle('name')] } },
    { name: 'color', label: 'Cor (hex)', type: 'text', admin: { description: 'Opcional. Ex.: #70be48' } },
  ],
}
