import type { CollectionConfig } from 'payload'
import { promoteCandidate } from '../lib/promote'

export const Candidates: CollectionConfig = {
  slug: 'candidates',
  labels: { singular: 'Notícia do pré-feed', plural: 'Pré-feed' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'sourceName', 'relevance', 'status', 'fetchedAt'],
    group: 'Pré-feed',
    listSearchableFields: ['title', 'sourceName'],
    description: 'Notícias encontradas automaticamente. Aprove para publicar, ou descarte.',
  },
  defaultSort: '-fetchedAt',
  access: { create: ({ req }) => !!req.user, read: ({ req }) => !!req.user, update: ({ req }) => !!req.user, delete: ({ req }) => !!req.user },
  fields: [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      admin: { position: 'sidebar' },
      options: [
        { label: 'Pendente', value: 'pending' },
        { label: 'Aprovar e publicar agora', value: 'approved' },
        { label: 'Agendar', value: 'scheduled' },
        { label: 'Publicada', value: 'published' },
        { label: 'Descartada', value: 'discarded' },
      ],
    },
    { name: 'scheduledFor', label: 'Publicar em', type: 'date', admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' }, condition: (d) => d?.status === 'scheduled' } },
    { name: 'title', label: 'Título sugerido', type: 'text', required: true },
    { name: 'summary', label: 'Resumo curto', type: 'textarea', maxLength: 400 },
    { name: 'comment', label: 'Seu comentário (opcional)', type: 'textarea', maxLength: 300 },
    { name: 'originalTitle', label: 'Título original', type: 'text', admin: { readOnly: true } },
    { name: 'sourceName', label: 'Fonte', type: 'text', admin: { readOnly: true } },
    { name: 'source', label: 'Cadastro da fonte', type: 'relationship', relationTo: 'sources', admin: { readOnly: true } },
    { name: 'url', label: 'Link original', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'guid', type: 'text', required: true, unique: true, index: true, admin: { hidden: true } },
    { name: 'imageUrl', label: 'Imagem da fonte (confirmar licença)', type: 'text' },
    { name: 'relevance', label: 'Relevância (0-100)', type: 'number', index: true, admin: { position: 'sidebar', readOnly: true } },
    { name: 'isRumor', label: 'Rumor', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    { name: 'needsRewrite', label: 'Resumo precisa de reescrita', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar', description: 'Ligado quando não havia IA disponível: o resumo é só um trecho do feed.' } },
    { name: 'category', label: 'Categoria', type: 'relationship', relationTo: 'categories', admin: { position: 'sidebar' } },
    { name: 'duplicates', label: 'Outras fontes sobre o mesmo assunto', type: 'number', defaultValue: 0, admin: { position: 'sidebar', readOnly: true } },
    { name: 'autoDiscarded', label: 'Descartada automaticamente', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar', readOnly: true } },
    { name: 'discardReason', label: 'Motivo do descarte', type: 'text', admin: { readOnly: true, condition: (d) => !!d?.autoDiscarded } },
    { name: 'post', label: 'Post criado', type: 'relationship', relationTo: 'posts', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'fetchedAt', label: 'Encontrada em', type: 'date', index: true, admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'sourcePublishedAt', label: 'Publicada na fonte em', type: 'date', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'telegramNotified', label: 'Avisada no Telegram', type: 'checkbox', defaultValue: false, admin: { hidden: true } },
  ],
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req, context }) => {
        if (context?.skipPromote) return doc
        const was = previousDoc?.status
        if ((doc.status === 'approved' || doc.status === 'scheduled') && doc.status !== was) {
          await promoteCandidate(req.payload, doc.id, req)
        }
        return doc
      },
    ],
  },
}
