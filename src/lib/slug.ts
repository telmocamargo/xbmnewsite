import type { FieldHook } from 'payload'

export const toSlug = (v: string): string =>
  v
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)

/** Gera o slug a partir do título quando o campo está vazio. */
export const slugFromTitle =
  (source = 'title'): FieldHook =>
  ({ value, data, operation }) => {
    if (typeof value === 'string' && value.length > 0) return toSlug(value)
    if (operation === 'create' || !value) {
      const base = data?.[source]
      if (typeof base === 'string') return toSlug(base)
    }
    return value
  }
