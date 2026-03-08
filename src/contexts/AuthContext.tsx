import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { subscribeToPush } from '../lib/notifications'
import type { Profile } from '../types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  partner: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string, name: string) => Promise<string | null>
  signOut: () => Promise<void>
  pairWithPartner: (code: string) => Promise<string | null>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [partner, setPartner] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) {
      setProfile(data)
      if (data.partner_id) {
        const { data: partnerData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.partner_id)
          .single()
        setPartner(partnerData)
      }
    }
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false))
        subscribeToPush(session.user.id)
      } else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        subscribeToPush(session.user.id)
      } else { setProfile(null); setPartner(null) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }

  async function signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return error.message
    if (!data.user) return 'Något gick fel'

    const pairingCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      name,
      pairing_code: pairingCode,
      partner_id: null,
    })
    if (profileError) return profileError.message
    return null
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
    setPartner(null)
  }

  async function pairWithPartner(code: string) {
    const { data, error } = await supabase.rpc('pair_with_partner', { partner_code: code.toUpperCase() })
    if (error) return error.message
    if (data) return data as string
    await fetchProfile(user!.id)
    return null
  }

  return (
    <AuthContext.Provider value={{ user, profile, partner, session, loading, signIn, signUp, signOut, pairWithPartner, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
