'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/contexts/AuthContext'
import { OnboardingPage } from '@/src/views/OnboardingPage'

export default function PairingRoute() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/login')
      else if (profile?.partner_id) router.replace('/')
    }
  }, [user, profile, loading, router])

  if (loading || !user || profile?.partner_id) return null

  return <OnboardingPage />
}
