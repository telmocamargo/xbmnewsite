'use client'
import Link from 'next/link'
import Script from 'next/script'
import { useEffect, useState } from 'react'
import { readConsent, saveConsent, openConsent, type Consent } from '../lib/consent'

const ADS = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
const GA = process.env.NEXT_PUBLIC_GA_ID

/** Aviso de cookies. Estatísticas e anúncios só carregam depois que o leitor aceita. */
export function CookieConsent() {
  const [consent, setConsent] = useState<Consent>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const sync = () => setConsent(readConsent())
    const reopen = () => setOpen(true)
    sync()
    setOpen(readConsent() === null)
    window.addEventListener('xbm-consent', sync)
    window.addEventListener('xbm-open-consent', reopen)
    return () => {
      window.removeEventListener('xbm-consent', sync)
      window.removeEventListener('xbm-open-consent', reopen)
    }
  }, [])

  const choose = (v: 'all' | 'necessary') => {
    saveConsent(v)
    setOpen(false)
  }

  return (
    <>
      {consent === 'all' && ADS ? <Script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS}`} crossOrigin="anonymous" strategy="afterInteractive" /> : null}
      {consent === 'all' && GA ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA}',{anonymize_ip:true});`}</Script>
        </>
      ) : null}
      {open ? (
        <div className="consent" role="dialog" aria-labelledby="consent-title" aria-live="polite">
          <div className="consent-in">
            <div>
              <b id="consent-title">Cookies</b>
              <p>
                Usamos cookies necessários para o site funcionar e, se você permitir, de estatísticas e publicidade. Veja os detalhes na <Link href="/politica-de-privacidade">política de privacidade</Link>.
              </p>
            </div>
            <div className="consent-actions">
              <button className="btn ghost" onClick={() => choose('necessary')}>Só os necessários</button>
              <button className="btn" onClick={() => choose('all')}>Aceitar tudo</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export function CookiePrefsButton() {
  return (
    <button type="button" className="linklike" onClick={openConsent}>
      Preferências de cookies
    </button>
  )
}
