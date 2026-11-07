'use client'
export type Consent = 'all' | 'necessary' | null
const KEY = 'xbm_consent'

export function readConsent(): Consent {
  try {
    const m = document.cookie.split('; ').find((c) => c.startsWith(KEY + '='))
    const v = m?.split('=')[1]
    return v === 'all' || v === 'necessary' ? v : null
  } catch {
    return null
  }
}

export function saveConsent(v: Exclude<Consent, null>) {
  document.cookie = `${KEY}=${v}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
  window.dispatchEvent(new Event('xbm-consent'))
}

export const openConsent = () => window.dispatchEvent(new Event('xbm-open-consent'))
