import { useEffect, useState } from 'react'
import { View, ScrollView, StyleSheet, Pressable } from 'react-native'
import { Text, Button, TextInput, useTheme, ActivityIndicator, Snackbar } from 'react-native-paper'
import * as Haptics from 'expo-haptics'
import { format, addDays } from 'date-fns'
import { sv } from 'date-fns/locale'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useAuth } from '@/contexts/AuthContext'
import { useMode } from '@/contexts/ModeContext'
import { supabase } from '@/lib/supabase'
import type { Service, Order } from '@/types'

export default function HomeScreen() {
  const { partner, profile } = useAuth()
  const { mode } = useMode()
  const theme = useTheme()
  const [services, setServices] = useState<Service[]>([])
  const [activeOrders, setActiveOrders] = useState<Order[]>([])
  const [todayBlockedIds, setTodayBlockedIds] = useState<Set<string>>(new Set())
  const [partnerBlockedIds, setPartnerBlockedIds] = useState<Set<string>>(new Set())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successTitle, setSuccessTitle] = useState('')

  useEffect(() => {
    if (!partner) return
    loadData()
    loadTodayBlocked()
    const channel = supabase.channel('home-native-availability')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_availability' }, () => loadTodayBlocked())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [partner, mode])

  useEffect(() => {
    if (selectedDate && partner) loadPartnerBlocked(selectedDate)
    else setPartnerBlockedIds(new Set())
  }, [selectedDate, partner])

  async function loadData() {
    setLoading(true)
    const [servicesRes, inboxRes, sentRes] = await Promise.all([
      supabase.from('services').select('*').eq('user_id', partner!.id).eq('mode', mode).eq('active', true),
      supabase.from('orders').select('*, service:services(*)').eq('to_user_id', profile!.id).eq('status', 'accepted'),
      supabase.from('orders').select('*, service:services(*)').eq('from_user_id', profile!.id).eq('status', 'accepted'),
    ])
    setServices(servicesRes.data ?? [])
    setActiveOrders([...(inboxRes.data ?? []), ...(sentRes.data ?? [])])
    setLoading(false)
  }

  async function loadTodayBlocked() {
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('service_availability')
      .select('service_id')
      .eq('user_id', partner!.id)
      .eq('date', today)
    setTodayBlockedIds(new Set((data ?? []).map((r: { service_id: string }) => r.service_id)))
  }

  async function loadPartnerBlocked(date: string) {
    const { data } = await supabase
      .from('service_availability')
      .select('service_id')
      .eq('user_id', partner!.id)
      .eq('date', date)
    setPartnerBlockedIds(new Set((data ?? []).map((r: { service_id: string }) => r.service_id)))
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const days = Array.from({ length: 14 }, (_, i) => format(addDays(new Date(), i), 'yyyy-MM-dd'))

  async function placeOrder() {
    if (!selectedService || !profile || !partner) return
    setOrdering(true)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    const title = selectedService.title
    await supabase.from('orders').insert({
      from_user_id: profile.id,
      to_user_id: partner.id,
      service_id: selectedService.id,
      date: selectedDate,
      status: 'pending',
      note: note || null,
      mode,
    })
    fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ record: { to_user_id: partner.id, from_user_id: profile.id, service_id: selectedService.id, mode } }),
    }).catch(() => {})
    setSuccessTitle(title)
    setSuccess(true)
    setSelectedService(null)
    setSelectedDate(null)
    setNote('')
    setOrdering(false)
    loadData()
  }

  const upcomingOrders = activeOrders.filter(o => o.from_user_id === profile!.id)

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      {/* Kommande önskningar */}
      {upcomingOrders.length > 0 && (
        <View style={styles.section}>
          <Text variant="labelSmall" style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
            NI HAR PLANERAT
          </Text>
          {upcomingOrders.map(order => (
            <View key={order.id} style={[styles.orderCard, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.orderAccent, { backgroundColor: theme.colors.primary }]} />
              <View style={styles.orderContent}>
                <View style={styles.orderHeader}>
                  <MaterialCommunityIcons name="check-circle" size={14} color={theme.colors.primary} />
                  <Text variant="labelSmall" style={{ color: theme.colors.primary, marginLeft: 4, fontWeight: '700' }}>
                    INTRESSERAD
                  </Text>
                </View>
                <Text variant="titleMedium" style={{ fontWeight: '700' }}>
                  {order.service?.title ?? 'Okänd önskan'}
                </Text>
                {order.date && (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                    {format(new Date(order.date), 'EEEE d MMMM', { locale: sv })}
                  </Text>
                )}
                {order.response_note && (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                    {order.response_note}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Partner services */}
      <View style={styles.section}>
        <Text variant="labelSmall" style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
          {partner?.name?.toUpperCase()}S IDÉER
        </Text>

        {services.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: theme.colors.outline }]}>
            <MaterialCommunityIcons name="heart-outline" size={36} color={theme.colors.outlineVariant} style={{ marginBottom: 8 }} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              {partner?.name} har inga idéer ännu
            </Text>
          </View>
        ) : (
          services.map(service => {
            const selected = selectedService?.id === service.id
            const blockedForDate = selectedDate ? partnerBlockedIds.has(service.id) : false
            const blockedToday = !selectedDate && todayBlockedIds.has(service.id)
            const isBlocked = blockedForDate || blockedToday
            return (
              <Pressable
                key={service.id}
                onPress={() => {
                  if (isBlocked) return
                  setSelectedService(selected ? null : service)
                  Haptics.selectionAsync()
                }}
                style={[
                  styles.serviceCard,
                  {
                    backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surface,
                    borderColor: selected ? theme.colors.primary : theme.colors.outlineVariant,
                    borderWidth: selected ? 2 : 1,
                    opacity: isBlocked ? 0.45 : 1,
                  }
                ]}
              >
                <View style={styles.serviceCardInner}>
                  <View style={{ flex: 1 }}>
                    <Text variant="titleSmall" style={{ fontWeight: '700' }}>{service.title}</Text>
                    {service.description && (
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                        {service.description}
                      </Text>
                    )}
                    {isBlocked && (
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                        {selectedDate ? 'Inte öppen för detta den dagen' : 'Inte öppen för detta idag'}
                      </Text>
                    )}
                  </View>
                  {selected && (
                    <MaterialCommunityIcons name="check-circle" size={22} color={theme.colors.primary} />
                  )}
                </View>
              </Pressable>
            )
          })
        )}
      </View>

      {/* Date picker */}
      {selectedService && (
        <View style={styles.section}>
          <Text variant="labelSmall" style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
            FÖRESLÅ DATUM (VALFRITT)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.datePicker}>
              {/* Any date chip */}
              <Pressable
                onPress={() => { setSelectedDate(null); Haptics.selectionAsync() }}
                style={[
                  styles.dateChip,
                  {
                    backgroundColor: selectedDate === null ? theme.colors.primary : theme.colors.surface,
                    borderColor: selectedDate === null ? theme.colors.primary : theme.colors.outlineVariant,
                  }
                ]}
              >
                <Text variant="labelSmall" style={{ color: selectedDate === null ? '#fff' : theme.colors.onSurfaceVariant, textTransform: 'uppercase' }}>
                  Valfri
                </Text>
                <Text variant="titleMedium" style={{ color: selectedDate === null ? '#fff' : theme.colors.onSurface, fontWeight: '700' }}>
                  –
                </Text>
              </Pressable>
              {days.map(dateStr => {
                const d = new Date(dateStr)
                const sel = selectedDate === dateStr
                const isToday = dateStr === todayStr
                return (
                  <Pressable
                    key={dateStr}
                    onPress={() => { setSelectedDate(prev => prev === dateStr ? null : dateStr); Haptics.selectionAsync() }}
                    style={[
                      styles.dateChip,
                      {
                        backgroundColor: sel ? theme.colors.primary : theme.colors.surface,
                        borderColor: sel ? theme.colors.primary : isToday ? theme.colors.primary : theme.colors.outlineVariant,
                      }
                    ]}
                  >
                    <Text variant="labelSmall" style={{ color: sel ? '#fff' : theme.colors.onSurfaceVariant, textTransform: 'uppercase' }}>
                      {isToday && !sel ? 'Idag' : format(d, 'EEE', { locale: sv })}
                    </Text>
                    <Text variant="titleMedium" style={{ color: sel ? '#fff' : theme.colors.onSurface, fontWeight: '700' }}>
                      {format(d, 'd')}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {selectedService && (
        <View style={styles.section}>
          <TextInput
            label="Meddelande (valfritt)"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={2}
            mode="outlined"
          />
        </View>
      )}

      {selectedService && (
        <Button
          mode="contained"
          onPress={placeOrder}
          loading={ordering}
          disabled={ordering}
          style={styles.orderBtn}
          contentStyle={{ paddingVertical: 8 }}
          labelStyle={{ fontSize: 16, fontWeight: '700' }}
          icon="send"
        >
          Önska {selectedService.title}
        </Button>
      )}

      <Snackbar visible={success} onDismiss={() => setSuccess(false)} duration={4000}>
        Önskan skickad! {successTitle} → {partner?.name}
      </Snackbar>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16, gap: 8, paddingBottom: 100 },
  section: { gap: 8, marginBottom: 8 },
  sectionLabel: { fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
  orderCard: { borderRadius: 12, flexDirection: 'row', overflow: 'hidden', elevation: 1 },
  orderAccent: { width: 4 },
  orderContent: { flex: 1, padding: 14, gap: 2 },
  orderHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  emptyBox: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 12, padding: 32, alignItems: 'center' },
  serviceCard: { borderRadius: 12, padding: 14 },
  serviceCardInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  datePicker: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  dateChip: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, minWidth: 52 },
  orderBtn: { borderRadius: 14, marginTop: 8 },
})
