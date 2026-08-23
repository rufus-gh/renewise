import { useRef } from 'react'
import { gsap, EASE, shouldAnimate } from '../../lib/gsap'
import { useGsap } from '../../hooks/useGsap'
import { RETAILER_NAME, ZONES } from '../../data/market'
import { money, type Profile, type Quote } from '../../data/engine'

interface Props {
  profile: Profile
  quotes: Quote[]
  onDone: () => void
}

const TOTAL = 4113

/**
 * Not a spinner. Real work is happening — every plan in the zone is
 * priced against this household's load shape — so the screen shows the
 * machine working. Floors at 2.6s so it registers, ceilings at 4.2s so
 * it never feels stuck.
 */
export function StepCalculating({ profile, quotes, onDone }: Props) {
  const counter = useRef<HTMLSpanElement>(null)
  const best = useRef<HTMLSpanElement>(null)
  const feed = useRef<HTMLUListElement>(null)

  const scope = useGsap<HTMLDivElement>(
    (_ctx) => {
      if (!shouldAnimate()) {
        if (counter.current) counter.current.textContent = TOTAL.toLocaleString('en-AU')
        if (best.current) best.current.textContent = money(quotes[0]?.guaranteed ?? 0)
        gsap.set('.calc__frame', { opacity: 1, y: 0 })
        gsap.set('.calc__barfill', { scaleX: 1 })
        gsap.set('.calc__done', { opacity: 1 })
        const t = window.setTimeout(onDone, 700)
        return () => window.clearTimeout(t)
      }

      const state = { n: 0, best: (quotes[quotes.length - 1]?.guaranteed ?? 2600) * 1.08 }
      const target = quotes[0]?.guaranteed ?? 1800
      const rows = feed.current

      // The timeline drives the reveal, but completion must not depend on
      // it: a backgrounded tab stops rAF, and this screen can never be the
      // place a customer gets stuck.
      let finished = false
      const finish = () => {
        if (finished) return
        finished = true
        onDone()
      }
      const ceiling = window.setTimeout(finish, 4600)

      const tl = gsap.timeline({ onComplete: finish })

      tl.fromTo(
        '.calc__frame',
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.5, ease: EASE.ui },
      )
        .to(
          state,
          {
            n: TOTAL,
            duration: 2.5,
            ease: 'power2.inOut',
            onUpdate: () => {
              if (counter.current)
                counter.current.textContent = Math.round(state.n).toLocaleString('en-AU')
            },
          },
          0.1,
        )
        .to(
          state,
          {
            best: target,
            duration: 2.4,
            ease: 'power3.inOut',
            onUpdate: () => {
              if (best.current) best.current.textContent = money(state.best)
            },
          },
          0.2,
        )
        .to('.calc__barfill', { scaleX: 1, duration: 2.5, ease: 'power2.inOut' }, 0.1)
        .to('.calc__done', { opacity: 1, duration: 0.4 }, 2.7)
        .to({}, { duration: 0.35 })

      // The feed is written straight to the DOM — no state, no re-renders.
      let i = 0
      const tick = window.setInterval(() => {
        if (!rows) return
        const q = quotes[i % quotes.length]
        const li = document.createElement('li')
        li.className = 'calc__row'
        li.innerHTML = `<span>${RETAILER_NAME.get(q.plan.retailerId) ?? ''} · ${q.plan.name}</span><span class="num">${money(q.guaranteed)}</span>`
        rows.prepend(li)
        while (rows.childElementCount > 7) rows.lastElementChild?.remove()
        gsap.fromTo(li, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.28 })
        i++
      }, 190)

      return () => {
        window.clearInterval(tick)
        window.clearTimeout(ceiling)
      }
    },
    [],
  )

  const shapeLabel =
    profile.archetype === 'lean' ? 'LEAN' : profile.archetype === 'family' ? 'FAMILY' : 'HEAVY'

  return (
    <div ref={scope} className="calc">
      <div className="calc__frame">
        <p className="calc__label mono">Pricing the market</p>

        <p className="calc__count display num">
          <span ref={counter}>0</span>
          <span className="calc__of">/ {TOTAL.toLocaleString('en-AU')}</span>
        </p>

        <div className="calc__bar">
          <span className="calc__barfill" />
        </div>

        <ul ref={feed} className="calc__feed" aria-hidden="true" />

        <dl className="calc__meta mono">
          <div>
            <dt>Network</dt>
            <dd>{ZONES[profile.zone].distributor}</dd>
          </div>
          <div>
            <dt>Load shape</dt>
            <dd>
              {shapeLabel} · {profile.annualKwh.toLocaleString('en-AU')} kWh
            </dd>
          </div>
          <div>
            <dt>Solar</dt>
            <dd>{profile.solarKw > 0 ? `${profile.solarKw.toFixed(1)} kW` : 'None'}</dd>
          </div>
          <div>
            <dt>Battery</dt>
            <dd>{profile.battery ? 'Yes' : 'No'}</dd>
          </div>
        </dl>

        <p className="calc__best">
          <span className="mono">Best so far</span>
          <span ref={best} className="calc__bestv display num">
            $0
          </span>
        </p>

        <p className="calc__done mono">Complete · ranking results</p>
      </div>
    </div>
  )
}
