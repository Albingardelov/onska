import { useState } from 'react'
import { View, StyleSheet, ScrollView, Modal, KeyboardAvoidingView, Platform, Pressable } from 'react-native'
import { Text, TextInput, Button, HelperText, Divider, useTheme } from 'react-native-paper'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useAuth } from '@/contexts/AuthContext'

const features = [
  { icon: 'gift-outline', title: 'Skicka önskningar', desc: 'Dela med dig av vad du drömmer om – stort som smått.' },
  { icon: 'calendar-outline', title: 'Boka upplevelser', desc: 'Planera datum och överraska din partner med något speciellt.' },
  { icon: 'auto-fix', title: 'Skapa minnen', desc: 'Förvandla önskningar till verkliga stunder tillsammans.' },
]

export default function LoginScreen() {
  const { signIn, signUp } = useAuth()
  const theme = useTheme()
  const [showForm, setShowForm] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!email || !password) return
    setError('')
    setLoading(true)
    const err = isRegister ? await signUp(email, password, name) : await signIn(email, password)
    if (err) setError(err)
    setLoading(false)
  }

  function openForm(register: boolean) {
    setIsRegister(register)
    setError('')
    setShowForm(true)
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: theme.colors.primaryContainer + '44' }]}>
          <MaterialCommunityIcons name="heart" size={56} color={theme.colors.primary} />
          <Text variant="displaySmall" style={[styles.appName, { color: theme.colors.primary }]}>
            Couply
          </Text>
          <Text variant="titleMedium" style={[styles.tagline, { color: theme.colors.onSurfaceVariant }]}>
            Turn wishes into moments
          </Text>
          <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
            En app för par – dela önskningar, boka upplevelser och skapa stunder som betyder något.
          </Text>

          <View style={styles.ctaButtons}>
            <Button mode="contained" onPress={() => openForm(true)}
              style={styles.ctaBtn} contentStyle={{ paddingVertical: 6 }}
              labelStyle={{ fontSize: 16, fontWeight: '700' }}>
              Kom igång gratis
            </Button>
            <Button mode="outlined" onPress={() => openForm(false)}
              style={styles.ctaBtn} contentStyle={{ paddingVertical: 6 }}
              labelStyle={{ fontWeight: '600' }}>
              Logga in
            </Button>
          </View>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {features.map(({ icon, title, desc }) => (
            <View key={title} style={styles.featureRow}>
              <MaterialCommunityIcons name={icon as any} size={32} color={theme.colors.primary} style={styles.featureIcon} />
              <View style={styles.featureText}>
                <Text variant="titleSmall" style={{ fontWeight: '700' }}>{title}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>{desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom sheet */}
      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowForm(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.sheetWrapper}>
            <Pressable>
              <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
                <View style={[styles.handle, { backgroundColor: theme.colors.outlineVariant }]} />

                <Text variant="titleLarge" style={{ fontWeight: '700', marginBottom: 20 }}>
                  {isRegister ? 'Skapa konto' : 'Logga in'}
                </Text>

                {isRegister && (
                  <TextInput label="Namn" value={name} onChangeText={setName}
                    autoComplete="name" mode="outlined" style={styles.input} />
                )}
                <TextInput label="E-post" value={email} onChangeText={setEmail}
                  keyboardType="email-address" autoCapitalize="none"
                  autoComplete="email" mode="outlined" style={styles.input} />
                <TextInput label="Lösenord" value={password} onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete={isRegister ? 'new-password' : 'password'}
                  mode="outlined" style={styles.input}
                  right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword(v => !v)} />}
                />

                {error ? <HelperText type="error" visible>{error}</HelperText> : null}

                <Button mode="contained" onPress={handleSubmit} loading={loading} disabled={loading}
                  style={styles.submitBtn} contentStyle={{ paddingVertical: 6 }}
                  labelStyle={{ fontSize: 16, fontWeight: '700' }}>
                  {isRegister ? 'Skapa konto' : 'Logga in'}
                </Button>

                <Divider style={{ marginVertical: 12 }} />

                <Button mode="text" textColor={theme.colors.onSurfaceVariant}
                  onPress={() => { setIsRegister(r => !r); setError('') }}>
                  {isRegister ? 'Har du redan ett konto? Logga in' : 'Inget konto? Registrera dig'}
                </Button>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1 },
  hero: {
    alignItems: 'center',
    paddingTop: 64,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  appName: {
    fontWeight: '900',
    marginTop: 12,
    letterSpacing: -1,
  },
  tagline: {
    marginTop: 6,
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 300,
  },
  ctaButtons: {
    width: '100%',
    maxWidth: 320,
    gap: 10,
  },
  ctaBtn: { borderRadius: 12 },
  features: {
    padding: 24,
    gap: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  featureIcon: { marginTop: 2 },
  featureText: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetWrapper: { justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  input: { marginBottom: 12 },
  submitBtn: {
    borderRadius: 12,
    marginTop: 4,
  },
})
