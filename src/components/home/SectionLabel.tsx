import Typography from '@mui/material/Typography'

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="subtitle2" fontWeight={700} color="text.secondary"
      sx={{ letterSpacing: '-0.01em', mb: 1.5, fontSize: '0.8rem', textTransform: 'uppercase' }}>
      {children}
    </Typography>
  )
}
