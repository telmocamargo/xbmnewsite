import type { CollectionConfig } from 'payload'

export const Messages: CollectionConfig = {
  slug: 'messages',
  labels: { singular: 'Mensagem de contato', plural: 'Mensagens de contato' },
  admin: { useAsTitle: 'subjectLabel', defaultColumns: ['name', 'email', 'subjectLabel', 'status', 'createdAt'], group: 'Pré-feed', description: 'Mensagens enviadas pelo formulário da página Contato. Apague as antigas (política: até 12 meses).' },
  defaultSort: '-createdAt',
  access: { create: ({ req }) => !!req.user, read: ({ req }) => !!req.user, update: ({ req }) => !!req.user, delete: ({ req }) => !!req.user },
  fields: [
    { name: 'status', label: 'Status', type: 'select', defaultValue: 'new', admin: { position: 'sidebar' }, options: [{ label: 'Nova', value: 'new' }, { label: 'Lida', value: 'read' }, { label: 'Respondida', value: 'answered' }] },
    { name: 'name', label: 'Nome', type: 'text', required: true },
    { name: 'email', label: 'E-mail', type: 'email', required: true },
    { name: 'subject', label: 'Assunto', type: 'select', required: true, options: [{ label: 'Sugestão de pauta', value: 'pauta' }, { label: 'Divulgação ou cópia para análise', value: 'divulgacao' }, { label: 'Parceria', value: 'parceria' }, { label: 'Correção de erro', value: 'correcao' }, { label: 'Privacidade', value: 'privacidade' }, { label: 'Outro', value: 'outro' }] },
    { name: 'subjectLabel', type: 'text', admin: { hidden: true } },
    { name: 'site', label: 'Site ou canal', type: 'text' },
    { name: 'body', label: 'Mensagem', type: 'textarea', required: true },
    { name: 'consent', label: 'Concordou com a política de privacidade', type: 'checkbox', defaultValue: false },
  ],
}
