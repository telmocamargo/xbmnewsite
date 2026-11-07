import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { SPRITE } from '../../components/sprite'
import { ScrollFX } from '../../components/ScrollFX'
import { CookieConsent } from '../../components/CookieConsent'
import './site.css'

const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: 'Xboxmania · Sinal verde para a sua mania', template: '%s · Xboxmania' },
  description: 'Notícias, análises e artigos sobre o ecossistema Xbox, em português.',
  alternates: { types: { 'application/rss+xml': '/feed.xml' } },
  openGraph: { siteName: 'Xboxmania', locale: 'pt_BR', type: 'website' },
  icons: { icon: '/brand/icon.svg' },
}
export const viewport: Viewport = { themeColor: '#0d0d0d', width: 'device-width', initialScale: 1 }

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@500;600;700;800&family=Public+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap"
        />
      </head>
      <body>
        <a className="skip" href="#conteudo">
          Pular para o conteúdo
        </a>
        <div dangerouslySetInnerHTML={{ __html: SPRITE }} />
        <ScrollFX />
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}
