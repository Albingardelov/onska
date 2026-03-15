'use client'
import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/src/contexts/AuthContext'
import { OnboardingPage } from '@/src/views/OnboardingPage'

const PREFILL_KEY = 'couply_pairing_code_prefill'

function PairingContent() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const codeParam = searchParams.get('code')?.toUpperCase() ?? null

  useEffect(() => {
    if (codeParam) localStorage.setItem(PREFILL_KEY, codeParam)
  }, [codeParam])

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/login')
      else if (profile?.partner_id) router.replace('/')
    }
  }, [user, profile, loading, router])

  if (loading || !user || profile?.partner_id) return null

  const initialCode = codeParam ?? localStorage.getItem(PREFILL_KEY) ?? undefined

  return <OnboardingPage initialCode={initialCode || undefined} />
}

export default function PairingRoute() {
  return (
    <Suspense>
      <PairingContent />
    </Suspense>
  )
}
