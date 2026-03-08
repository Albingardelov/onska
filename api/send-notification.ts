import type { VercelRequest, VercelResponse } from '@vercel/node'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    webpush.setVapidDetails(
      'mailto:noreply@onska.app',
      process.env.VITE_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    )
  } catch (e) {
    return res.status(500).json({ error: 'VAPID init failed', detail: String(e) })
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { record } = req.body
  if (!record?.to_user_id) return res.status(400).json({ error: 'Missing data' })

  const [{ data: profile }, { data: service }, { data: sender }] = await Promise.all([
    supabase.from('profiles').select('push_subscription').eq('id', record.to_user_id).single(),
    supabase.from('services').select('title').eq('id', record.service_id).single(),
    supabase.from('profiles').select('name').eq('id', record.from_user_id).single(),
  ])

  if (!profile?.push_subscription) return res.status(200).json({ message: 'No subscription' })

  const emoji = record.mode === 'snusk' ? '🔥' : '🌸'
  const isAccepted = record.status === 'accepted'

  try {
    await webpush.sendNotification(
      JSON.parse(profile.push_subscription),
      JSON.stringify({
        title: isAccepted ? `Beställning accepterad! ${emoji}` : `Ny beställning! ${emoji}`,
        body: isAccepted
          ? `${sender?.name ?? 'Din partner'} har accepterat ${service?.title ?? 'din beställning'}`
          : `${sender?.name ?? 'Din partner'} vill ha ${service?.title ?? 'något'}`,
        url: '/bestallningar',
      })
    )
    res.status(200).json({ success: true })
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode
    if (status === 410 || status === 404) {
      // Subscription expired – clean it up
      await supabase.from('profiles').update({ push_subscription: null }).eq('id', record.to_user_id)
    }
    res.status(200).json({ message: 'Push failed', status })
  }
}
