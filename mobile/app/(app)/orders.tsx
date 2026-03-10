import { useEffect, useState } from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { Text, Button, TextInput, useTheme, ActivityIndicator, SegmentedButtons } from 'react-native-paper'
import * as Haptics from 'expo-haptics'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Order } from '@/types'

const statusLabel: Record<Order['status'], string> = {
  pending: 'Väntar',
  accepted: 'Accepterad',
  declined: 'Nekad',
  completed: 'Klar',
}

const statusColor: Record<Order['status'], string> = {
  pending: '#F59E0B',
  accepted: '#22C55E',
  declined: '#EF4444',
  completed: '#94A3B8',
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadOrders())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tab])

  async function loadOrders() {
    setLoading(true)
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.tabBar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]}>
        <SegmentedButtons
          value={tab}
          onValueChange={setTab}
          buttons={[
            { value: 'inbox', label: 'Inkorg' },
            { value: 'sent', label: 'Skickade' },
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
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Inga {tab === 'inbox' ? 'inkommande' : 'utgående'} beställningar
              </Text>
            </View>
          ) : (
            orders.map(order => {
              const accentColor = statusColor[order.status]
              const isAccepting = acceptingId === order.id

              return (
                <View key={order.id} style={[styles.orderCard, { backgroundColor: theme.colors.surface }]}>
                  <View style={[styles.orderAccent, { backgroundColor: accentColor }]} />
                  <View style={styles.orderBody}>
                    <View style={styles.orderMeta}>
                      <View style={[styles.statusBadge, { backgroundColor: accentColor + '22' }]}>
                        <Text variant="labelSmall" style={{ color: accentColor, fontWeight: '700' }}>
                          {statusLabel[order.status].toUpperCase()}
                        </Text>
                      </View>
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {format(new Date(order.created_at), 'd MMM', { locale: sv })}
                      </Text>
                    </View>

                    <Text variant="titleSmall" style={{ fontWeight: '700', marginTop: 6 }}>
                      {order.service?.title ?? 'Okänd tjänst'}
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

                    {tab === 'inbox' && order.status === 'pending' && (
                      <View style={styles.actions}>
                        {isAccepting ? (
                          <>
                            <TextInput
                              label="När passar det?"
                              placeholder="T.ex. klockan 19..."
                              value={responseNote}
                              onChangeText={setResponseNote}
                              mode="outlined"
                              dense
                              style={styles.responseInput}
                            />
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
                              icon="close"
                              onPress={() => updateStatus(order.id, 'declined')}>
                              Neka
                            </Button>
                            <Button mode="contained" buttonColor="#22C55E"
                              style={styles.actionBtn}
                              icon="check"
                              onPress={() => setAcceptingId(order.id)}>
                              Acceptera
                            </Button>
                          </View>
                        )}
                      </View>
                    )}

                    {tab === 'inbox' && order.status === 'accepted' && (
                      <Button mode="outlined" icon="check-all" style={[styles.completeBtn, { borderColor: theme.colors.primary }]}
                        textColor={theme.colors.primary}
                        onPress={() => updateStatus(order.id, 'completed')}>
                        Markera som klar
                      </Button>
                    )}
                  </View>
                </View>
              )
            })
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  segmented: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    gap: 10,
    paddingBottom: 32,
  },
  emptyBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 40,
    marginTop: 8,
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
  orderBody: {
    flex: 1,
    padding: 14,
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  responseNote: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  actions: {
    marginTop: 12,
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
  },
  responseInput: {
    marginBottom: 4,
  },
  completeBtn: {
    marginTop: 12,
    borderRadius: 10,
  },
})
