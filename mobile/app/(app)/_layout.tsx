import { Tabs } from 'expo-router'
import { useTheme } from 'react-native-paper'
import { TouchableOpacity } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useMode } from '@/contexts/ModeContext'
import { useAuth } from '@/contexts/AuthContext'

function ModeToggleButton() {
  const { mode, toggleMode } = useMode()
  const theme = useTheme()
  return (
    <TouchableOpacity
      onPress={toggleMode}
      style={{ marginRight: 8, padding: 6 }}
      accessibilityLabel={mode === 'fint' ? 'Byt till mörkt läge' : 'Byt till ljust läge'}
      accessibilityRole="button"
    >
      <MaterialCommunityIcons
        name={mode === 'fint' ? 'weather-sunny' : 'weather-night'}
        size={22}
        color={theme.colors.onSurface}
      />
    </TouchableOpacity>
  )
}

function LogoutButton() {
  const { signOut } = useAuth()
  const theme = useTheme()
  return (
    <TouchableOpacity
      onPress={signOut}
      style={{ marginRight: 16, padding: 6 }}
      accessibilityLabel="Logga ut"
      accessibilityRole="button"
    >
      <MaterialCommunityIcons name="logout" size={20} color={theme.colors.onSurfaceVariant} />
    </TouchableOpacity>
  )
}

export default function AppLayout() {
  const theme = useTheme()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 20,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTitleStyle: { fontWeight: '700', color: theme.colors.onSurface },
        headerShadowVisible: false,
        headerRight: () => (
          <>
            <ModeToggleButton />
            <LogoutButton />
          </>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Önska',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="heart-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Önskningar',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="inbox-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Kalender',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Mina idéer',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="heart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Inställningar',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
