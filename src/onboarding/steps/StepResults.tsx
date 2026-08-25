import { useRef, useState } from 'react'
import { gsap, EASE, shouldAnimate } from '../../lib/gsap'
import { useGsap } from '../../hooks/useGsap'
import { RETAILER_NAME } from '../../data/market'
import { benefitEnds, longDate, money, type Quote, type Ranking } from '../../data/engine'
import { MagneticButton } from '../../components/MagneticButton'
import { PlanDetailsModal } from './PlanDetailsModal'

interface Props {
  ranking: Ranking
  onChoose: (planId: string) => void
}

export function StepResults({ ranking, onChoose }: Props) {
  const [showAll, setShowAll] = useState(false)
  const [openAssumptions, setOpenAssumptions] = useState(false)
  const [selectedDetailsQuote, setSelectedDetailsQuote] = useState<Quote | null>(null)
  const savingsNum = useRef<HTMLSpanElement>(null)

  const recommended = ranking.options.find((o) => o.kind === 'recommended')
  const maxSaving = Math.max(...ranking.options.map((o) => o.saving), 0)

  const scope = useGsap<HTMLDivElement>((_ctx, el) => {
    if (!shouldAnimate()) {
      if (savingsNum.current) savingsNum.current.textContent = money(maxSaving)
      gsap.set('.res__reveal, .res__top, .res__card, .res__more', { opacity: 1, y: 0 })
      return
    }

    const obj = { val: 0 }

    gsap
      .timeline()
      .fromTo(
        el.querySelector('.res__reveal'),
        { opacity: 0, scale: 0.95, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'power3.out' },
      )
      .to(
        obj,
        {
          val: maxSaving,
          duration: 1.4,
          ease: 'power2.out',
          onUpdate: () => {
            if (savingsNum.current) savingsNum.current.textContent = money(obj.val)
          },
        },
        0.2,
      )
      .fromTo(
        el.querySelector('.res__top'),
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.6, ease: EASE.ui },
        0.5,
      )
      .fromTo(
        el.querySelectorAll('.res__card'),
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.8, ease: EASE.ui, stagger: 0.1 },
        0.7,
      )
      .fromTo(
        el.querySelector('.res__more'),
        { opacity: 0 },
        { opacity: 1, duration: 0.5 },
        1.1,
      )
  })

  return (
    <div ref={scope} className="res">
      {/* Animated Savings Reveal Hero Banner */}
      <section className="res__reveal">
        <div className="res__reveal-badge mono">
          <span className="res__reveal-dot" />
          <span>Market Analysis Complete · 4,113 Tariffs Priced</span>
        </div>
        <h2 className="res__reveal-title">
          You could save up to{' '}
          <span ref={savingsNum} className="res__reveal-amount display num">
            {money(maxSaving)}
          </span>{' '}
          <span className="res__reveal-per">/ year</span>
        </h2>
        <p className="res__reveal-sub">
          Calculated against your incumbent plan’s expired loyalty rate. Below are your top 3 matching options:
        </p>
        <div className="res__reveal-pills mono">
          <span className="res__reveal-pill">⚡ ~{money(maxSaving / 12)}/mo instant reduction</span>
          <span className="res__reveal-pill">🛡️ 100% independent ranking</span>
          <span className="res__reveal-pill">🔄 Automated 365-day watch</span>
        </div>
      </section>

      <div className="res__top">
        <div className="res__now">
          <span className="mono">You’re paying about</span>
          <span className="res__nowv display num">{money(ranking.current)}</span>
          <span className="res__nowu mono">a year, on current rates</span>
        </div>
        <button
          type="button"
          className="res__assume mono"
          aria-expanded={openAssumptions}
          onClick={() => setOpenAssumptions((v) => !v)}
        >
          {openAssumptions ? 'Hide assumptions' : 'What this assumes'}
        </button>
      </div>

      {openAssumptions && recommended && (
        <ul className="res__assumptions">
          {recommended.quote.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
          <li>
            Estimated from network benchmarks and appliance selections (&plusmn;5% accuracy).
          </li>
        </ul>
      )}

      <ul className="res__cards">
        {ranking.options.map((o) => {
          const q = o.quote
          const ends = benefitEnds(q.plan.benefitMonths)
          const rec = o.kind === 'recommended'
          return (
            <li
              key={q.plan.id}
              className="res__card"
              data-rec={rec || undefined}
            >
              <p className="res__kind mono">{o.headline}</p>
              <h3 className="res__plan">
                <span className="res__ret">{RETAILER_NAME.get(q.plan.retailerId)}</span>
                <span className="res__name">{q.plan.name}</span>
              </h3>

              <p className="res__save">
                <span className="res__savev display num">{money(Math.max(o.saving, 0))}</span>
                <span className="res__saveu mono">saved in year one</span>
              </p>

              <dl className="res__facts">
                <div>
                  <dt>Guaranteed</dt>
                  <dd className="num">{money(q.guaranteed)}/yr</dd>
                </div>
                <div>
                  <dt>Per month</dt>
                  <dd className="num">{money(q.guaranteed / 12)}</dd>
                </div>
                {q.plan.conditionalDiscount ? (
                  <div>
                    <dt>If always on time</dt>
                    <dd className="num">{money(q.best)}/yr</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Intro rate ends</dt>
                  <dd>{ends ? longDate(ends) : 'No expiry'}</dd>
                </div>
                <div>
                  <dt>Exit fee</dt>
                  <dd className="num">{q.plan.exitFee ? money(q.plan.exitFee) : 'None'}</dd>
                </div>
                <div>
                  <dt>Solar feed-in</dt>
                  <dd className="num">{q.plan.fit.toFixed(1)}c/kWh</dd>
                </div>
              </dl>

              <p className="res__reason">{o.reason}</p>

              <div className="res__actions">
                <button
                  type="button"
                  className="res__info-btn mono"
                  onClick={() => setSelectedDetailsQuote(q)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>Peak Hours &amp; Rate Details</span>
                </button>

                <MagneticButton
                  variant={rec ? 'solid' : 'line'}
                  pull={8}
                  onClick={() => onChoose(q.plan.id)}
                >
                  Choose this plan
                </MagneticButton>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="res__more">
        <button
          type="button"
          className="res__toggle"
          aria-expanded={showAll}
          onClick={() => setShowAll((v) => !v)}
        >
          <span>{showAll ? 'Hide full market comparison' : `View all ${ranking.quotes.length} plans for your address`}</span>
          <span className="res__toggleline" aria-hidden="true" />
        </button>

        <p className="res__honest">
          Ranked purely by lowest total annual cost for your address and household load profile.
        </p>

        {showAll && (
          <div className="res__tablewrap">
            <table className="res__table">
              <thead>
                <tr>
                  <th>Retailer &amp; plan</th>
                  <th>Guaranteed</th>
                  <th>Best case</th>
                  <th>Intro ends</th>
                  <th>Feed-in</th>
                  <th>Exit</th>
                  <th className="sr">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ranking.quotes.map((q) => {
                  const ends = benefitEnds(q.plan.benefitMonths)
                  return (
                    <tr key={q.plan.id}>
                      <td>
                        <b>{RETAILER_NAME.get(q.plan.retailerId)}</b> {q.plan.name}
                      </td>
                      <td className="num">{money(q.guaranteed)}</td>
                      <td className="num">{money(q.best)}</td>
                      <td>{ends ? longDate(ends).replace(/ \d{4}$/, '') : '—'}</td>
                      <td className="num">{q.plan.fit.toFixed(1)}c</td>
                      <td className="num">{q.plan.exitFee ? money(q.plan.exitFee) : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="res__pick"
                            style={{ background: 'transparent', border: '1px solid var(--line-3)', color: 'var(--ink-2)' }}
                            onClick={() => setSelectedDetailsQuote(q)}
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            className="res__pick"
                            onClick={() => onChoose(q.plan.id)}
                          >
                            Choose
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedDetailsQuote && (
        <PlanDetailsModal
          quote={selectedDetailsQuote}
          onClose={() => setSelectedDetailsQuote(null)}
          onChoose={onChoose}
        />
      )}
    </div>
  )
}
