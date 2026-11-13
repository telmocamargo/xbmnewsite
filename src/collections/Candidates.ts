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
        { label: 'Aguardando a sua opinião (Telegram)', value: 'awaiting_opinion' },
        { label: 'Escrevendo o rascunho', value: 'drafting' },
        { label: 'Rascunho pronto para revisar', value: 'draft_ready' },
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
    {
      type: 'collapsible',
      label: 'Notícia com a sua opinião (rascunho assistido por IA)',
      admin: { initCollapsed: false },
      fields: [
        { name: 'opinion', label: 'Sua opinião', type: 'textarea', admin: { description: 'Enviada pelo Telegram, ou escreva aqui. É a única fonte de opinião do texto.' } },
        { name: 'draftTitle', label: 'Título do rascunho', type: 'text' },
        { name: 'draftBody', label: 'Texto do rascunho', type: 'textarea', admin: { rows: 12, description: 'Parágrafos separados por uma linha em branco. Aceita **negrito** e [texto](link). Ao aprovar, este texto vira a notícia.' } },
        {
          name: 'draftChecks',
          label: 'Conferências automáticas',
          type: 'array',
          admin: { readOnly: true },
          fields: [{ name: 'ok', label: 'Passou', type: 'checkbox' }, { name: 'text', label: 'Resultado', type: 'text', required: true }],
        },
        { name: 'draftAt', label: 'Rascunho gerado em', type: 'date', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'opinionAt', label: 'Opinião recebida em', type: 'date', index: true, admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'promptMessageId', type: 'text', admin: { hidden: true } },
      ],
    },
    { name: 'sourceText', label: 'Texto da fonte (usado pela IA)', type: 'textarea', admin: { readOnly: true, rows: 6 } },
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
