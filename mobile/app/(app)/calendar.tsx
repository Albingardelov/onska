import { useEffect, useState } from 'react'
import { View, ScrollView, StyleSheet, Pressable } from 'react-native'
import { Text, useTheme, IconButton, Surface } from 'react-native-paper'
import * as Haptics from 'expo-haptics'
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'
import { sv } from 'date-fns/locale'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

const WEEK_DAYS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

export default function CalendarScreen() {
  const { profile } = useAuth()
  const theme = useTheme()
  const [availability, setAvailability] = useState<Map<string, boolean>>(new Map())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => { loadAvailability() }, [currentMonth])

  async function loadAvailability() {
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    const { data } = await supabase.from('availability').select('*')
      .eq('user_id', profile!.id).gte('date', start).lte('date', end)
    const map = new Map<string, boolean>()
    data?.forEach((a: { date: string; available: boolean }) => map.set(a.date, a.available))
    setAvailability(map)
  }

  async function toggleDay(dateStr: string) {
    const today = format(new Date(), 'yyyy-MM-dd')
    if (dateStr < today) return
    setSaving(dateStr)
    await Haptics.selectionAsync()
    const newVal = !(availability.get(dateStr) ?? true)
    await supabase.from('availability').upsert(
      { user_id: profile!.id, date: dateStr, available: newVal },
      { onConflict: 'user_id,date' }
    )
    setAvailability(prev => new Map(prev).set(dateStr, newVal))
    setSaving(null)
  }

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const firstDayOffset = (getDay(days[0]) + 6) % 7
  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      <Surface style={styles.infoCard} elevation={1}>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Tryck på en dag för att markera den som <Text style={{ fontWeight: '700' }}>inte ledig</Text>. Alla dagar är lediga om inget annat anges.
        </Text>
      </Surface>

      {/* Month nav */}
      <View style={styles.monthNav}>
        <IconButton
          icon="chevron-left"
          iconColor={theme.colors.onSurface}
          onPress={() => setCurrentMonth(m => addDays(startOfMonth(m), -1))}
        />
        <Text variant="titleMedium" style={{ fontWeight: '700', textTransform: 'capitalize' }}>
          {format(currentMonth, 'MMMM yyyy', { locale: sv })}
        </Text>
        <IconButton
          icon="chevron-right"
          iconColor={theme.colors.onSurface}
          onPress={() => setCurrentMonth(m => addDays(endOfMonth(m), 1))}
        />
      </View>

      {/* Day headers */}
      <View style={styles.grid}>
        {WEEK_DAYS.map(d => (
          <View key={d} style={styles.dayHeader}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '700' }}>
              {d}
            </Text>
          </View>
        ))}

        {/* Empty offset cells */}
        {Array.from({ length: firstDayOffset }, (_, i) => (
          <View key={`empty-${i}`} style={styles.dayCell} />
        ))}

        {/* Day cells */}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const isAvailable = availability.get(dateStr) ?? true
          const isPast = dateStr < today
          const isToday = dateStr === today
          const isSaving = saving === dateStr

          const bgColor = !isAvailable
            ? '#FEE2E2'
            : isToday
            ? theme.colors.primaryContainer
            : theme.colors.surface

          const borderColor = !isAvailable
            ? '#EF4444'
            : isToday
            ? theme.colors.primary
            : theme.colors.outlineVariant

          const textColor = !isAvailable
            ? '#DC2626'
            : isToday
            ? theme.colors.primary
            : theme.colors.onSurface

          return (
            <Pressable
              key={dateStr}
              onPress={() => toggleDay(dateStr)}
              disabled={isPast}
              style={[
                styles.dayCell,
                {
                  backgroundColor: bgColor,
                  borderColor,
                  borderWidth: isToday || !isAvailable ? 2 : 1,
                  opacity: isPast ? 0.35 : 1,
                }
              ]}
            >
              <Text
                variant="bodySmall"
                style={{ color: textColor, fontWeight: isToday ? '800' : '500' }}
              >
                {isSaving ? '·' : format(day, 'd')}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant, borderWidth: 1 }]} />
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Ledig</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: '#FEE2E2', borderColor: '#EF4444', borderWidth: 1 }]} />
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Inte ledig</Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  infoCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  dayHeader: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayCell: {
    width: `${100 / 7 - 1}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  legend: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
})
