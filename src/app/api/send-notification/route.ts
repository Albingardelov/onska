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

  const body = await req.json()
  const { record } = body
  if (!record?.to_user_id) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  const [{ data: profile }, { data: service }, { data: sender }] = await Promise.all([
    supabase.from('profiles').select('push_subscription').eq('id', record.to_user_id).single(),
    supabase.from('services').select('title').eq('id', record.service_id).single(),
    supabase.from('profiles').select('name').eq('id', record.from_user_id).single(),
  ])

  if (!profile?.push_subscription) return NextResponse.json({ message: 'No subscription' })

  const isAccepted = record.status === 'accepted'

  try {
    await webpush.sendNotification(
      JSON.parse(profile.push_subscription),
      JSON.stringify({
        title: isAccepted ? 'Ny önskan intressant!' : 'Ny önskan från din partner',
        body: isAccepted
          ? `${sender?.name ?? 'Din partner'} är intresserad av ${service?.title ?? 'din önskan'}`
          : `${sender?.name ?? 'Din partner'} har delat en ny önskan`,
        url: '/wishes',
      })
    )
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode
    if (status === 410 || status === 404) {
      await supabase.from('profiles').update({ push_subscription: null }).eq('id', record.to_user_id)
    }
    return NextResponse.json({ message: 'Push failed', status })
  }
}
