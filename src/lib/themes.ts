import { createTheme } from '@mui/material/styles'

export const fintTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#FF6B8A', dark: '#E8536F', light: '#FFD6DF', contrastText: '#fff' },
    secondary: { main: '#FFB3C1' },
    background: { default: '#FFF5F7', paper: '#FFFFFF' },
    text: { primary: '#2D1B1E', secondary: '#8A6370' },
    error: { main: '#E53935' },
    success: { main: '#43A047' },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiTextField: {
      defaultProps: { variant: 'outlined', fullWidth: true, size: 'medium' },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 12, padding: '12px 20px', fontSize: '0.95rem' },
        containedPrimary: { color: '#fff' },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiBottomNavigation: {
      styleOverrides: { root: { height: 64, borderTop: '1px solid #FFD6DF' } },
    },
  },
})

export const snuskTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#C026D3', dark: '#A21CAF', light: '#7C3AED', contrastText: '#fff' },
    secondary: { main: '#7C3AED' },
    background: { default: '#130818', paper: '#1E0F24' },
    text: { primary: '#F5E6FF', secondary: '#B07EC4' },
    error: { main: '#F44336' },
    success: { main: '#66BB6A' },
    divider: '#3D1A50',
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiTextField: {
      defaultProps: { variant: 'outlined', fullWidth: true, size: 'medium' },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 12, padding: '12px 20px', fontSize: '0.95rem' },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { '& fieldset': { borderColor: '#3D1A50' } },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: { root: { height: 64, borderTop: '1px solid #3D1A50', backgroundColor: '#1A0B21' } },
    },
    MuiBottomNavigationAction: {
      styleOverrides: { root: { color: '#B07EC4', '&.Mui-selected': { color: '#C026D3' } } },
    },
  },
})
