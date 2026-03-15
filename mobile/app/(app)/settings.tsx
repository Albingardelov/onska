import { useState } from 'react'
import { View, ScrollView, Share, StyleSheet } from 'react-native'
import { Text, Button, Surface, Divider, useTheme, Dialog, Portal } from 'react-native-paper'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function SettingsScreen() {
  const { user, profile, signOut } = useAuth()
  const theme = useTheme()
  const [deleteVisible, setDeleteVisible] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  async function exportData() {
    if (!user) return
    setExporting(true)
    const [profileRes, servicesRes, sentRes, receivedRes, availRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('services').select('*').eq('user_id', user.id),
      supabase.from('orders').select('*').eq('from_user_id', user.id),
      supabase.from('orders').select('*').eq('to_user_id', user.id),
      supabase.from('availability').select('*').eq('user_id', user.id),
    ])
    const data = {
      exportedAt: new Date().toISOString(),
      profile: profileRes.data,
      services: servicesRes.data ?? [],
      sentOrders: sentRes.data ?? [],
      receivedOrders: receivedRes.data ?? [],
      availability: availRes.data ?? [],
    }
    await Share.share({ message: JSON.stringify(data, null, 2), title: 'Couply-data' })
    setExporting(false)
  }

  async function deleteAccount() {
    setDeleting(true)
    setError('')
    const { data: { session } } = await supabase.auth.getSession()
    const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? ''
    const res = await fetch(`${apiUrl}/api/delete-account`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })
    if (res.ok) {
      await signOut()
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Något gick fel')
      setDeleting(false)
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      {/* Account info */}
      <Text variant="labelSmall" style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
        KONTO
      </Text>
      <Surface style={styles.card} elevation={1}>
        <Text variant="titleSmall" style={{ fontWeight: '700' }}>{profile?.name}</Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>{user?.email}</Text>
      </Surface>

      <Divider style={styles.divider} />

      {/* GDPR */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="shield-lock" size={20} color={theme.colors.primary} />
          <Text variant="titleSmall" style={{ fontWeight: '700', marginLeft: 8 }}>GDPR & integritet</Text>
        </View>
        <Text variant="bodySmall" style={[styles.sectionText, { color: theme.colors.onSurfaceVariant }]}>
          Du har rätt att ta del av och radera all data vi har om dig. Nedan kan du exportera din
          information eller permanent radera ditt konto.
        </Text>
        <Button
          mode="outlined"
          icon="download"
          onPress={exportData}
          loading={exporting}
          disabled={exporting}
          style={styles.btn}
          accessibilityLabel="Exportera min data"
        >
          Exportera min data
        </Button>
        <Button
          mode="outlined"
          icon="delete-forever"
          textColor={theme.colors.error}
          style={[styles.btn, { borderColor: theme.colors.error }]}
          onPress={() => setDeleteVisible(true)}
          accessibilityLabel="Radera mitt konto"
        >
          Radera mitt konto
        </Button>
      </View>

      <Divider style={styles.divider} />

      {/* Accessibility */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="human" size={20} color={theme.colors.primary} />
          <Text variant="titleSmall" style={{ fontWeight: '700', marginLeft: 8 }}>Tillgänglighet</Text>
        </View>
        <Text variant="bodySmall" style={[styles.sectionText, { color: theme.colors.onSurfaceVariant }]}>
          Couply anpassar sig för alla skärmstorlekar och stöder systemets tillgänglighetsinställningar,
          skärmläsare och stora textstorlekar.
        </Text>
      </View>

      <Portal>
        <Dialog visible={deleteVisible} onDismiss={() => !deleting && setDeleteVisible(false)}>
          <Dialog.Title>Radera konto?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              All din data raderas permanent — profil, tjänster, beställningar och kalender. Det går inte att ångra.
            </Text>
            {error ? (
              <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 8 }}>{error}</Text>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteVisible(false)} disabled={deleting}>Avbryt</Button>
            <Button onPress={deleteAccount} disabled={deleting} textColor={theme.colors.error}>
              {deleting ? 'Raderar...' : 'Ja, radera allt'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 0,
    paddingBottom: 100,
  },
  sectionLabel: {
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  divider: {
    marginBottom: 20,
  },
  section: {
    gap: 12,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionText: {
    lineHeight: 20,
  },
  btn: {
    borderRadius: 10,
  },
})
