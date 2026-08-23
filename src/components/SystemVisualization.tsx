import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/gsap'
import { useGsap } from '../hooks/useGsap'
import { SectionLabel } from './SectionLabel'

interface Node {
  id: string
  label: string
  value: string
  unit: string
  note: string
}

const NODES: Node[] = [
  {
    id: 'meter',
    label: 'Meter',
    value: '4,600',
    unit: 'kWh / yr',
    note: 'Your load shape, from benchmarks or two years of interval data.',
  },
  {
    id: 'market',
    label: 'Market',
    value: '4,113',
    unit: 'plans',
    note: 'Every authorised retailer, pulled nightly from open CDR data.',
  },
  {
    id: 'match',
    label: 'Match',
    value: '03',
    unit: 'options',
    note: 'Priced against your shape, ranked on what you said matters.',
  },
  {
    id: 'switch',
    label: 'Switch',
    value: '10',
    unit: 'business days',
    note: 'Consent recorded, cooling-off runs, transfer completes.',
  },
  {
    id: 'watch',
    label: 'Watch',
    value: '365',
    unit: 'days held',
    note: 'Your expiry date is known from the day you sign.',
  },
]

const W = 240
const GAP = 42
const BOX_H = 122
const TOP = 96

/**
 * The product loop, drawn as a system rather than a flowchart. The
 * return path is the important edge — everything to the left of it is
 * what a comparison site does, and the loop is what a subscription
 * buys.
 */
