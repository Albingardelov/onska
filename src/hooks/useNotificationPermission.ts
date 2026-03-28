import { useState, useEffect } from 'react'
import { subscribeToPush } from '../lib/notifications'

export type NotifStatus = 'unknown' | 'granted' | 'denied' | 'unsupported'

function readPermission(): NotifStatus {
  if (typeof window === 'undefined') return 'unknown'
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return 'unknown'
}

export function useNotificationPermission(userId: string | undefined) {
  const [notifStatus, setNotifStatus] = useState<NotifStatus>('unknown')
  const [activating, setActivating] = useState(false)

  useEffect(() => {
    setNotifStatus(readPermission())
  }, [])

  async function enableNotifications() {
    if (!userId) return
    setActivating(true)
    await subscribeToPush(userId)
    setNotifStatus(readPermission())
    setActivating(false)
  }

  return { notifStatus, activating, enableNotifications }
}
