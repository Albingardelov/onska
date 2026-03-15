'use client'
import { useRef, useState } from 'react'
import Box from '@mui/material/Box'
import { Icon } from '@iconify/react'

interface SwipeToDeleteProps {
  onDelete: () => void
  children: React.ReactNode
}

const THRESHOLD = 90
const MAX_DRAG = 160

export function SwipeToDelete({ onDelete, children }: SwipeToDeleteProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const iconRef = useRef<HTMLDivElement>(null)
  const startX = useRef<number | null>(null)
  const currentOffset = useRef(0)
  const dragging = useRef(false)
  const [deleted, setDeleted] = useState(false)

  function applyOffset(offset: number, animate = false) {
    currentOffset.current = offset
    const card = cardRef.current
    const bg = bgRef.current
    const icon = iconRef.current
    if (!card || !bg || !icon) return

    const transition = animate ? 'transform 0.22s cubic-bezier(0.4,0,0.2,1)' : 'none'
    card.style.transition = transition
    card.style.transform = `translateX(${offset}px)`

    const progress = Math.min(-offset / THRESHOLD, 1)
    bg.style.opacity = String(progress)
    icon.style.transform = `scale(${0.75 + 0.25 * progress})`
  }

  function begin(x: number) {
    startX.current = x
    dragging.current = true
    // Remove transition during drag
    if (cardRef.current) cardRef.current.style.transition = 'none'
  }

  function move(x: number) {
    if (!dragging.current || startX.current === null) return
    const dx = x - startX.current
    const next = Math.max(Math.min(dx, 0), -MAX_DRAG)
    applyOffset(next)
  }

  function end() {
    if (!dragging.current) return
    dragging.current = false
    startX.current = null
    if (currentOffset.current < -THRESHOLD) {
      applyOffset(-MAX_DRAG, true)
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.18s ease'
        cardRef.current.style.opacity = '0'
      }
      setTimeout(() => setDeleted(true), 220)
      setTimeout(() => onDelete(), 240)
    } else {
      applyOffset(0, true)
    }
  }

  if (deleted) return null

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
      {/* Delete background */}
      <Box ref={bgRef} sx={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        width: MAX_DRAG, display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: 'error.main', color: '#fff',
        opacity: 0,
      }}>
        <Box ref={iconRef} component="span" sx={{ fontSize: 22, display: 'flex', transformOrigin: 'center' }}>
          <Icon icon="mdi:delete" />
        </Box>
      </Box>

      {/* Card */}
      <Box
        ref={cardRef}
        onTouchStart={e => begin(e.touches[0].clientX)}
        onTouchMove={e => { e.preventDefault(); move(e.touches[0].clientX) }}
        onTouchEnd={end}
        onMouseDown={e => begin(e.clientX)}
        onMouseMove={e => move(e.clientX)}
        onMouseUp={end}
        onMouseLeave={() => { if (dragging.current) end() }}
        sx={{ userSelect: 'none', touchAction: 'pan-y' }}
      >
        {children}
      </Box>
    </Box>
  )
}
