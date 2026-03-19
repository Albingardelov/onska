import type { Metadata, Viewport } from 'next'
import { Inter, Fraunces } from 'next/font/google'
import { Providers } from '@/src/components/Providers'
import { ServiceWorkerRegistration } from '@/src/components/ServiceWorkerRegistration'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
})

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Couply',
  description: 'Turn wishes into moments',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Couply',
  },
  openGraph: {
    title: 'Couply',
    description: 'Turn wishes into moments',
    type: 'website',
    locale: 'sv_SE',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FF6B8A' },
    { media: '(prefers-color-scheme: dark)', color: '#080204' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={`${inter.variable} ${fraunces.variable}`}>
      <body style={{ margin: 0, padding: 0 }}>
        <Providers>
          <ServiceWorkerRegistration />
          {children}
        </Providers>
      </body>
    </html>
  )
}
