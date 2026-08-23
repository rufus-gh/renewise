import { useState } from 'react'
import { gsap, EASE, shouldAnimate } from '../../lib/gsap'
import { useGsap } from '../../hooks/useGsap'
import { RETAILER_NAME } from '../../data/market'
import { benefitEnds, longDate, money, type Ranking } from '../../data/engine'
import { MagneticButton } from '../../components/MagneticButton'

interface Props {
  ranking: Ranking
  onChoose: (planId: string) => void
}

export function StepResults({ ranking, onChoose }: Props) {
  const [showAll, setShowAll] = useState(false)
  const [openAssumptions, setOpenAssumptions] = useState(false)

  const scope = useGsap<HTMLDivElement>((_ctx, el) => {
    if (!shouldAnimate()) {
      gsap.set('.res__top, .res__card, .res__more', { opacity: 1, y: 0 })
      return
    }
    gsap
      .timeline()
      .fromTo(
        el.querySelector('.res__top'),
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.6, ease: EASE.ui },
      )
      .fromTo(
        el.querySelectorAll('.res__card'),
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.8, ease: EASE.ui, stagger: 0.09 },
        0.15,
      )
      .fromTo(
        el.querySelector('.res__more'),
        { opacity: 0 },
        { opacity: 1, duration: 0.5 },
        0.6,
      )
  })

  const recommended = ranking.options.find((o) => o.kind === 'recommended')

  return (
    <div ref={scope} className="res">
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
          data-cursor="explore"
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
            Estimated from network benchmarks, so treat every figure as
            &plusmn;11%. Upload a bill and the band tightens to about &plusmn;5%.
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

              <MagneticButton
                variant={rec ? 'solid' : 'line'}
                pull={8}
                onClick={() => onChoose(q.plan.id)}
                cursor="open"
              >
                Choose this plan
              </MagneticButton>
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
          data-cursor="explore"
        >
          <span>{showAll ? 'Hide the full market' : `View all ${ranking.quotes.length} plans for your address`}</span>
          <span className="res__toggleline" aria-hidden="true" />
        </button>

        <p className="res__honest">
          Every plan below is shown whether or not we have any relationship with
          the retailer — we have none with any of them, and we are paid by you.
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
                  <th className="sr">Choose</th>
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
                        <button
                          type="button"
                          className="res__pick"
                          onClick={() => onChoose(q.plan.id)}
                          data-cursor="explore"
                        >
                          Choose
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
