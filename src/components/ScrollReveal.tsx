import type { ReactNode } from 'react'
import { gsap, ScrollTrigger, EASE, prefersReducedMotion } from '../lib/gsap'
import { useGsap } from '../hooks/useGsap'

interface Props {
  children: ReactNode
  className?: string
  /** Children matching this selector stagger in; defaults to direct children. */
  select?: string
  y?: number
  stagger?: number
  start?: string
}

/** Quiet entrance for supporting content. Deliberately understated —
 *  the headline reveals are the loud move, everything else settles. */
export function ScrollReveal({
  children,
  className = '',
  select,
  y = 22,
  stagger = 0.07,
  start = 'top 86%',
}: Props) {
  const scope = useGsap<HTMLDivElement>((_ctx, el) => {
    const targets = select
      ? el.querySelectorAll(select)
      : (Array.from(el.children) as HTMLElement[])
    if (!targets.length) return
    if (prefersReducedMotion()) {
      gsap.set(targets, { opacity: 1, y: 0 })
      return
    }
    gsap.set(targets, { opacity: 0, y })
    ScrollTrigger.create({
      trigger: el,
      start,
      once: true,
      onEnter: () =>
        gsap.to(targets, {
          opacity: 1,
          y: 0,
          duration: 0.85,
          ease: EASE.ui,
          stagger,
        }),
    })
  })

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  )
}
