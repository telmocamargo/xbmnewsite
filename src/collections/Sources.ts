import type { CollectionConfig } from 'payload'

export const Sources: CollectionConfig = {
  slug: 'sources',
  labels: { singular: 'Fonte', plural: 'Fontes' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'kind', 'active', 'lastCheckedAt', 'lastError'], group: 'Pré-feed' },
  fields: [
    { name: 'name', label: 'Nome', type: 'text', required: true },
    {
      name: 'kind',
      label: 'Tipo',
      type: 'select',
      defaultValue: 'rss',
      options: [
        { label: 'RSS / Atom', value: 'rss' },
        { label: 'Canal do YouTube (feed)', value: 'youtube' },
      ],
    },
    { name: 'url', label: 'URL do feed', type: 'text', required: true },
    { name: 'language', label: 'Idioma', type: 'select', defaultValue: 'en', options: [{ label: 'Inglês', value: 'en' }, { label: 'Português', value: 'pt' }] },
    {
      name: 'trust',
      label: 'Confiança',
      type: 'select',
      defaultValue: 'trusted',
      options: [
        { label: 'Oficial', value: 'official' },
        { label: 'Confiável', value: 'trusted' },
        { label: 'Pode trazer rumores', value: 'rumor' },
      ],
    },
    { name: 'active', label: 'Ativa', type: 'checkbox', defaultValue: true },
    { name: 'onlyXboxFeed', label: 'Feed já é só de Xbox', type: 'checkbox', defaultValue: false, admin: { description: 'Marque se o feed só traz assuntos do ecossistema Xbox (pula o filtro de palavras-chave).' } },
    { name: 'lastCheckedAt', label: 'Última verificação', type: 'date', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'lastError', label: 'Último erro', type: 'text', admin: { readOnly: true } },
    { name: 'failures', label: 'Falhas seguidas', type: 'number', defaultValue: 0, admin: { readOnly: true } },
  ],
}
