import { useEffect, useState } from 'react'
import { View, ScrollView, StyleSheet, Pressable, useWindowDimensions } from 'react-native'
import { Text, useTheme, IconButton, Surface, Switch } from 'react-native-paper'
import * as Haptics from 'expo-haptics'
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'
import { sv } from 'date-fns/locale'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Order, Service } from '@/types'

const WEEK_DAYS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

export default function CalendarScreen() {
  const { profile } = useAuth()
  const theme = useTheme()
  const { width } = useWindowDimensions()
  const cellSize = Math.floor((width - 32 - 24) / 7)

  const [orders, setOrders] = useState<Order[]>([])
  const [myServices, setMyServices] = useState<Service[]>([])
  const [blockedServiceIds, setBlockedServiceIds] = useState<Set<string>>(new Set())
  const [daysWithBlocked, setDaysWithBlocked] = useState<Set<string>>(new Set())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  useEffect(() => { loadOrders(); loadDaysWithBlocked() }, [currentMonth])
  useEffect(() => { loadMyServices() }, [])
  useEffect(() => {
    if (selectedDay) loadBlockedForDay(selectedDay)
    else setBlockedServiceIds(new Set())
  }, [selectedDay])

  async function loadOrders() {
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    const { data } = await supabase.from('orders').select('*, service:services(*)')
      .or(`from_user_id.eq.${profile!.id},to_user_id.eq.${profile!.id}`)
      .eq('status', 'accepted').not('date', 'is', null).gte('date', start).lte('date', end)
    setOrders(data ?? [])
  }

  async function loadDaysWithBlocked() {
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    const { data } = await supabase.from('service_availability').select('date')
      .eq('user_id', profile!.id).gte('date', start).lte('date', end)
    setDaysWithBlocked(new Set((data ?? []).map((r: { date: string }) => r.date)))
  }

  async function loadMyServices() {
    const { data } = await supabase.from('services').select('*')
      .eq('user_id', profile!.id).eq('active', true).order('created_at')
    setMyServices(data ?? [])
  }

  async function loadBlockedForDay(date: string) {
    const { data } = await supabase.from('service_availability').select('service_id')
      .eq('user_id', profile!.id).eq('date', date)
    setBlockedServiceIds(new Set((data ?? []).map((r: { service_id: string }) => r.service_id)))
  }

  async function toggleService(serviceId: string) {
    if (!selectedDay) return
    await Haptics.selectionAsync()
    const isBlocked = blockedServiceIds.has(serviceId)
    if (isBlocked) {
      await supabase.from('service_availability').delete()
        .eq('user_id', profile!.id).eq('service_id', serviceId).eq('date', selectedDay)
      setBlockedServiceIds(prev => { const s = new Set(prev); s.delete(serviceId); return s })
    } else {
      await supabase.from('service_availability').insert({ user_id: profile!.id, service_id: serviceId, date: selectedDay })
      setBlockedServiceIds(prev => new Set([...prev, serviceId]))
    }
    loadDaysWithBlocked()
  }

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const firstDayOffset = (getDay(days[0]) + 6) % 7
  const today = format(new Date(), 'yyyy-MM-dd')
  const ordersByDate = orders.reduce<Record<string, Order[]>>((acc, o) => {
    if (o.date) (acc[o.date] ??= []).push(o)
    return acc
  }, {})
  const upcoming = orders
    .filter(o => o.date && o.date >= today)
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      {/* Month nav */}
      <View style={styles.monthNav}>
        <IconButton
          icon="chevron-left"
          iconColor={theme.colors.onSurface}
          onPress={() => { setCurrentMonth(m => addDays(startOfMonth(m), -1)); setSelectedDay(null) }}
        />
        <Text variant="titleMedium" style={{ fontWeight: '700', textTransform: 'capitalize' }}>
          {format(currentMonth, 'MMMM yyyy', { locale: sv })}
        </Text>
        <IconButton
          icon="chevron-right"
          iconColor={theme.colors.onSurface}
          onPress={() => { setCurrentMonth(m => addDays(endOfMonth(m), 1)); setSelectedDay(null) }}
        />
      </View>

      {/* Day headers */}
      <View style={styles.grid}>
        {WEEK_DAYS.map(d => (
          <View key={d} style={[styles.cell, { width: cellSize }]}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '700' }}>
              {d}
            </Text>
          </View>
        ))}

        {Array.from({ length: firstDayOffset }, (_, i) => (
          <View key={`empty-${i}`} style={[styles.cell, { width: cellSize, height: cellSize }]} />
        ))}

        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const hasOrders = !!ordersByDate[dateStr]?.length
          const hasBlocked = daysWithBlocked.has(dateStr)
          const isSelected = selectedDay === dateStr
          const isPast = dateStr < today
          const isToday = dateStr === today

          return (
            <Pressable
              key={dateStr}
              onPress={() => { if (!isPast) setSelectedDay(isSelected ? null : dateStr); Haptics.selectionAsync() }}
              disabled={isPast}
              style={[
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: isSelected
                    ? theme.colors.primary
                    : isToday
                    ? theme.colors.surface
                    : 'transparent',
                  borderColor: isSelected
                    ? theme.colors.primary
                    : isToday
                    ? theme.colors.primary
                    : 'transparent',
                  borderWidth: isSelected || isToday ? 2 : 0,
                  opacity: isPast ? 0.35 : 1,
                  borderRadius: 8,
                }
              ]}
            >
              <Text
                variant="bodySmall"
                style={{
                  color: isSelected ? '#fff' : isToday ? theme.colors.primary : theme.colors.onSurface,
                  fontWeight: isToday || hasOrders ? '800' : '500',
                }}
              >
                {format(day, 'd')}
              </Text>
              {(hasOrders || hasBlocked) && (
                <View style={styles.dots}>
                  {hasOrders && (
                    <View style={[styles.dot, { backgroundColor: isSelected ? '#fff' : theme.colors.primary }]} />
                  )}
                  {hasBlocked && (
                    <View style={[styles.dot, { backgroundColor: isSelected ? '#fff' : '#F59E0B' }]} />
                  )}
                </View>
              )}
            </Pressable>
          )
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {[
          { color: theme.colors.primary, label: 'Planerat' },
          { color: '#F59E0B', label: 'Stängd för något' },
        ].map(({ color, label }) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Selected day panel */}
      {selectedDay && (
        <Surface style={[styles.dayPanel, { borderColor: theme.colors.primary }]} elevation={0}>
          <Text variant="labelSmall" style={{ color: theme.colors.primary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
            {format(new Date(selectedDay), 'EEEE d MMMM', { locale: sv })}
          </Text>

          {(ordersByDate[selectedDay] ?? []).map(o => (
            <View key={o.id} style={styles.orderRow}>
              <MaterialCommunityIcons name="heart" size={14} color={theme.colors.primary} />
              <Text variant="bodySmall" style={{ fontWeight: '600', marginLeft: 6 }}>
                {o.service?.title ?? 'Önskan'}
              </Text>
            </View>
          ))}

          {myServices.length > 0 && (
            <View style={{ marginTop: ordersByDate[selectedDay]?.length ? 12 : 0 }}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8, lineHeight: 18 }}>
                Vad är du öppen för den här dagen?
              </Text>
              {myServices.map(service => {
                const isBlocked = blockedServiceIds.has(service.id)
                return (
                  <View key={service.id} style={styles.serviceRow}>
                    <Text
                      variant="bodySmall"
                      style={{
                        flex: 1,
                        opacity: isBlocked ? 0.45 : 1,
                        textDecorationLine: isBlocked ? 'line-through' : 'none',
                      }}
                    >
                      {service.title}
                    </Text>
                    <Switch
                      value={!isBlocked}
                      onValueChange={() => toggleService(service.id)}
                      color={theme.colors.primary}
                    />
                  </View>
                )
              })}
            </View>
          )}

          {myServices.length === 0 && !ordersByDate[selectedDay]?.length && (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Inga idéer att ställa in ännu.
            </Text>
          )}
        </Surface>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <View style={styles.section}>
          <Text variant="labelSmall" style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
            PLANERAT FRAMÖVER
          </Text>
          {upcoming.map(o => (
            <View key={o.id} style={[styles.upcomingCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
              <MaterialCommunityIcons name="heart-outline" size={18} color={theme.colors.primary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text variant="bodySmall" style={{ fontWeight: '600' }}>{o.service?.title ?? 'Önskan'}</Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {format(new Date(o.date!), 'EEEE d MMMM', { locale: sv })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {orders.length === 0 && !selectedDay && (
        <View style={[styles.emptyBox, { borderColor: theme.colors.outline }]}>
          <MaterialCommunityIcons name="calendar-outline" size={36} color={theme.colors.outlineVariant} style={{ marginBottom: 8 }} />
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            Tryck på en dag för att ställa in din tillgänglighet
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 100 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: { alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  dots: { flexDirection: 'row', gap: 3, marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  legend: { flexDirection: 'row', gap: 20, marginTop: 12, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  dayPanel: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  orderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  section: { gap: 8, marginBottom: 8 },
  sectionLabel: { fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
  upcomingCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1 },
  emptyBox: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 12, padding: 32, alignItems: 'center', marginTop: 8 },
})
