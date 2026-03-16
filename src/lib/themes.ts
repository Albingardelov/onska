import { createTheme } from '@mui/material/styles'

export const fintTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#CC2E6A', dark: '#A82158', light: '#FFD6DF', contrastText: '#fff' },
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
    h4: { fontFamily: 'var(--font-fraunces), Georgia, serif', fontWeight: 700, letterSpacing: '-0.03em' },
    h5: { fontFamily: 'var(--font-fraunces), Georgia, serif', fontWeight: 700, letterSpacing: '-0.02em' },
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
          '&:hover fieldset': { borderColor: '#CC2E6A' },
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
        root: { color: '#7A5663', minWidth: 0, '&.Mui-selected': { color: '#B5213E' } },
      },
    },
  },
})

export const snuskTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#C41230', dark: '#9B0E26', light: '#E84060', contrastText: '#fff' },
    secondary: { main: '#E84060' },
    background: { default: '#080204', paper: '#12040A' },
    text: { primary: '#F5E4E8', secondary: '#A87888' },
    error: { main: '#F44336' },
    success: { main: '#4CAF7D' },
    divider: '#2A0A14',
  },
  shape: { borderRadius: 4 },
  typography: {
    fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: { fontFamily: 'var(--font-fraunces), Georgia, serif', fontWeight: 700, letterSpacing: '-0.03em' },
    h5: { fontFamily: 'var(--font-fraunces), Georgia, serif', fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 700, letterSpacing: '-0.02em' },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '-0.01em' },
    overline: { letterSpacing: '0.08em', fontSize: '0.7rem' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          '&::after': {
            content: '""',
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            pointerEvents: 'none',
            zIndex: 9999,
            opacity: 0.035,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '300px 300px',
          },
        },
      },
    },
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
          '&:hover fieldset': { borderColor: '#C41230' },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(8,2,4,0.88)',
          borderBottom: '1px solid #2A0A14',
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
      styleOverrides: { root: { height: 64, borderTop: '1px solid #2A0A14', backgroundColor: '#0E0308' } },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: { color: '#8A5060', minWidth: 0, '&.Mui-selected': { color: '#E84060' } },
      },
    },
  },
})
