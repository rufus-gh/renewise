import { useRef, useState } from 'react'
import { gsap, EASE, prefersReducedMotion } from '../lib/gsap'
import { useGsap } from '../hooks/useGsap'

const LINES = [
  'MARKET INDEX SYNCED',
  '4,113 PLANS · 42 RETAILERS',
  '14 DISTRIBUTION NETWORKS',
  'SIGNAL ACQUIRED',
]

interface Props {
  onDone: () => void
}

/**
 * Not a spinner — a short initialisation that states what the product
 * actually knows. Runs once per session; repeat visits go straight in.
 */
export function Preloader({ onDone }: Props) {
  const [gone, setGone] = useState(false)
  const count = useRef<HTMLSpanElement>(null)

  const scope = useGsap<HTMLDivElement>((_ctx, el) => {
    const done = () => {
      setGone(true)
      onDone()
    }

    if (prefersReducedMotion()) {
      gsap.set(el, { autoAlpha: 0 })
      done()
      return
    }

    // Start states are set through GSAP, never CSS: GSAP resolves a CSS
    // percentage transform to pixels, so a later yPercent tween would
    // animate a different property than the one holding the element down.
    gsap.set(el.querySelectorAll('.pre__line .js-line'), { yPercent: 130, opacity: 0 })

    const counter = { v: 0 }
    const tl = gsap.timeline({ onComplete: done })

    tl.to(el.querySelectorAll('.pre__hair'), {
      scaleX: 1,
      duration: 0.9,
      ease: EASE.cinematic,
      stagger: 0.06,
    })
      .to(
        counter,
        {
          v: 100,
          duration: 1.5,
          ease: 'power2.inOut',
          onUpdate: () => {
            if (count.current)
              count.current.textContent = String(Math.round(counter.v)).padStart(3, '0')
          },
        },
        0,
      )
      .to(
        el.querySelectorAll('.pre__line .js-line'),
        { yPercent: 0, opacity: 1, duration: 0.6, ease: EASE.type, stagger: 0.16 },
        0.22,
      )
      .to(el.querySelector('.pre__mark'), { opacity: 1, duration: 0.5, ease: EASE.ui }, 0.1)
      .to(
        el.querySelector('.pre__ready'),
        { opacity: 1, duration: 0.35, ease: EASE.ui },
        1.55,
      )
      // The reveal: the panel lifts as a single mass, not a fade.
      .to(el, {
        clipPath: 'inset(0% 0% 100% 0%)',
        duration: 1.05,
        ease: EASE.cinematic,
      }, 1.95)
  })

  if (gone) return null

  return (
    <div ref={scope} className="pre" role="status" aria-live="polite">
      <div className="pre__grid">
        <span className="pre__hair" />
        <span className="pre__hair" />
        <span className="pre__hair" />
        <span className="pre__hair" />
      </div>

      <div className="pre__inner shell">
        <div className="pre__mark">
          <Mark />
          <span className="mono">RENEWISE&nbsp;&nbsp;v2.0</span>
        </div>

        <ul className="pre__lines">
          {LINES.map((l) => (
            <li className="pre__line line-mask" key={l}>
              <span className="js-line mono">{l}</span>
            </li>
          ))}
        </ul>

        <div className="pre__foot">
          <span ref={count} className="pre__count num">
            000
          </span>
          <span className="pre__ready mono">EXPERIENCE READY</span>
        </div>
      </div>
    </div>
  )
}

export function Mark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M17.5 5 9 18h5.5L13 27l9-13.5h-5.5z" fill="var(--sig)" />
    </svg>
  )
}
