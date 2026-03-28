import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, push_subscription, partner_id')
    .is('status', null)
    .not('push_subscription', 'is', null)
    .not('partner_id', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!users?.length) return NextResponse.json({ success: true, sent: 0 })

  const partnerIds = users.map(u => u.partner_id)
  const { data: partners } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', partnerIds)

  const partnerMap = Object.fromEntries((partners ?? []).map(p => [p.id, p.name]))

  let sent = 0
  await Promise.all(users.map(async (user) => {
    const partnerName = partnerMap[user.partner_id] ?? 'din partner'
    try {
      await webpush.sendNotification(
        JSON.parse(user.push_subscription),
        JSON.stringify({
          title: 'Hur mår du idag? 💛',
          body: `Berätta för ${partnerName} hur du känner dig just nu`,
          icon: '/icon.svg',
          url: '/',
        })
      )
      sent++
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode
      if (status === 410 || status === 404) {
        await supabase.from('profiles').update({ push_subscription: null }).eq('id', user.id)
      }
    }
  }))

  return NextResponse.json({ success: true, sent })
}
