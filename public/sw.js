self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Önska', {
      body: data.body ?? '',
      icon: data.icon ?? '/icon.svg',
      badge: data.icon ?? '/icon.svg',
      tag: 'onska',
      data: { url: data.url ?? '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url ?? '/', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const appClient = clients.find(c => c.url.startsWith(self.location.origin))
      if (appClient) {
        return appClient.navigate(url).then(c => c && c.focus())
      }
      return self.clients.openWindow(url)
    })
  )
})