export function SystemVisualization() {
  const scope = useGsap<HTMLElement>((_ctx, el) => {
    const boxes = el.querySelectorAll('.sysv__box')
    const links = el.querySelectorAll<SVGPathElement>('.sysv__link')
    const loop = el.querySelector<SVGPathElement>('.sysv__loop')

    if (prefersReducedMotion()) {
      gsap.set([boxes, links, loop, '.sysv__val', '.sysv__loop-label'], { opacity: 1 })
      gsap.set([links, loop], { strokeDashoffset: 0 })
      return
    }

    links.forEach((l) => {
      const len = l.getTotalLength()
      gsap.set(l, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 })
    })
    if (loop) {
      const len = loop.getTotalLength()
      gsap.set(loop, { strokeDasharray: `6 6`, strokeDashoffset: len, opacity: 0 })
    }
    gsap.set(boxes, { opacity: 0.18 })
    gsap.set('.sysv__val', { opacity: 0, y: 8 })

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'top 68%',
        end: 'bottom 78%',
        scrub: 0.8,
      },
    })

    NODES.forEach((_, i) => {
      const at = i * 0.85
      tl.to(`.sysv__box--${i}`, { opacity: 1, duration: 0.45 }, at)
        .to(`.sysv__box--${i} .sysv__frame`, { stroke: 'rgba(41,214,127,0.34)', duration: 0.45 }, at)
        .to(`.sysv__box--${i} .sysv__val`, { opacity: 1, y: 0, duration: 0.5 }, at + 0.12)
      if (i < NODES.length - 1) {
        tl.to(`.sysv__link--${i}`, { strokeDashoffset: 0, duration: 0.6 }, at + 0.3)
      }
    })

    tl.to(loop, { opacity: 1, strokeDashoffset: 0, duration: 1.2 }, NODES.length * 0.85)
    tl.to('.sysv__loop-label', { opacity: 1, duration: 0.5 }, NODES.length * 0.85 + 0.4)

    // A signal travelling the return edge, running only while on screen.
    const pulse = gsap.timeline({ repeat: -1, repeatDelay: 0.7, paused: true })
    if (loop) {
      pulse
        .set('.sysv__pulse', { opacity: 0 })
        .to('.sysv__pulse', { opacity: 1, duration: 0.35 }, 0)
        .to(
          '.sysv__pulse',
          {
            motionPath: { path: loop, align: loop, alignOrigin: [0.5, 0.5] },
            duration: 3.4,
            ease: 'none',
          },
          0,
        )
        .to('.sysv__pulse', { opacity: 0, duration: 0.4 }, 3.0)
    }

    ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => (self.isActive ? pulse.play() : pulse.pause()),
    })
  })

  const totalW = NODES.length * W + (NODES.length - 1) * GAP

  return (
    <section ref={scope} className="sysv" id="system">
      <div className="shell">
        <SectionLabel index="02" title="The system" meta="Meter → market → match → switch → watch" />

        <div className="sysv__head">
          <h2 className="sysv__h display">
            One loop,
            <br />
            running for
            <br />
            as long as
            <br />
            you live here.
          </h2>
          <p className="sysv__lede">
            Most of this diagram is what a comparison site does once. The dashed
            edge on the right is the part that runs every year without you
            thinking about it — and it is the only part that is hard to build.
          </p>
        </div>

        <div className="sysv__figure">
          <svg
            viewBox={`0 0 ${totalW} 320`}
            className="sysv__svg"
            role="img"
            aria-label="Five stages — meter, market, match, switch, watch — connected left to right, with a dashed return path from watch back to market labelled re-price and re-switch."
          >
            {NODES.map((n, i) => {
              const x = i * (W + GAP)
              return (
                <g key={n.id} className={`sysv__box sysv__box--${i}`}>
                  <rect
                    className="sysv__frame"
                    x={x}
                    y={TOP}
                    width={W}
                    height={BOX_H}
                    fill="var(--g-lift)"
                    stroke="var(--line)"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    x={x + 18}
                    y={TOP + 28}
                    className="sysv__idx"
                    fill="var(--ink-4)"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </text>
                  <text x={x + 18} y={TOP + 62} className="sysv__label" fill="var(--ink)">
                    {n.label.toUpperCase()}
                  </text>
                  <g className="sysv__val">
                    {/* One text node with tspans so the unit sits off the
                        measured width of the value, not a guessed offset. */}
                    <text x={x + 18} y={TOP + 98} className="sysv__value" fill="var(--sig)">
                      {n.value}
                      <tspan className="sysv__unit" fill="var(--ink-3)" dx="10">
                        {n.unit}
                      </tspan>
                    </text>
                  </g>
                  <foreignObject x={x} y={TOP + BOX_H + 14} width={W} height="86">
                    <p className="sysv__note">{n.note}</p>
                  </foreignObject>

                  {i < NODES.length - 1 && (
                    <path
                      className={`sysv__link sysv__link--${i}`}
                      d={`M${x + W},${TOP + BOX_H / 2} H${x + W + GAP}`}
                      stroke="var(--sig)"
                      strokeWidth="1"
                      fill="none"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                </g>
              )
            })}

            {/* the return edge — the business */}
            <path
              className="sysv__loop"
              d={`M${4 * (W + GAP) + W / 2},${TOP - 12} V40 H${1 * (W + GAP) + W / 2} V${TOP - 12}`}
              stroke="var(--sig)"
              strokeWidth="1"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={`M${1 * (W + GAP) + W / 2 - 5},${TOP - 22} L${1 * (W + GAP) + W / 2},${TOP - 12} L${1 * (W + GAP) + W / 2 + 5},${TOP - 22}`}
              className="sysv__loop-label"
              stroke="var(--sig)"
              strokeWidth="1"
              fill="none"
              opacity="0"
              vectorEffect="non-scaling-stroke"
            />
            <text
              className="sysv__loop-label sysv__loop-text"
              x={2.5 * (W + GAP) + W / 2}
              y="28"
              textAnchor="middle"
              fill="var(--sig)"
              opacity="0"
            >
              BENEFIT EXPIRES → RE-PRICE → RE-SWITCH
            </text>
            <circle className="sysv__pulse" r="3.5" fill="var(--sig)" opacity="0" />
          </svg>
        </div>
      </div>
    </section>
  )
}
