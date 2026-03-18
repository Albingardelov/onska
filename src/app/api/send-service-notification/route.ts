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
  if (!record?.user_id) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  const { data: creator } = await supabase
    .from('profiles')
    .select('name, partner_id')
    .eq('id', record.user_id)
    .single()

  if (!creator?.partner_id) return NextResponse.json({ message: 'No partner' })

  const { data: partner } = await supabase
    .from('profiles')
    .select('push_subscription')
    .eq('id', creator.partner_id)
    .single()

  if (!partner?.push_subscription) return NextResponse.json({ message: 'No subscription' })

  const isSnusk = record.mode === 'snusk'
  const name = creator.name ?? 'Din partner'
  const title = record.title ?? 'något nytt'

  try {
    await webpush.sendNotification(
      JSON.parse(partner.push_subscription),
      JSON.stringify({
        title: isSnusk ? 'Ny fantasi tillagd' : 'Ny omtanke tillagd',
        body: isSnusk
          ? `${name} har lagt till en ny fantasi: ${title}`
          : `${name} har lagt till en ny omtanke: ${title}`,
        icon: isSnusk ? '/icon-dark.svg' : '/icon.svg',
        url: '/',
      })
    )
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode
    if (status === 410 || status === 404) {
      await supabase.from('profiles').update({ push_subscription: null }).eq('id', creator.partner_id)
    }
    return NextResponse.json({ message: 'Push failed', status })
  }
}
