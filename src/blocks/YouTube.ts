import type { Block } from 'payload'
import { parseYouTube } from '../lib/youtube'

/** Bloco "Vídeo do YouTube" do editor de texto. */
export const YouTubeBlock: Block = {
  slug: 'youtube',
  interfaceName: 'YouTubeBlock',
  labels: { singular: 'Vídeo do YouTube', plural: 'Vídeos do YouTube' },
  fields: [
    {
      name: 'url',
      label: 'Link do vídeo',
      type: 'text',
      required: true,
      validate: (v: unknown) => (parseYouTube(v) ? true : 'Cole um link válido do YouTube, por exemplo https://www.youtube.com/watch?v=...'),
    },
    { name: 'caption', label: 'Legenda (opcional)', type: 'text' },
  ],
}
