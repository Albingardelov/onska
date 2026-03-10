import { Tabs } from 'expo-router'
import { useTheme } from 'react-native-paper'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

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
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTitleStyle: { fontWeight: '700', color: theme.colors.onSurface },
        headerShadowVisible: false,
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
          title: 'Beställningar',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="shopping-outline" size={size} color={color} />
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
          title: 'Mina tjänster',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="star-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
