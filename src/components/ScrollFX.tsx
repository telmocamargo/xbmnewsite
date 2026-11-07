'use client'
import { useEffect } from 'react'

/** Efeitos sutis do menu: mostra o ícone da marca ao rolar e a barra de progresso de leitura. */
export function ScrollFX() {
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      document.body.classList.toggle('scrolled', y > 80)
      const w = max > 0 ? Math.min(100, (y / max) * 100) : 0
      document.querySelectorAll<HTMLElement>('.prog').forEach((p) => (p.style.width = `${w}%`))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return null
}
