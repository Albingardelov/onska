'use client'
import { useRef, useState } from 'react'
import Box from '@mui/material/Box'
import { Icon } from '@iconify/react'

interface SwipeToDeleteProps {
  onDelete: () => void
  children: React.ReactNode
}

const THRESHOLD = 80 // px to trigger delete

export function SwipeToDelete({ onDelete, children }: SwipeToDeleteProps) {
  const startX = useRef<number | null>(null)
  const [offset, setOffset] = useState(0)
  const [deleting, setDeleting] = useState(false)

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
  }

  function onTouchMove(e: React.TouchEvent) {
    if (startX.current === null) return
    const dx = e.touches[0].clientX - startX.current
    if (dx < 0) setOffset(Math.max(dx, -160))
  }

  function onTouchEnd() {
    if (offset < -THRESHOLD) {
      setDeleting(true)
      setOffset(-160)
      setTimeout(() => onDelete(), 250)
    } else {
      setOffset(0)
    }
    startX.current = null
  }

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
      {/* Red delete background */}
      <Box sx={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        width: 160, display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: 'error.main', color: '#fff', gap: 0.5,
        opacity: Math.min((-offset) / THRESHOLD, 1),
      }}>
        <Box component="span" sx={{ fontSize: 20, display: 'flex' }}><Icon icon="mdi:delete" /></Box>
      </Box>

      {/* Card */}
      <Box
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        sx={{
          transform: `translateX(${offset}px)`,
          transition: offset === 0 || deleting ? 'transform 0.2s ease' : 'none',
          opacity: deleting ? 0 : 1,
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
