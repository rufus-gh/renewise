import { useEffect, useRef, useState } from 'react'
import { gsap, prefersReducedMotion } from '../lib/gsap'

type CursorState = '' | 'explore' | 'view' | 'open' | 'drag'

/**
 * Only devices with a real pointer get a drawn cursor. `maxTouchPoints`
 * is the wrong test — touchscreen laptops have one and a mouse too.
 */
const FINE_POINTER = '(hover: hover) and (pointer: fine)'

function hasFinePointer(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(FINE_POINTER).matches
}

/**
 * A crosshair rather than a blob. It reads as an instrument, sits at
 * 1px weight most of the time, and only grows when it has something to
 * say. Removed entirely on touch and under reduced motion.
 *
 * `enabled` is resolved during the first render, not inside an effect:
 * the elements have to exist before anything can be bound to them, and
 * binding to refs that are still null is how you end up hiding the
 * native cursor without drawing a replacement.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const [enabled, setEnabled] = useState(() => hasFinePointer() && !prefersReducedMotion())
  const [state, setState] = useState<CursorState>('')

  // Pointer capability is not fixed for the life of the page — a tablet
  // gets a keyboard case, a laptop gets undocked — so track the query
  // rather than sampling it once at mount.
  useEffect(() => {
    const mq = window.matchMedia(FINE_POINTER)
    const sync = () => setEnabled(mq.matches && !prefersReducedMotion())
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const d = dot.current
    const r = ring.current
    if (!enabled || !d || !r) return

    const xTo = gsap.quickTo(d, 'x', { duration: 0.08, ease: 'none' })
    const yTo = gsap.quickTo(d, 'y', { duration: 0.08, ease: 'none' })
    const rxTo = gsap.quickTo(r, 'x', { duration: 0.42, ease: 'power3' })
    const ryTo = gsap.quickTo(r, 'y', { duration: 0.42, ease: 'power3' })

    // Hide the native cursor only once ours is actually wired up, so a
    // failure here can never leave the page with no cursor at all.
    document.body.classList.add('has-cursor')

    let seen = false
    const onMove = (e: PointerEvent) => {
      if (!seen) {
        seen = true
        // Jump to the pointer and show it in the same frame. Showing is
        // a set, never a tween: a tween needs rAF, and a cursor that
        // depends on an animation to exist is a cursor that sometimes
        // doesn't.
        gsap.set([d, r], { x: e.clientX, y: e.clientY, autoAlpha: 1 })
      }
      xTo(e.clientX)
      yTo(e.clientY)
      rxTo(e.clientX)
      ryTo(e.clientY)

      const hit = (e.target as HTMLElement)?.closest<HTMLElement>('[data-cursor]')
      const next = (hit?.dataset.cursor ?? '') as CursorState
      setState((prev) => (prev === next ? prev : next))
      if (label.current) label.current.textContent = hit?.dataset.cursorLabel ?? ''
    }

    // Leaving the window can fade; returning must not — the same rule as
    // above, applied to whichever direction leaves the cursor missing.
    const onLeave = () => {
      if (seen) gsap.to([d, r], { autoAlpha: 0, duration: 0.2, overwrite: true })
    }
    const onEnter = () => {
      if (seen) gsap.set([d, r], { autoAlpha: 1 })
    }

    // A pen or finger on a hybrid device should hand the native cursor
    // back rather than leave a mouse crosshair stranded on screen.
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        document.body.classList.remove('has-cursor')
        gsap.set([d, r], { autoAlpha: 0 })
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    document.addEventListener('pointerenter', onEnter)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('pointerenter', onEnter)
      document.body.classList.remove('has-cursor')
    }
  }, [enabled])

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
