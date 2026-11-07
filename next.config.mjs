import { withPayload } from '@payloadcms/next/withPayload'

/** Redirecionamentos das URLs antigas do WordPress. */
const legacyCategories = {
  analises: '/analises',
  artigos: '/artigos',
  noticias: '/noticias',
  podcast: '/podcast',
  'xbox-game-pass': '/noticias',
  lancamentos: '/noticias',
}

const nextConfig = {
  poweredByHeader: false,
  images: { formats: ['image/avif', 'image/webp'] },
  async redirects() {
    return [
      ...Object.entries(legacyCategories).map(([from, to]) => ({
        source: `/category/${from}`,
        destination: to,
        permanent: true,
      })),
      { source: '/category/:slug*', destination: '/noticias', permanent: true },
      { source: '/tag/:slug*', destination: '/noticias', permanent: true },
      { source: '/feed', destination: '/feed.xml', permanent: true },
      { source: '/wp-sitemap.xml', destination: '/sitemap.xml', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ]
  },
}

export default withPayload(nextConfig)
