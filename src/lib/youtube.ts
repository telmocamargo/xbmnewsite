/** Extrai o ID e o tempo inicial de um link do YouTube (watch, youtu.be, embed, shorts, live). */
export function parseYouTube(raw: unknown): { id: string; start?: number } | null {
  if (typeof raw !== 'string') return null
  const text = raw.trim()
  if (!/^https?:\/\//i.test(text)) return null
  let url: URL
  try {
    url = new URL(text)
  } catch {
    return null
  }
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, '')
  let id: string | null = null
  if (host === 'youtu.be') id = url.pathname.split('/')[1] || null
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v')
    else {
      const m = /^\/(embed|shorts|live|v)\/([^/?#]+)/.exec(url.pathname)
      id = m ? m[2] : null
    }
  }
  if (!id || !/^[\w-]{11}$/.test(id)) return null
  const t = url.searchParams.get('t') || url.searchParams.get('start')
  const start = t ? (/^\d+$/.test(t) ? Number(t) : (/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/.exec(t)?.slice(1).reduce((s, v, i) => s + Number(v || 0) * [3600, 60, 1][i], 0) ?? 0)) : undefined
  return { id, start: start || undefined }
}
