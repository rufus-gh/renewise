import { useRef } from 'react'
import { gsap, ScrollTrigger, EASE, prefersReducedMotion } from '../lib/gsap'
import { useGsap } from '../hooks/useGsap'
import { MagneticButton } from './MagneticButton'

interface Props {
  ready: boolean
  onStart: () => void
}

/**
 * The hero's background object is a real thing: a 24-hour time-of-use
 * tariff profile, stepped through peak, shoulder and off-peak. It is the
 * shape every decision in this product is made against, so it earns the
 * space rather than decorating it.
 */
export function Hero({ ready, onStart }: Props) {
  const path = useRef<SVGPathElement>(null)

  const scope = useGsap<HTMLElement>(
    (_ctx, el) => {
      if (!ready) return

      const lines = el.querySelectorAll('.hero__h .js-line')
      const reduced = prefersReducedMotion()

      if (reduced) {
        gsap.set([lines, '.hero__sub', '.hero__cta', '.hero__meta > *'], {
          opacity: 1,
          yPercent: 0,
          y: 0,
        })
        gsap.set('.hero__curve', { strokeDashoffset: 0, opacity: 1 })
        gsap.set('.hero__band, .hero__marker', { opacity: 1 })
        return
      }

      const len = path.current?.getTotalLength() ?? 1200
      gsap.set('.hero__curve', { strokeDasharray: len, strokeDashoffset: len, opacity: 1 })
      gsap.set(lines, { yPercent: 130 })
      gsap.set('.hero__grid line', { scaleY: 0, transformOrigin: 'bottom' })

      // Hierarchy: the field builds, the headline lands, the detail follows.
      const tl = gsap.timeline({ delay: 0.15 })

      tl.to('.hero__grid line', {
        scaleY: 1,
        duration: 1.1,
        ease: EASE.cinematic,
        stagger: { each: 0.018, from: 'center' },
      })
        .to(lines, { yPercent: 0, duration: 1.15, ease: EASE.type, stagger: 0.085 }, 0.28)
        .to('.hero__curve', { strokeDashoffset: 0, duration: 1.9, ease: 'power2.inOut' }, 0.5)
        .to('.hero__band', { opacity: 1, duration: 1.2, ease: EASE.ui, stagger: 0.1 }, 0.9)
        .to('.hero__sub', { opacity: 1, y: 0, duration: 0.9, ease: EASE.ui }, 1.0)
        .to('.hero__cta', { opacity: 1, y: 0, duration: 0.8, ease: EASE.settle }, 1.15)
        .to(
          '.hero__meta > *',
          { opacity: 1, y: 0, duration: 0.7, ease: EASE.ui, stagger: 0.08 },
          1.25,
        )
        .to('.hero__marker', { opacity: 1, duration: 0.6 }, 1.6)

      // The field drifts up faster than the type — a shallow camera move,
      // transform-only so nothing reflows.
      ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
        animation: gsap
          .timeline()
          .to('.hero__field', { yPercent: -18, ease: 'none' }, 0)
          .to('.hero__h', { yPercent: -6, opacity: 0.15, ease: 'none' }, 0)
          // fromTo with immediateRender off: this tween is built while the
          // entrance is still running, so letting GSAP record the current
          // (zero) opacity as its start would strand these hidden.
          .fromTo(
            '.hero__sub, .hero__cta',
            { opacity: 1 },
            { opacity: 0, ease: 'none', immediateRender: false },
            0,
          ),
      })
    },
    [ready],
  )

  return (
    <section ref={scope} className="hero" id="top">
      <div className="hero__field">
        <TariffField pathRef={path} />
      </div>

      <div className="hero__inner shell">
        <p className="hero__eyebrow mono">Renewise · Australian electricity</p>

        <h1 className="hero__h display">
          {['Every good', 'plan has an', 'expiry date'].map((l) => (
            <span className="line-mask" key={l}>
              <span className="js-line">{l}</span>
            </span>
          ))}
        </h1>

        <p className="hero__sub">
          We price all 4,113 of them against how your household actually uses power
          — then move you again the day your discount dies.
        </p>

        <div className="hero__cta">
          <MagneticButton onClick={onStart} pull={18} cursor="open" cursorLabel="90 SEC">
            Start now
          </MagneticButton>
          <span className="hero__cta-note mono">Free · No card · 90 seconds</span>
        </div>
      </div>

      <div className="hero__meta shell">
        <span className="mono">
          <b>4,113</b> plans indexed
        </span>
        <span className="mono">
          <b>42</b> retailers
        </span>
        <span className="mono">
          <b>14</b> networks
        </span>
        <span className="mono hero__meta--scroll" aria-hidden="true">
          Scroll
        </span>
      </div>
    </section>
  )
}

/** 24-hour time-of-use profile: the object the whole product reasons about. */
function TariffField({ pathRef }: { pathRef: React.RefObject<SVGPathElement | null> }) {
  const hours = Array.from({ length: 25 }, (_, i) => i)

  return (
    <svg
      className="hero__svg"
      viewBox="0 0 1440 520"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* off-peak / shoulder / peak bands */}
      <g>
        <rect className="hero__band" x="0" y="0" width="420" height="520" fill="url(#offpeak)" opacity="0" />
        <rect className="hero__band" x="840" y="0" width="300" height="520" fill="url(#peakg)" opacity="0" />
      </g>

      <defs>
        <linearGradient id="offpeak" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="rgba(41,214,127,0.07)" />
          <stop offset="100%" stopColor="rgba(41,214,127,0)" />
        </linearGradient>
        <linearGradient id="peakg" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="rgba(226,112,92,0.09)" />
          <stop offset="100%" stopColor="rgba(226,112,92,0)" />
        </linearGradient>
      </defs>

      <g className="hero__grid">
        {hours.map((h) => (
          <line
            key={h}
            x1={h * 60}
            y1="0"
            x2={h * 60}
            y2="520"
            stroke={h % 6 === 0 ? 'rgba(238,241,239,0.11)' : 'rgba(238,241,239,0.04)'}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>

      {/* stepped tariff: cheap overnight, rising through the day, evening peak */}
      <path
        ref={pathRef}
        className="hero__curve"
        d="M0,430 H360 V392 H480 V352 H660 V330 H840 V214 H1080 V300 H1200 V392 H1440"
        fill="none"
        stroke="var(--sig)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        opacity="0"
      />
      <circle className="hero__marker" cx="1080" cy="214" r="3.5" fill="var(--sig)" opacity="0" />
    </svg>
  )
}
