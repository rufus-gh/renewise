import { useEffect, useRef, type ReactNode } from 'react'
import { gsap, isTouch, prefersReducedMotion } from '../lib/gsap'

interface Props {
  children: ReactNode
  onClick?: () => void
  /** Distance in px the button will travel toward the pointer. */
  pull?: number
  variant?: 'solid' | 'line' | 'bare'
  className?: string
  type?: 'button' | 'submit'
  disabled?: boolean
  cursor?: string
  cursorLabel?: string
}

/**
 * Magnetism with a two-layer parallax: the frame follows the pointer,
 * the label follows further, so the button reads as having depth
 * rather than simply sliding. A background sweep resolves on hover.
 */
export function MagneticButton({
  children,
  onClick,
  pull = 14,
  variant = 'solid',
  className = '',
  type = 'button',
  disabled,
  cursor,
  cursorLabel,
}: Props) {
  const root = useRef<HTMLButtonElement>(null)
  const inner = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = root.current
    const label = inner.current
    if (!el || !label || isTouch() || prefersReducedMotion()) return

    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' })
    const lxTo = gsap.quickTo(label, 'x', { duration: 0.62, ease: 'power3' })
    const lyTo = gsap.quickTo(label, 'y', { duration: 0.62, ease: 'power3' })

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
      xTo(dx * pull)
      yTo(dy * pull * 0.6)
      lxTo(dx * pull * 0.35)
      lyTo(dy * pull * 0.22)
    }
    const onLeave = () => {
      xTo(0)
      yTo(0)
      lxTo(0)
      lyTo(0)
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [pull])

  return (
    <button
      ref={root}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`mbtn mbtn--${variant} ${className}`}
      data-cursor={cursor}
      data-cursor-label={cursorLabel}
    >
      <span ref={inner} className="mbtn__label">
        {children}
      </span>
      <span className="mbtn__sweep" aria-hidden="true" />
    </button>
  )
}
