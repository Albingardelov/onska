import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    webpush.setVapidDetails(
      'mailto:noreply@onska.app',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    )
  } catch (e) {
    return NextResponse.json({ error: 'VAPID init failed', detail: String(e) }, { status: 500 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { from_user_id, to_user_id } = await req.json()
  if (!from_user_id || !to_user_id) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  const [{ data: recipient }, { data: sender }] = await Promise.all([
    supabase.from('profiles').select('push_subscription').eq('id', to_user_id).single(),
    supabase.from('profiles').select('name').eq('id', from_user_id).single(),
  ])

  if (!recipient?.push_subscription) return NextResponse.json({ message: 'No subscription' })

  try {
    await webpush.sendNotification(
      JSON.parse(recipient.push_subscription),
      JSON.stringify({
        title: sender?.name ?? 'Din partner',
        body: 'tänker på dig 💛',
        icon: '/icon.svg',
        url: '/',
      })
    )
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode
    if (status === 410 || status === 404) {
      await supabase.from('profiles').update({ push_subscription: null }).eq('id', to_user_id)
    }
    return NextResponse.json({ message: 'Push failed', status })
  }
}
