import { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { Text, TextInput, Button, Surface, HelperText, useTheme, IconButton, Snackbar } from 'react-native-paper'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import AsyncStorage from '@react-native-async-storage/async-storage'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useAuth } from '@/contexts/AuthContext'

const ONBOARDING_KEY = 'couply_onboarding_seen'
const TOTAL_STEPS = 3

const HOW_IT_WORKS = [
  { icon: 'lightbulb-outline' as const, title: 'Lägg till idéer', desc: 'Berätta vad du är öppen för. Din partner ser dina idéer och kan önska dem.' },
  { icon: 'gift-outline' as const, title: 'Önska från din partner', desc: 'Bläddra bland partnerns idéer och skicka en önskan när du är sugen.' },
  { icon: 'heart-outline' as const, title: 'Svara i din takt', desc: 'Acceptera, säg "inte nu", eller ändra dig — utan att förklara varför.' },
]

export default function PairingScreen() {
  const { profile, pairWithPartner, signOut } = useAuth()
  const theme = useTheme()
  const [step, setStep] = useState(0)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
      if (val) setStep(2)
    })
  }, [])

  async function handleNext() {
    if (step === 1) {
      await AsyncStorage.setItem(ONBOARDING_KEY, '1')
    }
    setStep(s => s + 1)
  }

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
      {/* Step 1: Welcome */}
      {step === 0 && (
        <View style={styles.stepWrap}>
          <Text style={styles.emoji}>💞</Text>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
            Välkommen till Couply
          </Text>
          <Text variant="bodyLarge" style={[styles.body, { color: theme.colors.onSurfaceVariant }]}>
            En privat app för er två — önska från varandra, svara i din egen takt, utan press.
          </Text>
          <Button
            mode="contained"
            onPress={handleNext}
            style={styles.btn}
            contentStyle={{ paddingVertical: 8 }}
            labelStyle={{ fontSize: 16, fontWeight: '700' }}
          >
            Nästa
          </Button>
        </View>
      )}

      {/* Step 2: How it works */}
      {step === 1 && (
        <View style={styles.stepWrap}>
          <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
            Så funkar det
          </Text>
          <View style={styles.howList}>
            {HOW_IT_WORKS.map(({ icon, title, desc }) => (
              <View key={title} style={styles.howItem}>
                <MaterialCommunityIcons name={icon} size={28} color={theme.colors.primary} style={{ marginTop: 2 }} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text variant="titleSmall" style={{ fontWeight: '700' }}>{title}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2, lineHeight: 18 }}>{desc}</Text>
                </View>
              </View>
            ))}
          </View>
          <Button
            mode="contained"
            onPress={handleNext}
            style={styles.btn}
            contentStyle={{ paddingVertical: 8 }}
            labelStyle={{ fontSize: 16, fontWeight: '700' }}
          >
            Kom igång
          </Button>
        </View>
      )}

      {/* Step 3: Pairing */}
      {step === 2 && (
        <View style={styles.stepWrap}>
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
        </View>
      )}

      {/* Dot stepper */}
      <View style={styles.dots}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === step ? theme.colors.primary : theme.colors.outlineVariant,
                width: i === step ? 20 : 8,
              }
            ]}
          />
        ))}
      </View>

      <Snackbar visible={copied} onDismiss={() => setCopied(false)} duration={2000}>
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
    paddingBottom: 40,
  },
  stepWrap: {
    gap: 16,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 52,
    lineHeight: 64,
    textAlign: 'center',
  },
  title: {
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
    lineHeight: 24,
  },
  howList: {
    gap: 20,
    marginVertical: 8,
  },
  howItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
})
