import { gsap, ScrollTrigger, EASE, prefersReducedMotion } from '../lib/gsap'
import { useGsap } from '../hooks/useGsap'
import { SectionLabel } from './SectionLabel'
import { SplitLines } from './SplitLines'

interface Capability {
  index: string
  title: string[]
  body: string
  detail: string
}

const CAPS: Capability[] = [
  {
    index: '01',
    title: ['Every plan.', 'Including the', 'ones we earn', 'nothing from.'],
    body: 'Australian retailers are required to publish their tariffs as open data. We ingest all of it every night — around four thousand offers across forty-two retailers — and price the lot.',
    detail: 'There is no partner list. There is nothing to disclose, because there is nothing to disclose.',
  },
  {
    index: '02',
    title: ['Your roof', 'changes the', 'answer.'],
    body: 'A household with 6.6 kW of panels and a battery does not want the same plan as the flat next door. Export rates, time-of-use windows and overnight shifting can invert the entire ranking.',
    detail: 'So we model your load shape — generation, self-consumption, export and controlled load — before a single plan is compared.',
  },
  {
    index: '03',
    title: ['We hold', 'your expiry', 'date from', 'day one.'],
    body: 'The moment you sign, we know when your benefit period ends. Thirty days out we re-price the entire market against your current usage and choose what comes next.',
    detail: 'You get told what we picked and why, while the old rate is still cheap.',
  },
  {
    index: '04',
    title: ['One tap,', 'because the', 'law says so.'],
    body: 'No third party can move you between retailers without your explicit informed consent for that specific contract. That is not a limitation we can engineer around, and we would not want to.',
    detail: 'So we do everything else — and reduce your part to a single deliberate tap on a plan you have already seen.',
  },
]

