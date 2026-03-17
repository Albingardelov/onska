import type { Metadata } from 'next'
import { AuthGuard } from './AuthGuard'

export const metadata: Metadata = {
  description: 'Turn wishes into moments',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>
}
