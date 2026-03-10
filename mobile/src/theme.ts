import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper'

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#FF6B8A',
    onPrimary: '#FFFFFF',
    primaryContainer: '#FFD6DF',
    onPrimaryContainer: '#1A1018',
    secondary: '#FFB3C1',
    background: '#FDF6F8',
    surface: '#FFFFFF',
    surfaceVariant: '#FDF6F8',
    onSurface: '#1A1018',
    onSurfaceVariant: '#7A5663',
    outline: '#F0DDE3',
    outlineVariant: '#F0DDE3',
    error: '#E53935',
    onBackground: '#1A1018',
  },
}

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#C026D3',
    onPrimary: '#FFFFFF',
    primaryContainer: '#2D0F38',
    onPrimaryContainer: '#F0E6FF',
    secondary: '#7C3AED',
    background: '#0D0612',
    surface: '#170D1E',
    surfaceVariant: '#1E1228',
    onSurface: '#F0E6FF',
    onSurfaceVariant: '#9B7AB0',
    outline: '#2D1540',
    outlineVariant: '#2D1540',
    error: '#F44336',
    onBackground: '#F0E6FF',
  },
}
