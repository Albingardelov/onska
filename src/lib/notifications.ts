import { supabase } from './supabase'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export async function subscribeToPush(userId: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return

  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
    })
  }

  await supabase.from('profiles').update({
    push_subscription: JSON.stringify(subscription),
  }).eq('id', userId)
}
