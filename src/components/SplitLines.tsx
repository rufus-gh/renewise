import { createElement, useRef, type ReactNode } from 'react'
import { gsap, ScrollTrigger, EASE, prefersReducedMotion } from '../lib/gsap'
import { useGsap } from '../hooks/useGsap'

type Tag = 'h1' | 'h2' | 'h3' | 'p' | 'div'

interface Props {
  lines: ReactNode[]
  as?: Tag
  className?: string
  /** Leave animation to a parent timeline that targets `.js-line`. */
  manual?: boolean
  stagger?: number
  delay?: number
  start?: string
}

/**
 * Line-by-line masked reveal. Lines are authored explicitly rather than
 * measured at runtime — the break points are a typographic decision,
 * and letting the browser choose them is how editorial headlines end up
 * looking like body copy.
 */
export function SplitLines({
  lines,
  as = 'h2',
  className = '',
  manual = false,
  stagger = 0.09,
  delay = 0,
  start = 'top 82%',
}: Props) {
  const scope = useRef<HTMLElement>(null)

  useGsap<HTMLElement>(
    (_ctx, el) => {
      if (manual) return
      const targets = el.querySelectorAll('.js-line')
      if (prefersReducedMotion()) {
        gsap.set(targets, { yPercent: 0, opacity: 1 })
        return
      }
      gsap.set(targets, { yPercent: 130, opacity: 0 })
      ScrollTrigger.create({
        trigger: el,
        start,
        once: true,
        onEnter: () => {
          gsap.to(targets, {
            yPercent: 0,
            opacity: 1,
            duration: 1.05,
            ease: EASE.type,
            stagger,
            delay,
          })
        },
      })
    },
    [manual],
  )

  return createElement(
    as,
    { className, ref: scope },
    lines.map((line, i) => (
      <span className="line-mask" key={i}>
        <span className="js-line">{line}</span>
      </span>
    )),
  )
}
