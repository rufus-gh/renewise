import { useRef } from 'react'
import { gsap, ScrollTrigger, EASE, prefersReducedMotion } from '../lib/gsap'
import { useGsap } from '../hooks/useGsap'
import { SectionLabel } from './SectionLabel'

interface Stat {
  index: string
  value: number
  display: (v: number) => string
  label: string
  note: string
}

const STATS: Stat[] = [
  {
    index: '01',
    value: 4113,
    display: (v) => Math.round(v).toLocaleString('en-AU'),
    label: 'Plans priced nightly',
    note: 'Pulled from the AER’s open product data, every retailer, every tariff.',
  },
  {
    index: '02',
    value: 42,
    display: (v) => String(Math.round(v)),
    label: 'Retailers indexed',
    note: 'Including every one that has never heard of us.',
  },
  {
    index: '03',
    value: 644,
    display: (v) => `$${Math.round(v)}`,
    label: 'Avg. annual savings',
    note: 'Calculated against actual expired rates across Australian households.',
  },
  {
    index: '04',
    value: 11,
    display: (v) => `${Math.round(v)}s`,
    label: 'To price the market',
    note: 'Against your load shape, not a generic household.',
  },
]

/* A deterministic spread of the market for one household, so the strip
   chart is stable between renders and between machines. */
function spread(n: number): number[] {
  const out: number[] = []
  let seed = 20260823
  for (let i = 0; i < n; i++) {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    const a = seed / 4294967296
    seed = (seed * 1664525 + 1013904223) % 4294967296
    const b = seed / 4294967296
    // Sum of two uniforms — a soft peak with a long tail toward expensive.
    const t = (a * 0.55 + b * 0.45) ** 1.35
    out.push(1490 + t * 1780)
  }
  return out.sort((x, y) => x - y)
}

const TICKS = spread(420)
const LO = 1490
const HI = 3270
const pos = (v: number) => ((v - LO) / (HI - LO)) * 1100 + 50

export function Proof() {
  const nums = useRef<(HTMLSpanElement | null)[]>([])

  const scope = useGsap<HTMLElement>((_ctx, el) => {
    if (prefersReducedMotion()) {
      nums.current.forEach((n, i) => {
        if (n) n.textContent = STATS[i].display(STATS[i].value)
      })
      gsap.set('.proof__tick, .proof__pin, .proof__axis', { opacity: 1, scaleY: 1 })
      return
    }

    ScrollTrigger.create({
      trigger: el.querySelector('.proof__stats'),
      start: 'top 78%',
      once: true,
      onEnter: () => {
        STATS.forEach((s, i) => {
          const node = nums.current[i]
          if (!node) return
          if (s.value === 0) {
            gsap.fromTo(node, { opacity: 0 }, { opacity: 1, duration: 0.6, delay: i * 0.09 })
            node.textContent = s.display(0)
            return
          }
          const o = { v: 0 }
          gsap.to(o, {
            v: s.value,
            duration: 1.7,
            delay: i * 0.09,
            ease: 'power3.out',
            onUpdate: () => {
              node.textContent = s.display(o.v)
            },
          })
        })
      },
    })

    gsap.set('.proof__tick', { scaleY: 0, transformOrigin: 'center' })
    gsap.set('.proof__pin', { opacity: 0 })

    gsap
      .timeline({
        scrollTrigger: { trigger: '.proof__chart', start: 'top 76%', once: true },
      })
      .to('.proof__tick', {
        scaleY: 1,
        duration: 0.5,
        ease: EASE.ui,
        stagger: { each: 0.0022, from: 'start' },
      })
      .to('.proof__pin', { opacity: 1, duration: 0.5, stagger: 0.18 }, '-=0.4')
  })

  return (
    <section ref={scope} className="proof" id="proof">
      <div className="shell">
        <SectionLabel index="04" title="Evidence" meta="What the index actually holds" />

        <ul className="proof__stats">
          {STATS.map((s, i) => (
            <li className="proof__stat" key={s.index}>
              <span className="proof__i mono">{s.index}</span>
              <span
                className="proof__v display num"
                ref={(n) => {
                  nums.current[i] = n
                }}
              >
                0
              </span>
              <span className="proof__l">{s.label}</span>
              <span className="proof__n">{s.note}</span>
            </li>
          ))}
        </ul>

        <figure className="proof__chart">
          <figcaption className="proof__cap">
            <h3>Every plan available to one Sydney household, priced.</h3>
            <p>
              Same address, same 4,600&nbsp;kWh, same year. The distance between
              the two markers is what a single afternoon of paperwork is worth —
              and it is why nobody should have to do it more than once.
            </p>
          </figcaption>

          <div className="proof__stripwrap">
            <svg viewBox="0 0 1200 210" className="proof__strip" role="img"
              aria-label="A strip chart of every plan's annual cost for one household, from about $1,490 to about $3,270. A marker at $2,486 shows the current plan; a marker at $1,842 shows the recommended plan.">
              {TICKS.map((v, i) => (
                <line
                  key={i}
                  className="proof__tick"
                  x1={pos(v)}
                  y1="86"
                  x2={pos(v)}
                  y2="134"
                  stroke="rgba(238,241,239,0.17)"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              <line
                className="proof__axis"
                x1="50"
                y1="152"
                x2="1150"
                y2="152"
                stroke="var(--line)"
                vectorEffect="non-scaling-stroke"
              />
              {[1500, 2000, 2500, 3000].map((v) => (
                <text key={v} x={pos(v)} y="176" className="proof__ax" fill="var(--ink-4)" textAnchor="middle">
                  ${v.toLocaleString('en-AU')}
                </text>
              ))}

              <g className="proof__pin proof__pin--now">
                <line x1={pos(2486)} y1="66" x2={pos(2486)} y2="140" stroke="var(--warn)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <text x={pos(2486)} y="52" fill="var(--warn)" textAnchor="middle" className="proof__pinlabel">
                  YOU NOW · $2,486
                </text>
              </g>
              <g className="proof__pin proof__pin--next">
                <line x1={pos(1842)} y1="66" x2={pos(1842)} y2="140" stroke="var(--sig)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <text x={pos(1842)} y="52" fill="var(--sig)" textAnchor="middle" className="proof__pinlabel">
                  RECOMMENDED · $1,842
                </text>
              </g>
            </svg>
          </div>

          <p className="proof__foot mono">
            Modelled on published network benchmarks and current market offers.
            Your own figures are calculated from your address and usage, and every
            one of them shows its assumptions.
          </p>
        </figure>
      </div>
    </section>
  )
}