export function Capabilities() {
  const scope = useGsap<HTMLElement>((_ctx, el) => {
    const scenes = el.querySelectorAll<HTMLElement>('.caps__scene')
    const blocks = el.querySelectorAll<HTMLElement>('.caps__block')
    const reduced = prefersReducedMotion()

    // The scenes are stacked in one box, so exactly one may ever be
    // visible — including under reduced motion, where they simply cut.
    gsap.set(scenes, { opacity: 0 })
    gsap.set(scenes[0], { opacity: 1 })
    blocks[0]?.classList.add('is-active')

    // Class toggles rather than React state: nothing re-renders on scroll.
    const activate = (i: number) => {
      scenes.forEach((s, j) => {
        const to = j === i ? 1 : 0
        if (reduced) gsap.set(s, { opacity: to })
        else gsap.to(s, { opacity: to, duration: 0.5, ease: EASE.ui, overwrite: true })
      })
      blocks.forEach((b, j) => b.classList.toggle('is-active', j === i))
    }

    blocks.forEach((b, i) => {
      ScrollTrigger.create({
        trigger: b,
        start: 'top 58%',
        end: 'bottom 42%',
        onEnter: () => activate(i),
        onEnterBack: () => activate(i),
      })
    })
  })

  return (
    <section ref={scope} className="caps" id="capabilities">
      <div className="shell">
        <SectionLabel index="05" title="What it does" meta="Four things, in order of difficulty" />
      </div>

      <div className="shell caps__grid">
        <div className="caps__sticky">
          <div className="caps__viewport">
            <div className="caps__scene">
              <SceneMarket />
            </div>
            <div className="caps__scene">
              <SceneSolar />
            </div>
            <div className="caps__scene">
              <SceneClock />
            </div>
            <div className="caps__scene">
              <SceneConsent />
            </div>
          </div>
        </div>

        <div className="caps__flow">
          {CAPS.map((c) => (
            <article className="caps__block" key={c.index}>
              <span className="caps__i mono">{c.index}</span>
              <SplitLines
                as="h3"
                className="caps__t display"
                lines={c.title}
                stagger={0.07}
              />
              <p className="caps__b">{c.body}</p>
              <p className="caps__d">{c.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Scenes ───────────────────────────────────────────────────
   Each is a small, specific instrument rather than an illustration. */

function SceneMarket() {
  const cols = 14
  const rows = 9
  return (
    <svg viewBox="0 0 420 300" aria-hidden="true" className="scene">
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const lit = (r * cols + c) % 11 === 3
          return (
            <rect
              key={`${r}-${c}`}
              x={20 + c * 28}
              y={30 + r * 28}
              width={18}
              height={18}
              fill={lit ? 'var(--sig-wash)' : 'transparent'}
              stroke={lit ? 'var(--sig-line)' : 'var(--line)'}
              vectorEffect="non-scaling-stroke"
            />
          )
        }),
      )}
      <text x="20" y="296" className="scene__cap" fill="var(--ink-3)">
        4,113 OFFERS · 42 RETAILERS · 14 NETWORKS
      </text>
    </svg>
  )
}

const GENERATION = 'M20,220 C80,220 110,150 160,110 C200,78 240,74 280,104 C320,134 350,206 400,220'
const CONSUMPTION =
  'M20,190 C90,186 120,170 150,150 C185,128 210,140 250,120 C290,100 320,70 360,60 L400,58'

function SceneSolar() {
  return (
    <svg viewBox="0 0 420 300" aria-hidden="true" className="scene">
      <defs>
        {/* Export is generation minus what the house uses, so the shaded
            region is the generation area clipped to above the load curve —
            not a hand-drawn blob that only looks about right. */}
        <clipPath id="aboveLoad">
          <path d={`${CONSUMPTION} L400,0 L20,0 Z`} />
        </clipPath>
      </defs>

      <path d="M20,220 H400" stroke="var(--line)" vectorEffect="non-scaling-stroke" />

      <path d={`${GENERATION} L400,220 L20,220 Z`} fill="var(--sig-wash)" clipPath="url(#aboveLoad)" />

      <path
        d={CONSUMPTION}
        fill="none"
        stroke="var(--ink-4)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={GENERATION}
        fill="none"
        stroke="var(--sig)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />

      <text x="212" y="132" className="scene__cap" fill="var(--sig)" textAnchor="middle">
        EXPORTED
      </text>
      <text x="36" y="206" className="scene__cap" fill="var(--ink-3)">
        HOUSE LOAD
      </text>
      <text x="20" y="296" className="scene__cap" fill="var(--ink-3)">
        6.6 kW · 8,910 kWh GENERATED · 5,880 kWh EXPORTED
      </text>
    </svg>
  )
}

function SceneClock() {
  const R = 84
  const C = 2 * Math.PI * R
  return (
    <svg viewBox="0 0 420 300" aria-hidden="true" className="scene">
      <g transform="translate(210,140)">
        <circle r={R} fill="none" stroke="var(--line)" vectorEffect="non-scaling-stroke" />
        <circle
          r={R}
          fill="none"
          stroke="var(--sig)"
          strokeWidth="2"
          strokeDasharray={`${C * 0.84} ${C}`}
          strokeLinecap="butt"
          transform="rotate(-90)"
          vectorEffect="non-scaling-stroke"
        />
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={i}
            x1="0"
            y1={-R - 6}
            x2="0"
            y2={-R - 12}
            stroke="var(--line-3)"
            transform={`rotate(${i * 30})`}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <text y="4" textAnchor="middle" className="scene__big" fill="var(--ink)">
          58
        </text>
        <text y="28" textAnchor="middle" className="scene__cap" fill="var(--ink-3)">
          DAYS TO EXPIRY
        </text>
      </g>
      <text x="20" y="296" className="scene__cap" fill="var(--ink-3)">
        RE-PRICE SCHEDULED · 14 NOV 2027
      </text>
    </svg>
  )
}

function SceneConsent() {
  return (
    <svg viewBox="0 0 420 300" aria-hidden="true" className="scene">
      <rect x="60" y="52" width="300" height="180" fill="var(--g-lift)" stroke="var(--line)" vectorEffect="non-scaling-stroke" />
      <text x="82" y="84" className="scene__cap" fill="var(--ink-3)">
        RED ENERGY · LIVING ENERGY SAVER
      </text>
      <text x="82" y="122" className="scene__big" fill="var(--ink)">
        $1,842
      </text>
      <text x="82" y="144" className="scene__cap" fill="var(--ink-3)">
        GUARANTEED · PER YEAR
      </text>
      <rect x="82" y="168" width="256" height="40" fill="var(--sig)" />
      <text x="210" y="193" textAnchor="middle" className="scene__btn" fill="var(--g-void)">
        CONFIRM SWITCH
      </text>
      <circle cx="316" cy="188" r="16" fill="none" stroke="var(--sig)" strokeWidth="1" opacity="0.5" vectorEffect="non-scaling-stroke" />
      <text x="20" y="296" className="scene__cap" fill="var(--ink-3)">
        EXPLICIT INFORMED CONSENT · RECORDED · TIMESTAMPED
      </text>
    </svg>
  )
}
