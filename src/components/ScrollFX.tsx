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
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      const el = document.getElementById('busca-input') as HTMLInputElement | null
      if (el) {
        e.preventDefault()
        el.focus()
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('keydown', onKey)
    }
  }, [])
  return null
}
