import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await adminSupabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = user.id

  // Unlink partner (if someone is paired with this user, remove that link)
  await adminSupabase.from('profiles').update({ partner_id: null }).eq('partner_id', userId)

  // Delete all user data
  await adminSupabase.from('orders').delete().or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
  await adminSupabase.from('services').delete().eq('user_id', userId)
  await adminSupabase.from('availability').delete().eq('user_id', userId)
  await adminSupabase.from('profiles').delete().eq('id', userId)

  // Delete auth user
  const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(userId)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
