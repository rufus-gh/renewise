import { gsap, EASE, shouldAnimate } from '../../lib/gsap'
import { useGsap } from '../../hooks/useGsap'
import { RETAILER_NAME, ZONES } from '../../data/market'
import { benefitEnds, longDate, money, type Quote } from '../../data/engine'
import type { Locality } from '../../data/market'

type Change =
  | 'moved'
  | 'solar'
  | 'battery'
  | 'ev'
  | 'household'
  | 'bill'

const CHANGES: { id: Change; label: string; step: number }[] = [
  { id: 'moved', label: 'I’ve moved house', step: 0 },
  { id: 'solar', label: 'I got solar', step: 3 },
  { id: 'battery', label: 'I got a battery', step: 3 },
  { id: 'ev', label: 'I bought an EV', step: 4 },
  { id: 'household', label: 'The household changed size', step: 2 },
  { id: 'bill', label: 'My bill jumped', step: 2 },
]

interface Props {
  quote: Quote
  locality: Locality
  saving: number
  mode: 'auto' | 'manual'
  onMode: (m: 'auto' | 'manual') => void
  onChange: (step: number) => void
  onExit: () => void
}

export function StepDashboard({
  quote,
  locality,
  saving,
  mode,
  onMode,
  onChange,
  onExit,
}: Props) {
  const ends = benefitEnds(quote.plan.benefitMonths)
  const days = ends
    ? Math.max(Math.round((ends.getTime() - Date.now()) / 86_400_000), 0)
    : null
  // The ring is a fuel gauge: full when the intro rate starts, emptying
  // as it runs down. Reading it as elapsed time would put a nearly empty
  // ring next to a reassuring "365 days".
  const remaining =
    days !== null && quote.plan.benefitMonths
      ? Math.min(Math.max(days / (quote.plan.benefitMonths * 30.4), 0.02), 1)
      : 1

  const scope = useGsap<HTMLDivElement>((_ctx, el) => {
    const ring = el.querySelector<SVGCircleElement>('.dash__ringfill')
    const len = ring?.getTotalLength() ?? 0
    const rest = len * (1 - remaining)

    if (!shouldAnimate()) {
      gsap.set('.dash__panel', { opacity: 1, y: 0 })
      if (ring) gsap.set(ring, { strokeDasharray: len, strokeDashoffset: rest })
      return
    }
    gsap.fromTo(
      el.querySelectorAll('.dash__panel'),
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.75, ease: EASE.ui, stagger: 0.08 },
    )
    if (ring) {
      gsap.fromTo(
        ring,
        { strokeDasharray: len, strokeDashoffset: len },
        { strokeDashoffset: rest, duration: 1.6, ease: 'power3.inOut', delay: 0.3 },
      )
    }
  })

  return (
    <div ref={scope} className="dash">
      <header className="dash__head">
        <div>
          <p className="mono">Your account</p>
          <h2 className="dash__h display">
            {locality.suburb} <span>{locality.postcode}</span>
          </h2>
          <p className="dash__sub mono">
            {ZONES[locality.zone].distributor} · {ZONES[locality.zone].state} ·{' '}
            {ZONES[locality.zone].regime} region
          </p>
        </div>
        <button type="button" className="dash__exit" onClick={onExit} data-cursor="explore">
          Back to site
        </button>
      </header>

      <div className="dash__grid">
        {/* switch status */}
        <section className="dash__panel dash__panel--status">
          <h3 className="mono">Switch in progress</h3>
          <p className="dash__plan">
            <b>{RETAILER_NAME.get(quote.plan.retailerId)}</b> {quote.plan.name}
          </p>
          <ol className="dash__steps">
            <li data-done>
              <span>Consent recorded</span>
              <span className="mono">Today</span>
            </li>
            <li data-done>
              <span>Application sent to retailer</span>
              <span className="mono">Today</span>
            </li>
            <li data-active>
              <span>Cooling-off period</span>
              <span className="mono">10 business days</span>
            </li>
            <li>
              <span>Transfer completes</span>
              <span className="mono">Next meter read</span>
            </li>
          </ol>
          <p className="dash__note">
            Nothing changes at the meter. Same wires, same poles, same
            electricity — only the name on the bill.
          </p>
        </section>

        {/* the benefit clock */}
        <section className="dash__panel dash__panel--clock">
          <h3 className="mono">The benefit clock</h3>
          <div className="dash__ringwrap">
            <svg viewBox="0 0 220 220" className="dash__ring" aria-hidden="true">
              <circle cx="110" cy="110" r="92" fill="none" stroke="var(--line)" />
              <circle
                className="dash__ringfill"
                cx="110"
                cy="110"
                r="92"
                fill="none"
                stroke="var(--sig)"
                strokeWidth="2"
                transform="rotate(-90 110 110)"
              />
              {Array.from({ length: 12 }).map((_, i) => (
                <line
                  key={i}
                  x1="110"
                  y1="8"
                  x2="110"
                  y2="16"
                  stroke="var(--line-3)"
                  transform={`rotate(${i * 30} 110 110)`}
                />
              ))}
            </svg>
            <div className="dash__ringtext">
              <span className="dash__days display num">{days ?? '∞'}</span>
              <span className="mono">{days !== null ? 'days of intro rate' : 'no expiry'}</span>
            </div>
          </div>
          <dl className="dash__clockfacts">
            <div>
              <dt>Expires</dt>
              <dd>{ends ? longDate(ends) : 'Never'}</dd>
            </div>
            <div>
              <dt>Then costs</dt>
              <dd className="num dash__warn">{money(quote.postBenefit)}/yr</dd>
            </div>
            <div>
              <dt>We re-price</dt>
              <dd>
                {ends ? longDate(new Date(ends.getTime() - 30 * 86_400_000)) : 'Quarterly'}
              </dd>
            </div>
          </dl>
        </section>

        {/* mode */}
        <section className="dash__panel dash__panel--mode">
          <h3 className="mono">When it expires</h3>
          <div className="dash__modes">
            {(['auto', 'manual'] as const).map((m) => (
              <button
                key={m}
                type="button"
                className="dash__mode"
                data-on={mode === m || undefined}
                aria-pressed={mode === m}
                onClick={() => onMode(m)}
                data-cursor="explore"
              >
                <span className="dash__modet">{m === 'auto' ? 'Auto-pilot' : 'Manual'}</span>
                <span className="dash__moded">
                  {m === 'auto'
                    ? 'We choose, you confirm with one tap seven days out.'
                    : 'We shortlist two or three, you pick.'}
                </span>
              </button>
            ))}
          </div>
          <p className="dash__note">
            Either way the law needs your consent on the actual plan. We reduce
            your part to one deliberate tap on something you have already read.
          </p>
        </section>

        {/* saving */}
        <section className="dash__panel dash__panel--save">
          <h3 className="mono">Year one</h3>
          <p className="dash__savev display num">{money(Math.max(saving, 0))}</p>
          <p className="dash__savel">saved against what you were paying</p>
          <p className="dash__note">
            Measured against {money(quote.guaranteed + Math.max(saving, 0))} a year
            on your old rates. Both figures show their working.
          </p>
        </section>

        {/* situation changed */}
        <section className="dash__panel dash__panel--change">
          <h3 className="mono">Has your situation changed?</h3>
          <p className="dash__note">
            Any of these can change which plan is right, and none of them wait
            for your renewal date.
          </p>
          <ul className="dash__changes">
            {CHANGES.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => onChange(c.step)} data-cursor="explore">
                  {c.label}
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* subscription */}
        <section className="dash__panel dash__panel--sub">
          <h3 className="mono">Your plan with us</h3>
          <p className="dash__price">
            <span className="display num">$4.99</span>
            <span className="mono">per month · first 30 days free</span>
          </p>
          <p className="dash__note">
            The comparison is always free. The ongoing monitoring ensures you never
            roll onto an expired rate without a seamless switch ready.
          </p>
        </section>
      </div>
    </div>
  )
}
