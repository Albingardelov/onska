'use client'
import { useRef, useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import { Icon } from '@iconify/react'

interface SwipeToDeleteProps {
  onDelete: () => void
  children: React.ReactNode
  delay?: number
}

const REVEAL_WIDTH = 80      // width of the delete button in px
const DELETE_THRESHOLD = 0.3 // fraction of element width → full swipe-away

export function SwipeToDelete({ onDelete, children, delay = 0 }: SwipeToDeleteProps) {
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const swipeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [offset, setOffset] = useState(0)
  const startXRef = useRef(0)
  const currentOffsetRef = useRef(0)
  const didHapticRef = useRef(false)

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    startXRef.current = e.clientX
    didHapticRef.current = false
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    const diff = e.clientX - startXRef.current
    const newOffset = Math.min(diff, 0) // only allow left swipe

    // Haptic bump at reveal midpoint
    if (!didHapticRef.current && -newOffset >= REVEAL_WIDTH / 2) {
      didHapticRef.current = true
      if ('vibrate' in navigator) navigator.vibrate(8)
    } else if (didHapticRef.current && -newOffset < REVEAL_WIDTH / 2) {
      didHapticRef.current = false
    }

    currentOffsetRef.current = newOffset
    setOffset(newOffset)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false)
    didHapticRef.current = false

    const elementWidth = (e.currentTarget as HTMLElement).offsetWidth
    const distance = Math.abs(currentOffsetRef.current)

    if (currentOffsetRef.current < 0) {
      // Full swipe-away: animate off screen then delete
      if (distance > elementWidth * DELETE_THRESHOLD) {
        setOffset(-elementWidth)
        swipeTimerRef.current = setTimeout(triggerDelete, 100)
        ;(e.target as Element).releasePointerCapture(e.pointerId)
        return
      }
      // Snap to reveal or snap back
      if (distance > REVEAL_WIDTH / 2) {
        setOffset(-REVEAL_WIDTH)
        currentOffsetRef.current = -REVEAL_WIDTH
      } else {
        setOffset(0)
        currentOffsetRef.current = 0
      }
    } else {
      setOffset(0)
      currentOffsetRef.current = 0
    }

    ;(e.target as Element).releasePointerCapture(e.pointerId)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') triggerDelete()
  }

  const triggerDelete = () => {
    setIsDeleting(true)
    deleteTimerRef.current = setTimeout(onDelete, 300)
  }

  // One-time swipe hint: peek on first encounter
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem('swipeHintSeen')) return
    localStorage.setItem('swipeHintSeen', '1')
    const t1 = setTimeout(() => setOffset(-18), 900)
    const t2 = setTimeout(() => setOffset(0), 1400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  useEffect(() => {
    return () => {
      clearTimeout(deleteTimerRef.current)
      clearTimeout(swipeTimerRef.current)
    }
  }, [])

  return (
    <Box
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        maxHeight: isDeleting ? 0 : '300px',
        mb: isDeleting ? '0 !important' : undefined,
        transition: isDeleting
          ? 'max-height 0.3s cubic-bezier(0.65,0,0.35,1), margin 0.3s cubic-bezier(0.65,0,0.35,1)'
          : undefined,
      }}
      style={delay > 0 ? { animationDelay: `${delay}ms` } : undefined}
    >
      {/* Wrapper fades out when deleting */}
      <Box sx={{
        position: 'relative',
        opacity: isDeleting ? 0 : 1,
        transition: 'opacity 0.3s cubic-bezier(0.65,0,0.35,1)',
      }}>
        {/* Delete button — always present behind content */}
        <Box sx={{
          bgcolor: 'error.main',
          borderRadius: 2,
          position: 'absolute',
          top: 0, bottom: 0, right: 0,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          zIndex: 1,
        }}>
          <Box
            component="button"
            onClick={triggerDelete}
            tabIndex={offset === 0 ? -1 : 0}
            aria-hidden={offset === 0}
            aria-label="Radera"
            sx={{
              width: REVEAL_WIDTH,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'transparent',
              color: '#fff',
              cursor: 'pointer',
              border: 'none',
              fontSize: 22,
            }}
          >
            <Icon icon="mdi:delete" />
          </Box>
        </Box>

        {/* Content slides over the delete button */}
        <Box
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={handleKeyDown}
          sx={{
            position: 'relative',
            zIndex: 2,
            userSelect: 'none',
            touchAction: 'pan-y',
            cursor: isDragging ? 'grabbing' : 'grab',
            transform: `translateX(${offset}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  )
}
