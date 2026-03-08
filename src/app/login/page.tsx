'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/contexts/AuthContext'
import { LoginPage } from '@/src/views/LoginPage'

export default function LoginRoute() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace(profile?.partner_id ? '/' : '/pairing')
    }
  }, [user, profile, loading, router])

  if (loading) return null
  if (user) return null

  return <LoginPage />
}
