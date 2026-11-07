import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Usuário', plural: 'Usuários' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'email', 'role'], group: 'Sistema' },
  auth: true,
  fields: [
    { name: 'name', label: 'Nome', type: 'text', required: true },
    {
      name: 'role',
      label: 'Papel',
      type: 'select',
      defaultValue: 'author',
      required: true,
      options: [
        { label: 'Administrador', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Colaborador', value: 'author' },
      ],
    },
    { name: 'bio', label: 'Bio', type: 'textarea' },
  ],
}
