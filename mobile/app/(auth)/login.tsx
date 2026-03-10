import { useState } from 'react'
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { Text, TextInput, Button, Surface, HelperText, useTheme } from 'react-native-paper'
import { useAuth } from '@/contexts/AuthContext'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

export default function LoginScreen() {
  const { signIn, signUp } = useAuth()
  const theme = useTheme()
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
    const err = isRegister
      ? await signUp(email, password, name)
      : await signIn(email, password)
    if (err) setError(err)
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Hero */}
        <View style={styles.hero}>
          <MaterialCommunityIcons name="heart" size={56} color={theme.colors.primary} />
          <Text variant="displaySmall" style={[styles.appName, { color: theme.colors.primary }]}>
            WishMate
          </Text>
          <Text variant="bodyMedium" style={[styles.tagline, { color: theme.colors.onSurfaceVariant }]}>
            Turn wishes into moments
          </Text>
        </View>

        {/* Form */}
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleLarge" style={styles.cardTitle}>
            {isRegister ? 'Skapa konto' : 'Logga in'}
          </Text>

          {isRegister && (
            <TextInput
              label="Namn"
              value={name}
              onChangeText={setName}
              autoComplete="name"
              style={styles.input}
              mode="outlined"
            />
          )}

          <TextInput
            label="E-post"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Lösenord"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete={isRegister ? 'new-password' : 'password'}
            style={styles.input}
            mode="outlined"
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(v => !v)}
              />
            }
          />

          {error ? (
            <HelperText type="error" visible style={styles.error}>
              {error}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitBtn}
            contentStyle={styles.submitBtnContent}
            labelStyle={styles.submitBtnLabel}
          >
            {isRegister ? 'Skapa konto' : 'Logga in'}
          </Button>

          <Button
            mode="text"
            onPress={() => { setIsRegister(r => !r); setError('') }}
            style={styles.switchBtn}
            textColor={theme.colors.onSurfaceVariant}
          >
            {isRegister ? 'Har du redan ett konto? Logga in' : 'Inget konto? Registrera dig'}
          </Button>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appName: {
    fontWeight: '900',
    marginTop: 8,
    letterSpacing: -1,
  },
  tagline: {
    marginTop: 4,
    marginBottom: 8,
  },
  card: {
    borderRadius: 20,
    padding: 24,
  },
  cardTitle: {
    fontWeight: '700',
    marginBottom: 20,
  },
  input: {
    marginBottom: 12,
  },
  error: {
    marginBottom: 4,
  },
  submitBtn: {
    marginTop: 8,
    borderRadius: 12,
  },
  submitBtnContent: {
    paddingVertical: 6,
  },
  submitBtnLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  switchBtn: {
    marginTop: 8,
  },
})
