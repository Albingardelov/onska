import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper'

const palette = {
  primary: '#FF6B8A',
  primaryContainer: '#FFD9E2',
  secondary: '#FF9A3C',
  secondaryContainer: '#FFE0C2',
}

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: palette.primary,
    primaryContainer: palette.primaryContainer,
    secondary: palette.secondary,
    secondaryContainer: palette.secondaryContainer,
  },
}

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: palette.primary,
    primaryContainer: '#5C1A28',
    secondary: palette.secondary,
    secondaryContainer: '#5C3000',
  },
}
