import type { Metadata, Viewport } from 'next'
import { Providers } from '@/src/components/Providers'
import { ServiceWorkerRegistration } from '@/src/components/ServiceWorkerRegistration'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Önska',
  description: 'Boka och beställ av varandra',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Önska',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FF6B8A',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body style={{ margin: 0, padding: 0 }}>
        <Providers>
          <ServiceWorkerRegistration />
          {children}
        </Providers>
      </body>
    </html>
  )
}
