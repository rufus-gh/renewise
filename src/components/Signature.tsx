import { gsap, ScrollTrigger, prefersReducedMotion, isCompact } from '../lib/gsap'
import { useGsap } from '../hooks/useGsap'
import { SectionLabel } from './SectionLabel'

/**
 * The signature scene. A pinned scrub that draws the single most
 * important fact about Australian electricity: the day your benefit
 * period ends, your bill steps up, and almost nobody is watching.
 *
 * On compact screens the pin is dropped — the same timeline plays
 * through on a non-pinned trigger so the moment survives without
 * fighting a small viewport.
 */
export function Signature() {
  const scope = useGsap<HTMLElement>((_ctx, el) => {
    const stage = el.querySelector<HTMLElement>('.sig__stage')
    if (!stage) return

    if (prefersReducedMotion()) {
      gsap.set(
        '.sig__word, .sig__axis, .sig__band, .sig__cliff, .sig__jump, .sig__save, .sig__mark, .sig__hold, .sig__caption, .sig__verdict',
        { opacity: 1, xPercent: 0, scaleX: 1, strokeDashoffset: 0, y: 0 },
      )
      return
    }

    const compact = isCompact()
    const draw = (sel: string) => {
      const p = el.querySelector<SVGPathElement>(sel)
      if (!p) return 0
      const len = p.getTotalLength()
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 })
      return len
    }

    draw('.sig__axis')
    draw('.sig__cliff')
    draw('.sig__hold')
    gsap.set('.sig__band', { scaleX: 0, transformOrigin: 'left center' })
    gsap.set('.sig__jump, .sig__save, .sig__mark, .sig__caption, .sig__verdict', { opacity: 0 })
    gsap.set('.sig__verdict', { y: 26 })

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'top top',
        end: compact ? 'bottom bottom' : '+=340%',
        scrub: compact ? 0.6 : 1,
        pin: compact ? false : stage,
        pinSpacing: !compact,
        anticipatePin: 1,
      },
    })

    tl
      // 1 — the number splits and lets the chart through
      // The pair parts to the gutters and stays legible — travelling far
      // enough to crop the glyphs reads as a bug, not a decision.
      .to('.sig__word--a', { xPercent: -48, duration: 1 }, 0)
      .to('.sig__word--b', { xPercent: 48, duration: 1 }, 0)
      .to('.sig__title', { opacity: 0.14, duration: 1 }, 0.4)

      // 2 — the axis
      .to('.sig__axis', { strokeDashoffset: 0, duration: 0.8 }, 0.6)

      // 3 — the discounted year
      .to('.sig__band', { scaleX: 1, duration: 1.1, ease: 'power2.inOut' }, 1.0)
      .to('.sig__caption--band', { opacity: 1, duration: 0.4 }, 1.5)

      // 4 — the cliff
      .to('.sig__cliff', { strokeDashoffset: 0, duration: 0.9 }, 2.1)
      .to('.sig__jump', { opacity: 1, duration: 0.5 }, 2.5)
      .to('.sig__caption--cliff', { opacity: 1, duration: 0.4 }, 2.7)

      // 5 — the intervention
      .to('.sig__mark', { opacity: 1, duration: 0.4 }, 3.3)
      .to('.sig__caption--mark', { opacity: 1, duration: 0.4 }, 3.4)
      .to('.sig__hold', { strokeDashoffset: 0, duration: 0.9 }, 3.5)
      .to('.sig__cliff', { opacity: 0.22, duration: 0.6 }, 3.6)
      .to('.sig__jump', { opacity: 0.28, duration: 0.6 }, 3.6)
      .to('.sig__save', { opacity: 1, duration: 0.5 }, 3.9)

      // 6 — the verdict
      .to('.sig__verdict', { opacity: 1, y: 0, duration: 0.7 }, 4.4)

    ScrollTrigger.refresh()
  })

  return (
    <section ref={scope} className="sig" id="cliff">
      <div className="sig__stage">
        <div className="shell sig__shell">
          <SectionLabel index="03" title="Day 365" meta="The moment nobody is watching" />

          <h2 className="sig__title display" aria-label="Day 365">
            <span className="sig__word sig__word--a">Day</span>
            <span className="sig__word sig__word--b">365</span>
          </h2>

          <div className="sig__chart">
            <svg
              viewBox="0 0 1200 520"
              className="sig__svg"
              role="img"
              aria-label="A discounted rate of $1,842 a year runs for twelve months, then steps up by $312 when the benefit period ends. A marker thirty days before expiry shows Renewise re-pricing the market so the line continues flat instead."
            >
              {/* discounted year */}
              <rect
                className="sig__band"
                x="90"
                y="352"
                width="790"
                height="66"
                fill="var(--sig-wash)"
              />
              <path
                className="sig__hold"
                d="M880,352 H1130"
                stroke="var(--sig)"
                strokeWidth="2"
                fill="none"
                vectorEffect="non-scaling-stroke"
              />
              <path
                className="sig__band-line"
                d="M90,352 H880"
                stroke="var(--sig)"
                strokeWidth="2"
                fill="none"
                vectorEffect="non-scaling-stroke"
              />

              {/* the cliff */}
              <path
                className="sig__cliff"
                d="M880,352 V196 H1130"
                stroke="var(--warn)"
                strokeWidth="2"
                fill="none"
                vectorEffect="non-scaling-stroke"
              />

              {/* axis */}
              <path
                className="sig__axis"
                d="M90,418 H1130"
                stroke="var(--line-3)"
                strokeWidth="1"
                fill="none"
                vectorEffect="non-scaling-stroke"
              />
              <g className="sig__ticks">
                {[
                  { x: 90, l: 'DAY 0' },
                  { x: 485, l: 'DAY 180' },
                  { x: 806, l: 'DAY 335' },
                  { x: 880, l: 'DAY 365' },
                ].map((t) => (
                  <g key={t.l}>
                    <line
                      x1={t.x}
                      y1="418"
                      x2={t.x}
                      y2="426"
                      stroke="var(--line-3)"
                      vectorEffect="non-scaling-stroke"
                    />
                    <text x={t.x} y="446" className="sig__tick" fill="var(--ink-4)">
                      {t.l}
                    </text>
                  </g>
                ))}
              </g>

              {/* the intervention */}
              <g className="sig__mark">
                <line
                  x1="806"
                  y1="352"
                  x2="806"
                  y2="286"
                  stroke="var(--sig)"
                  strokeDasharray="3 3"
                  vectorEffect="non-scaling-stroke"
                />
                <circle cx="806" cy="286" r="4" fill="var(--sig)" />
              </g>

              <text className="sig__jump" x="900" y="176" fill="var(--warn)">
                $2,154
              </text>
              <text className="sig__save" x="900" y="336" fill="var(--sig)">
                $1,842
              </text>
            </svg>

            <p className="sig__caption sig__caption--band mono">
              <b>Twelve months</b> at the rate you were sold
            </p>
            <p className="sig__caption sig__caption--cliff mono">
              <b>+$312 a year</b> · nobody has to tell you twice
            </p>
            <p className="sig__caption sig__caption--mark mono">
              <b>T−30</b> · market re-priced, next plan chosen
            </p>
          </div>

          <p className="sig__verdict">
            <span>The letter arrives. It is compliant, it is honest, and it goes in the bin.</span>
            <strong>We were already looking.</strong>
          </p>
        </div>
      </div>
    </section>
  )
}
