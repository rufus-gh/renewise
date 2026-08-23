import { useEffect, useRef, useState } from 'react'
import { gsap, isTouch, prefersReducedMotion } from '../lib/gsap'

type CursorState = '' | 'explore' | 'view' | 'open' | 'drag'

/**
 * A crosshair rather than a blob. It reads as an instrument, sits at
 * 1px weight most of the time, and only grows when it has something to
 * say. Removed entirely on touch.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const [enabled, setEnabled] = useState(false)
  const [state, setState] = useState<CursorState>('')

  useEffect(() => {
    if (isTouch() || prefersReducedMotion()) return
    setEnabled(true)
    document.body.classList.add('has-cursor')

    const xTo = gsap.quickTo(dot.current, 'x', { duration: 0.08, ease: 'none' })
    const yTo = gsap.quickTo(dot.current, 'y', { duration: 0.08, ease: 'none' })
    const rxTo = gsap.quickTo(ring.current, 'x', { duration: 0.42, ease: 'power3' })
    const ryTo = gsap.quickTo(ring.current, 'y', { duration: 0.42, ease: 'power3' })

    const onMove = (e: PointerEvent) => {
      xTo(e.clientX)
      yTo(e.clientY)
      rxTo(e.clientX)
      ryTo(e.clientY)

      const hit = (e.target as HTMLElement)?.closest<HTMLElement>('[data-cursor]')
      const next = (hit?.dataset.cursor ?? '') as CursorState
      setState((prev) => (prev === next ? prev : next))
      if (label.current) label.current.textContent = hit?.dataset.cursorLabel ?? ''
    }

    const onLeave = () => gsap.to([dot.current, ring.current], { opacity: 0, duration: 0.2 })
    const onEnter = () => gsap.to([dot.current, ring.current], { opacity: 1, duration: 0.2 })

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    document.addEventListener('pointerenter', onEnter)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('pointerenter', onEnter)
      document.body.classList.remove('has-cursor')
    }
  }, [])

  if (!enabled) return null

  return (
    <div className="cursor" aria-hidden="true" data-state={state}>
      <div ref={ring} className="cursor__ring">
        <span ref={label} className="cursor__label" />
      </div>
      <div ref={dot} className="cursor__dot" />
    </div>
  )
}
