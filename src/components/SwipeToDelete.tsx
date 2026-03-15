'use client'
import { useRef, useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import { Icon } from '@iconify/react'

interface SwipeToDeleteProps {
  onDelete: () => void
  children: React.ReactNode
}

const THRESHOLD = 80
const MAX_DRAG = 120

export function SwipeToDelete({ onDelete, children }: SwipeToDeleteProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const iconRef = useRef<HTMLDivElement>(null)
  const startX = useRef<number | null>(null)
  const currentOffset = useRef(0)
  const dragging = useRef(false)
  const overThreshold = useRef(false)
  const [deleted, setDeleted] = useState(false)

  // Use refs for move/end so global listeners always call the latest version
  const moveRef = useRef<(x: number) => void>(() => {})
  const endRef = useRef<() => void>(() => {})

  function applyOffset(offset: number, animate = false) {
    currentOffset.current = offset
    const card = cardRef.current
    const bg = bgRef.current
    const icon = iconRef.current
    if (!card || !bg || !icon) return

    const easing = 'cubic-bezier(0.4,0,0.2,1)'
    card.style.transition = animate ? `transform 0.22s ${easing}` : 'none'
    card.style.transform = `translateX(${offset}px)`

    const progress = Math.min(-offset / THRESHOLD, 1)
    const confirmed = -offset >= THRESHOLD
    bg.style.opacity = String(Math.min(progress * 1.3, 1))
    bg.style.backgroundColor = confirmed ? 'rgb(198,40,40)' : 'rgb(229,57,53)'
    icon.style.transform = `scale(${0.65 + 0.45 * Math.min(progress, 1)}) rotate(${confirmed ? -12 : 0}deg)`
    icon.style.transition = animate ? `transform 0.15s ${easing}` : 'none'
  }

  function begin(x: number) {
    startX.current = x
    dragging.current = true
    overThreshold.current = false
    if (cardRef.current) cardRef.current.style.transition = 'none'
  }

  function move(x: number) {
    if (!dragging.current || startX.current === null) return
    const dx = x - startX.current
    const next = Math.max(Math.min(dx, 0), -MAX_DRAG)

    // Haptic bump when crossing threshold
    if (!overThreshold.current && -next >= THRESHOLD) {
      overThreshold.current = true
      if ('vibrate' in navigator) navigator.vibrate(8)
    } else if (overThreshold.current && -next < THRESHOLD) {
      overThreshold.current = false
    }

    applyOffset(next)
  }

  function end() {
    if (!dragging.current) return
    dragging.current = false
    startX.current = null

    if (currentOffset.current < -THRESHOLD) {
      // Slide out and collapse height
      applyOffset(-MAX_DRAG, true)
      const card = cardRef.current
      if (card) {
        card.style.transition = 'transform 0.18s cubic-bezier(0.4,0,0.2,1), opacity 0.14s ease'
        card.style.opacity = '0'
      }
      const container = containerRef.current
      setTimeout(() => {
        if (container) {
          const h = container.offsetHeight
          container.style.height = `${h}px`
          container.style.overflow = 'hidden'
          requestAnimationFrame(() => requestAnimationFrame(() => {
            container.style.transition = 'height 0.26s cubic-bezier(0.4,0,0.2,1), margin 0.26s ease'
            container.style.height = '0px'
          }))
        }
        setTimeout(() => { setDeleted(true); onDelete() }, 280)
      }, 140)
    } else {
      applyOffset(0, true)
    }
  }

  // Keep refs current on every render
  moveRef.current = move
  endRef.current = end

  // One-time swipe hint: briefly peek the delete background on first ever encounter
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem('swipeHintSeen')) return
    localStorage.setItem('swipeHintSeen', '1')
    const t1 = setTimeout(() => applyOffset(-16, true), 900)
    const t2 = setTimeout(() => applyOffset(0, true), 1400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Global mouse listeners so dragging outside the element works
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => moveRef.current(e.clientX)
    const onMouseUp = () => { if (dragging.current) endRef.current() }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  if (deleted) return null

  return (
    <Box ref={containerRef} sx={{ position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
      {/* Delete background */}
      <Box ref={bgRef} sx={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        width: MAX_DRAG, display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: 'error.main', color: '#fff', opacity: 0,
      }}>
        <Box ref={iconRef} component="span" sx={{ fontSize: 24, display: 'flex', transformOrigin: 'center' }}>
          <Icon icon="mdi:delete" />
        </Box>
      </Box>

      {/* Card */}
      <Box
        ref={cardRef}
        onTouchStart={e => begin(e.touches[0].clientX)}
        onTouchMove={e => { e.preventDefault(); move(e.touches[0].clientX) }}
        onTouchEnd={end}
        onMouseDown={e => { e.preventDefault(); begin(e.clientX) }}
        sx={{ userSelect: 'none', touchAction: 'pan-y', cursor: 'grab', '&:active': { cursor: 'grabbing' } }}
      >
        {children}
      </Box>
    </Box>
  )
}
