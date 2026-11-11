'use client'
import { useState } from 'react'

/**
 * Vídeo do YouTube com "carregar ao clicar": nada do YouTube é carregado até o leitor
 * apertar o play (mais rápido e melhor para a privacidade). Usa o domínio sem cookies.
 */
export function YouTubeEmbed({ id, start, caption }: { id: string; start?: number; caption?: string }) {
  const [playing, setPlaying] = useState(false)
  const watch = `https://www.youtube.com/watch?v=${id}${start ? `&t=${start}s` : ''}`
  const src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0${start ? `&start=${start}` : ''}`
  return (
    <figure className="yt">
      <div className="yt-frame">
        {playing ? (
          <iframe src={src} title={caption || 'Vídeo do YouTube'} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
        ) : (
          <button type="button" className="yt-play" onClick={() => setPlaying(true)} aria-label={`Reproduzir vídeo${caption ? `: ${caption}` : ''}`} style={{ backgroundImage: `url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)` }}>
            <span className="yt-btn" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z" /></svg>
            </span>
            <span className="yt-note">Clique para assistir</span>
          </button>
        )}
      </div>
      <figcaption>
        {caption ? <>{caption} · </> : null}
        <a href={watch} target="_blank" rel="noopener">Abrir no YouTube</a>
      </figcaption>
    </figure>
  )
}
