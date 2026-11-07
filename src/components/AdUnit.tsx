'use client'
import { useEffect, useRef, useState } from 'react'
import { readConsent } from '../lib/consent'

/** Anúncio manual do AdSense. Só aparece com consentimento e com o ID do bloco configurado. */
export function AdUnit({ client, slot, kind }: { client: string; slot: string; kind: string }) {
  const [ok, setOk] = useState(false)
  const pushed = useRef(false)
  useEffect(() => {
    const sync = () => setOk(readConsent() === 'all')
    sync()
    window.addEventListener('xbm-consent', sync)
    return () => window.removeEventListener('xbm-consent', sync)
  }, [])
  useEffect(() => {
    if (!ok || pushed.current) return
    pushed.current = true
    try {
      ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
    } catch {}
  }, [ok])
  if (!ok) return null
  return (
    <div className={`adwrap ${kind}`}>
      <ins className="adsbygoogle" style={{ display: 'block' }} data-ad-client={client} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" />
    </div>
  )
}
