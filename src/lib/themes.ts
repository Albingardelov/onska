import { createTheme } from '@mui/material/styles'

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#FF6B8A', dark: '#E8536F', light: '#FFD6DF', contrastText: '#fff' },
    secondary: { main: '#FFB3C1' },
    background: { default: '#FDF6F8', paper: '#FFFFFF' },
    text: { primary: '#1A1018', secondary: '#7A5663' },
    error: { main: '#E53935' },
    success: { main: '#2E9B5F' },
    divider: '#F0DDE3',
  },
  shape: { borderRadius: 4 },
  typography: {
    fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.03em' },
    h5: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 700, letterSpacing: '-0.02em' },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '-0.01em' },
    overline: { letterSpacing: '0.08em', fontSize: '0.7rem' },
  },
  components: {
    MuiTextField: {
      defaultProps: { variant: 'outlined', fullWidth: true, size: 'medium' },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, padding: '11px 22px', fontSize: '0.95rem', letterSpacing: '-0.01em' },
        containedPrimary: { color: '#fff' },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '& fieldset': { borderColor: '#F0DDE3' },
          '&:hover fieldset': { borderColor: '#FF6B8A' },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(255,255,255,0.85)',
          borderBottom: '1px solid #F0DDE3',
          boxShadow: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: { root: { height: 64, borderTop: '1px solid #F0DDE3', backgroundColor: '#FFFFFF' } },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: { color: '#C4A0AC', minWidth: 0, '&.Mui-selected': { color: '#FF6B8A' } },
      },
    },
  },
})

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#C026D3', dark: '#A21CAF', light: '#7C3AED', contrastText: '#fff' },
    secondary: { main: '#7C3AED' },
    background: { default: '#0D0612', paper: '#170D1E' },
    text: { primary: '#F0E6FF', secondary: '#9B7AB0' },
    error: { main: '#F44336' },
    success: { main: '#4CAF7D' },
    divider: '#2D1540',
  },
  shape: { borderRadius: 4 },
  typography: {
    fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.03em' },
    h5: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 700, letterSpacing: '-0.02em' },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '-0.01em' },
    overline: { letterSpacing: '0.08em', fontSize: '0.7rem' },
  },
  components: {
    MuiTextField: {
      defaultProps: { variant: 'outlined', fullWidth: true, size: 'medium' },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, padding: '11px 22px', fontSize: '0.95rem', letterSpacing: '-0.01em' },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '& fieldset': { borderColor: '#2D1540' },
          '&:hover fieldset': { borderColor: '#C026D3' },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(13,6,18,0.85)',
          borderBottom: '1px solid #2D1540',
          boxShadow: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: { root: { height: 64, borderTop: '1px solid #2D1540', backgroundColor: '#120919' } },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: { color: '#6B4880', minWidth: 0, '&.Mui-selected': { color: '#C026D3' } },
      },
    },
  },
})
