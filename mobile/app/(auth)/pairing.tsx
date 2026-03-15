import { useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { Text, TextInput, Button, Surface, HelperText, useTheme, IconButton, Snackbar } from 'react-native-paper'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import { useAuth } from '@/contexts/AuthContext'

export default function PairingScreen() {
  const { profile, pairWithPartner, signOut } = useAuth()
  const theme = useTheme()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handlePair() {
    if (code.length < 6) return
    setError('')
    setLoading(true)
    const err = await pairWithPartner(code)
    if (err) setError(err)
    setLoading(false)
  }

  async function copyCode() {
    await Clipboard.setStringAsync(profile?.pairing_code ?? '')
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      <View style={styles.hero}>
        <Text style={styles.emoji}>💞</Text>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
          Koppla ihop
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
          Hej {profile?.name}! Koppla ihop med din partner.
        </Text>
      </View>

      {/* My code */}
      <Surface style={styles.card} elevation={1}>
        <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
          Din kod – skicka till din partner
        </Text>
        <View style={styles.codeRow}>
          <Text variant="displaySmall" style={[styles.code, { color: theme.colors.primary }]}>
            {profile?.pairing_code}
          </Text>
          <IconButton
            icon={copied ? 'check' : 'content-copy'}
            iconColor={theme.colors.primary}
            size={24}
            onPress={copyCode}
            accessibilityLabel={copied ? 'Kopierat' : 'Kopiera parningskod'}
          />
        </View>
      </Surface>

      {/* Enter partner code */}
      <Surface style={styles.card} elevation={1}>
        <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
          Ange din partners kod
        </Text>

        <TextInput
          value={code}
          onChangeText={t => setCode(t.toUpperCase())}
          placeholder="T.ex. AB1C2D"
          maxLength={6}
          autoCapitalize="characters"
          mode="outlined"
          style={styles.codeInput}
          contentStyle={styles.codeInputContent}
        />

        {error ? (
          <HelperText type="error" visible style={{ marginBottom: 4 }}>
            {error}
          </HelperText>
        ) : null}

        <Button
          mode="contained"
          onPress={handlePair}
          loading={loading}
          disabled={loading || code.length < 6}
          style={styles.btn}
          contentStyle={{ paddingVertical: 6 }}
          labelStyle={{ fontSize: 16, fontWeight: '700' }}
        >
          Koppla ihop
        </Button>
      </Surface>

      <Button
        mode="text"
        onPress={signOut}
        textColor={theme.colors.onSurfaceVariant}
        style={{ marginTop: 8 }}
      >
        Logga ut
      </Button>

      <Snackbar
        visible={copied}
        onDismiss={() => setCopied(false)}
        duration={2000}
      >
        Kopierat till urklipp!
      </Snackbar>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 52,
    lineHeight: 64,
  },
  title: {
    fontWeight: '800',
    marginTop: 4,
  },
  card: {
    borderRadius: 20,
    padding: 20,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  code: {
    fontWeight: '900',
    letterSpacing: 6,
    fontVariant: ['tabular-nums'],
  },
  codeInput: {
    marginBottom: 8,
    textAlign: 'center',
  },
  codeInputContent: {
    textAlign: 'center',
    letterSpacing: 10,
    fontSize: 24,
    fontWeight: '700',
  },
  btn: {
    borderRadius: 12,
  },
})
