import { useEffect, useState } from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { Text, Button, TextInput, useTheme, ActivityIndicator, SegmentedButtons, Chip } from 'react-native-paper'
import * as Haptics from 'expo-haptics'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { sv } from 'date-fns/locale'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Order } from '@/types'

const statusLabel: Record<Order['status'], string> = {
  pending: 'Väntar',
  accepted: 'Intresserad',
  declined: 'Inte nu',
  completed: 'Klar',
}

const statusColor: Record<Order['status'], string> = {
  pending: '#F59E0B',
  accepted: '#22C55E',
  declined: '#94A3B8',
  completed: '#94A3B8',
}

function weekLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const start = startOfWeek(d, { weekStartsOn: 1 })
  const end = endOfWeek(d, { weekStartsOn: 1 })
  return `${format(start, 'd MMM', { locale: sv })} – ${format(end, 'd MMM', { locale: sv })}`
}

function weekKey(dateStr: string): string {
  return format(startOfWeek(new Date(dateStr), { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

export default function OrdersScreen() {
  const { profile } = useAuth()
  const theme = useTheme()
  const [tab, setTab] = useState('inbox')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [responseNote, setResponseNote] = useState('')

  useEffect(() => {
    loadOrders()
    const channel = supabase.channel('orders-native')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadOrders(true))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tab])

  async function loadOrders(silent = false) {
    if (!silent) setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, service:services(*)')
      .eq(tab === 'inbox' ? 'to_user_id' : 'from_user_id', profile!.id)
      .order('created_at', { ascending: false })
    setOrders(data ?? [])
    setLoading(false)
  }

  async function acceptOrder(id: string) {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    await supabase.from('orders').update({ status: 'accepted', response_note: responseNote.trim() || null }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'accepted', response_note: responseNote.trim() || null } : o))
    setAcceptingId(null)
    setResponseNote('')
  }

  async function updateStatus(id: string, status: Order['status']) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await supabase.from('orders').update({ status }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  async function deleteOrder(id: string) {
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (!error) setOrders(prev => prev.filter(o => o.id !== id))
  }

  const active = orders.filter(o => o.status === 'pending' || o.status === 'accepted')
  const history = orders.filter(o => o.status === 'completed' || o.status === 'declined')

  const historyByWeek = history.reduce<Record<string, Order[]>>((acc, o) => {
    const key = weekKey(o.created_at)
    ;(acc[key] ??= []).push(o)
    return acc
  }, {})
  const weekKeys = Object.keys(historyByWeek).sort().reverse()

  function renderOrder(order: Order, showDelete = false) {
    const accentColor = statusColor[order.status]
    const isAccepting = acceptingId === order.id

    return (
      <View key={order.id} style={[styles.orderCard, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.orderAccent, { backgroundColor: accentColor }]} />
        <View style={styles.orderBody}>
          <View style={styles.orderMeta}>
            <View style={styles.metaLeft}>
              <MaterialCommunityIcons
                name={order.mode === 'fint' ? 'weather-sunny' : 'weather-night'}
                size={14}
                color={theme.colors.onSurfaceVariant}
              />
              <View style={[styles.statusBadge, { backgroundColor: accentColor + '22', marginLeft: 6 }]}>
                <Text variant="labelSmall" style={{ color: accentColor, fontWeight: '700' }}>
                  {statusLabel[order.status].toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.metaRight}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {format(new Date(order.created_at), 'd MMM', { locale: sv })}
              </Text>
              {showDelete && (
                <MaterialCommunityIcons
                  name="delete-outline"
                  size={16}
                  color={theme.colors.onSurfaceVariant}
                  style={{ marginLeft: 8 }}
                  onPress={() => deleteOrder(order.id)}
                />
              )}
            </View>
          </View>

          <Text variant="titleSmall" style={{ fontWeight: '700', marginTop: 6 }}>
            {order.service?.title ?? 'Okänd önskan'}
          </Text>

          {order.date && (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
              {format(new Date(order.date), 'd MMMM yyyy', { locale: sv })}
            </Text>
          )}

          {order.note && (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, fontStyle: 'italic', marginTop: 4 }}>
              "{order.note}"
            </Text>
          )}

          {order.response_note && (
            <View style={[styles.responseNote, { backgroundColor: theme.colors.primaryContainer }]}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={theme.colors.primary} />
              <Text variant="labelSmall" style={{ color: theme.colors.primary, marginLeft: 4 }}>
                {order.response_note}
              </Text>
            </View>
          )}

          {/* Inbox – pending */}
          {tab === 'inbox' && order.status === 'pending' && (
            <View style={styles.actions}>
              {isAccepting ? (
                <>
                  <TextInput
                    label="När passar det? (valfritt)"
                    placeholder="T.ex. klockan 19..."
                    value={responseNote}
                    onChangeText={setResponseNote}
                    mode="outlined"
                    dense
                    style={styles.responseInput}
                  />
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 18, marginBottom: 4 }}>
                    Att visa intresse skapar inga förväntningar. Ni kan alltid ändra er.
                  </Text>
                  <View style={styles.actionRow}>
                    <Button mode="outlined" textColor={theme.colors.onSurface}
                      style={[styles.actionBtn, { borderColor: theme.colors.outline }]}
                      onPress={() => { setAcceptingId(null); setResponseNote('') }}>
                      Avbryt
                    </Button>
                    <Button mode="contained" buttonColor="#22C55E"
                      style={styles.actionBtn}
                      icon="check"
                      onPress={() => acceptOrder(order.id)}>
                      Bekräfta
                    </Button>
                  </View>
                </>
              ) : (
                <View style={styles.actionRow}>
                  <Button mode="outlined" textColor="#EF4444"
                    style={[styles.actionBtn, { borderColor: '#EF4444' }]}
                    onPress={() => updateStatus(order.id, 'declined')}>
                    Inte nu
                  </Button>
                  <Button mode="contained" buttonColor="#22C55E"
                    style={styles.actionBtn}
                    icon="heart-outline"
                    onPress={() => setAcceptingId(order.id)}>
                    Ja, gärna!
                  </Button>
                </View>
              )}
            </View>
          )}

          {/* Inbox – accepted */}
          {tab === 'inbox' && order.status === 'accepted' && (
            <View style={[styles.actionRow, { marginTop: 12 }]}>
              <Button mode="outlined" textColor="#EF4444"
                style={[styles.actionBtn, { borderColor: '#EF4444' }]}
                onPress={() => updateStatus(order.id, 'declined')}>
                Ändra mig
              </Button>
              <Button mode="outlined" textColor={theme.colors.primary}
                style={[styles.actionBtn, { borderColor: theme.colors.primary }]}
                icon="archive-outline"
                onPress={() => updateStatus(order.id, 'completed')}>
                Arkivera
              </Button>
            </View>
          )}

          {/* Sent – accepted */}
          {tab === 'sent' && order.status === 'accepted' && (
            <Button mode="outlined" textColor="#EF4444"
              style={[styles.fullBtn, { borderColor: '#EF4444', marginTop: 12 }]}
              onPress={() => updateStatus(order.id, 'declined')}>
              Ändra mig
            </Button>
          )}

          {/* Sent – pending */}
          {tab === 'sent' && order.status === 'pending' && (
            <Button mode="outlined" textColor="#EF4444"
              style={[styles.fullBtn, { borderColor: '#EF4444', marginTop: 12 }]}
              onPress={() => updateStatus(order.id, 'declined')}>
              Dra tillbaka
            </Button>
          )}
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.tabBar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]}>
        <SegmentedButtons
          value={tab}
          onValueChange={setTab}
          buttons={[
            { value: 'inbox', label: 'Till mig' },
            { value: 'sent', label: 'Mina' },
          ]}
          style={styles.segmented}
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>

          {orders.length === 0 ? (
            <View style={[styles.emptyBox, { borderColor: theme.colors.outline }]}>
              <MaterialCommunityIcons
                name={tab === 'inbox' ? 'inbox-outline' : 'send-outline'}
                size={36}
                color={theme.colors.outlineVariant}
                style={{ marginBottom: 8 }}
              />
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Inga {tab === 'inbox' ? 'inkommande' : 'utgående'} önskningar
              </Text>
            </View>
          ) : (
            <>
              {active.map(o => renderOrder(o))}

              {weekKeys.length > 0 && (
                <View style={{ marginTop: active.length > 0 ? 8 : 0 }}>
                  <Text variant="labelSmall" style={[styles.historyLabel, { color: theme.colors.onSurfaceVariant }]}>
                    HISTORIK
                  </Text>
                  {weekKeys.map(key => (
                    <View key={key} style={[styles.weekGroup, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface }]}>
                      <View style={styles.weekHeader}>
                        <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                          {weekLabel(historyByWeek[key][0].created_at)}
                        </Text>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          {historyByWeek[key].length} st
                        </Text>
                      </View>
                      <View style={{ gap: 8 }}>
                        {historyByWeek[key].map(o => renderOrder(o, true))}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  segmented: { maxWidth: 400, alignSelf: 'center', width: '100%' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 10, paddingBottom: 100 },
  emptyBox: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 12, padding: 40, marginTop: 8, alignItems: 'center' },
  orderCard: { borderRadius: 12, flexDirection: 'row', overflow: 'hidden', elevation: 1 },
  orderAccent: { width: 4 },
  orderBody: { flex: 1, padding: 14 },
  orderMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaLeft: { flexDirection: 'row', alignItems: 'center' },
  metaRight: { flexDirection: 'row', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  responseNote: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start' },
  actions: { marginTop: 12, gap: 8 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, borderRadius: 10 },
  fullBtn: { borderRadius: 10 },
  responseInput: { marginBottom: 4 },
  historyLabel: { fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  weekGroup: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8, gap: 8 },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
})
