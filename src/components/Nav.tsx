import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, EASE, prefersReducedMotion } from '../lib/gsap'
import { Mark } from './Preloader'
import { MagneticButton } from './MagneticButton'

const LINKS = [
  { href: '#system', label: 'System' },
  { href: '#proof', label: 'Evidence' },
  { href: '#capabilities', label: 'What it does' },
]

interface Props {
  ready: boolean
  onStart: () => void
}

/**
 * Sparse by design: a mark, three anchors, one action. It retreats on
 * downward scroll and returns on upward — velocity-aware, so it never
 * flickers during a scrub.
 */
export function Nav({ ready, onStart }: Props) {
  const root = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!ready || !root.current) return
    const el = root.current

    // Reduced motion still needs a visible, usable header — only the
    // entrance and the hide-on-scroll behaviour are dropped.
    if (prefersReducedMotion()) {
      gsap.set(el, { yPercent: 0, opacity: 1 })
      return
    }
    const ctx = gsap.context(() => {
      gsap.to(el, { yPercent: 0, opacity: 1, duration: 0.9, ease: EASE.ui, delay: 0.5 })

      const st = ScrollTrigger.create({
        start: 'top -140',
        end: 99999,
        onUpdate: (self) => {
          const hiding = self.direction === 1 && self.scroll() > 240
          gsap.to(el, {
            yPercent: hiding ? -130 : 0,
            duration: 0.5,
            ease: EASE.ui,
            overwrite: true,
          })
        },
      })
      return () => st.kill()
    }, el)
    return () => ctx.revert()
  }, [ready])

  return (
    <header ref={root} className="nav" data-open={open}>
      <div className="nav__bar shell">
        <a href="#top" className="nav__mark" data-cursor="explore" aria-label="Renewise, home">
          <Mark size={16} />
          <span>Renewise</span>
        </a>

        <nav className="nav__links" aria-label="Sections">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="nav__link" data-cursor="explore">
              <span>{l.label}</span>
              <span aria-hidden="true">{l.label}</span>
            </a>
          ))}
        </nav>

        <div className="nav__right">
          <span className="nav__meta mono">AU · RESIDENTIAL</span>
          <MagneticButton variant="solid" onClick={onStart} pull={10} cursor="open">
            Start now
          </MagneticButton>
        </div>

        <button
          className="nav__burger"
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
        </button>
      </div>

      <div className="nav__sheet" hidden={!open}>
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
        <button
          onClick={() => {
            setOpen(false)
            onStart()
          }}
        >
          Start now
        </button>
      </div>
    </header>
  )
}
