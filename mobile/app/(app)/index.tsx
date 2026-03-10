import { useEffect, useState } from 'react'
import { View, ScrollView, StyleSheet, Pressable } from 'react-native'
import { Text, Button, TextInput, Chip, useTheme, ActivityIndicator, Snackbar } from 'react-native-paper'
import * as Haptics from 'expo-haptics'
import { format, addDays } from 'date-fns'
import { sv } from 'date-fns/locale'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Service, Availability, Order } from '@/types'

export default function HomeScreen() {
  const { partner, profile } = useAuth()
  const theme = useTheme()
  const [services, setServices] = useState<Service[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [activeOrders, setActiveOrders] = useState<Order[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (partner) loadData()
  }, [partner])

  async function loadData() {
    setLoading(true)
    const today = format(new Date(), 'yyyy-MM-dd')
    const [servicesRes, availRes, inboxRes, sentRes] = await Promise.all([
      supabase.from('services').select('*').eq('user_id', partner!.id).eq('active', true),
      supabase.from('availability').select('*').eq('user_id', partner!.id).gte('date', today),
      supabase.from('orders').select('*, service:services(*)').eq('to_user_id', profile!.id).eq('status', 'accepted'),
      supabase.from('orders').select('*, service:services(*)').eq('from_user_id', profile!.id).eq('status', 'accepted'),
    ])
    setServices(servicesRes.data ?? [])
    setAvailability(availRes.data ?? [])
    setActiveOrders([...(inboxRes.data ?? []), ...(sentRes.data ?? [])])
    setLoading(false)
  }

  function isDateBlocked(dateStr: string) {
    const found = availability.find(a => a.date === dateStr)
    return found ? !found.available : false
  }

  const days = Array.from({ length: 14 }, (_, i) => format(addDays(new Date(), i), 'yyyy-MM-dd'))
    .filter(d => !isDateBlocked(d))

  async function placeOrder() {
    if (!selectedService || !profile || !partner) return
    setOrdering(true)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await supabase.from('orders').insert({
      from_user_id: profile.id,
      to_user_id: partner.id,
      service_id: selectedService.id,
      date: selectedDate,
      status: 'pending',
      note: note || null,
      mode: 'fint',
    })
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
      {/* Kommande bokningar */}
      {upcomingOrders.length > 0 && (
        <View style={styles.section}>
          <Text variant="labelSmall" style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
            KOMMANDE BOKNINGAR
          </Text>
          {upcomingOrders.map(order => (
            <View
              key={order.id}
              style={[styles.orderCard, { backgroundColor: theme.colors.surface }]}
            >
              <View style={[styles.orderAccent, { backgroundColor: theme.colors.primary }]} />
              <View style={styles.orderContent}>
                <View style={styles.orderHeader}>
                  <MaterialCommunityIcons name="check-circle" size={14} color={theme.colors.primary} />
                  <Text variant="labelSmall" style={{ color: theme.colors.primary, marginLeft: 4, fontWeight: '700' }}>
                    ACCEPTERAD
                  </Text>
                </View>
                <Text variant="titleMedium" style={{ fontWeight: '700' }}>
                  {order.service?.title ?? 'Okänd tjänst'}
                </Text>
                {order.date && (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                    {format(new Date(order.date), 'EEEE d MMMM', { locale: sv })}
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
          BESTÄLL AV {partner?.name?.toUpperCase()}
        </Text>

        {services.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: theme.colors.outline }]}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              {partner?.name} har inga tjänster ännu
            </Text>
          </View>
        ) : (
          services.map(service => {
            const selected = selectedService?.id === service.id
            return (
              <Pressable
                key={service.id}
                onPress={() => {
                  setSelectedService(selected ? null : service)
                  Haptics.selectionAsync()
                }}
                style={[
                  styles.serviceCard,
                  {
                    backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surface,
                    borderColor: selected ? theme.colors.primary : theme.colors.outlineVariant,
                    borderWidth: selected ? 2 : 1,
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
            VÄLJ DATUM (VALFRITT)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.datePicker}>
              {days.map(dateStr => {
                const d = new Date(dateStr)
                const sel = selectedDate === dateStr
                return (
                  <Pressable
                    key={dateStr}
                    onPress={() => {
                      setSelectedDate(prev => prev === dateStr ? null : dateStr)
                      Haptics.selectionAsync()
                    }}
                    style={[
                      styles.dateChip,
                      {
                        backgroundColor: sel ? theme.colors.primary : theme.colors.surface,
                        borderColor: sel ? theme.colors.primary : theme.colors.outlineVariant,
                      }
                    ]}
                  >
                    <Text variant="labelSmall" style={{ color: sel ? '#fff' : theme.colors.onSurfaceVariant, textTransform: 'uppercase' }}>
                      {format(d, 'EEE', { locale: sv })}
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
          icon="shopping"
        >
          Beställ {selectedService.title}
        </Button>
      )}

      <Snackbar visible={success} onDismiss={() => setSuccess(false)} duration={3000}>
        Beställning skickad!
      </Snackbar>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 16,
    gap: 8,
    paddingBottom: 32,
  },
  section: {
    gap: 8,
    marginBottom: 8,
  },
  sectionLabel: {
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  orderCard: {
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 1,
  },
  orderAccent: {
    width: 4,
  },
  orderContent: {
    flex: 1,
    padding: 14,
    gap: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  emptyBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  serviceCard: {
    borderRadius: 12,
    padding: 14,
  },
  serviceCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  datePicker: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  dateChip: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    minWidth: 48,
  },
  orderBtn: {
    borderRadius: 14,
    marginTop: 8,
  },
})
