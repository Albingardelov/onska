import { useEffect, useState } from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { Text, Button, TextInput, useTheme, ActivityIndicator, IconButton, Snackbar } from 'react-native-paper'
import * as Haptics from 'expo-haptics'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Service } from '@/types'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

export default function ServicesScreen() {
  const { profile } = useAuth()
  const theme = useTheme()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleted, setDeleted] = useState(false)

  useEffect(() => { loadServices() }, [])

  async function loadServices() {
    setLoading(true)
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('user_id', profile!.id)
      .order('created_at', { ascending: true })
    setServices(data ?? [])
    setLoading(false)
  }

  async function addService() {
    if (!title.trim()) return
    setSaving(true)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await supabase.from('services').insert({
      user_id: profile!.id,
      title: title.trim(),
      description: description.trim() || null,
      mode: 'fint',
      active: true,
    })
    setTitle('')
    setDescription('')
    setShowForm(false)
    setSaving(false)
    loadServices()
  }

  async function deleteService(id: string) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await supabase.from('services').delete().eq('id', id)
    setServices(prev => prev.filter(s => s.id !== id))
    setDeleted(true)
  }

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.list}>
        <Text variant="bodySmall" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          {services.length} tjänst{services.length !== 1 ? 'er' : ''}
        </Text>

        {/* Add form */}
        {showForm ? (
          <View style={[styles.formCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]}>
            <TextInput
              label="Namn på tjänst"
              value={title}
              onChangeText={setTitle}
              placeholder="T.ex. Ryggmassage"
              mode="outlined"
              autoFocus
              style={styles.formInput}
            />
            <TextInput
              label="Beskrivning (valfritt)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
              mode="outlined"
              style={styles.formInput}
            />
            <View style={styles.formActions}>
              <Button mode="outlined" textColor={theme.colors.onSurface}
                style={[styles.formBtn, { borderColor: theme.colors.outline }]}
                onPress={() => { setShowForm(false); setTitle(''); setDescription('') }}>
                Avbryt
              </Button>
              <Button mode="contained" style={styles.formBtn}
                disabled={saving || !title.trim()}
                onPress={addService}>
                {saving ? '...' : 'Lägg till'}
              </Button>
            </View>
          </View>
        ) : (
          <View style={[styles.addBtn, { borderColor: theme.colors.outlineVariant }]}>
            <Button
              mode="text"
              icon="plus"
              textColor={theme.colors.onSurfaceVariant}
              onPress={() => setShowForm(true)}
              contentStyle={{ paddingVertical: 8 }}
            >
              Lägg till tjänst
            </Button>
          </View>
        )}

        {/* Service list */}
        {services.length === 0 && !showForm ? (
          <View style={[styles.emptyBox, { borderColor: theme.colors.outline }]}>
            <MaterialCommunityIcons name="star-outline" size={40} color={theme.colors.outlineVariant} style={{ marginBottom: 8 }} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              Inga tjänster ännu{'\n'}Lägg till din första ovan
            </Text>
          </View>
        ) : (
          services.map(service => (
            <View
              key={service.id}
              style={[styles.serviceCard, { backgroundColor: theme.colors.surface }]}
            >
              <View style={styles.serviceInfo}>
                <Text variant="titleSmall" style={{ fontWeight: '700' }}>{service.title}</Text>
                {service.description && (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                    {service.description}
                  </Text>
                )}
              </View>
              <IconButton
                icon="delete-outline"
                iconColor={theme.colors.onSurfaceVariant}
                size={20}
                onPress={() => deleteService(service.id)}
              />
            </View>
          ))
        )}
      </ScrollView>

      <Snackbar visible={deleted} onDismiss={() => setDeleted(false)} duration={2000}>
        Tjänst borttagen
      </Snackbar>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: {
    padding: 16,
    gap: 10,
    paddingBottom: 100,
  },
  subtitle: {
    marginBottom: 4,
  },
  formCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    gap: 10,
  },
  formInput: {
    marginBottom: 0,
  },
  formActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  formBtn: {
    flex: 1,
    borderRadius: 10,
  },
  addBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    overflow: 'hidden',
  },
  emptyBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 40,
    alignItems: 'center',
    marginTop: 8,
  },
  serviceCard: {
    borderRadius: 12,
    padding: 14,
    paddingRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  serviceInfo: {
    flex: 1,
  },
})
