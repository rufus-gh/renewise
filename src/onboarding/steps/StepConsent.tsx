import { useState } from 'react'
import { RETAILER_NAME } from '../../data/market'
import { benefitEnds, longDate, money, type Quote } from '../../data/engine'
import { MagneticButton } from '../../components/MagneticButton'
import { StepFrame } from '../ui'

interface Props {
  quote: Quote
  onConfirm: () => void
  onBack: () => void
}

/**
 * Full disclosure, then explicit informed consent. Under the National
 * Energy Retail Law this cannot be a pre-ticked box and the record has
 * to be produceable years later — so the box starts empty, and what was
 * shown at the moment of consent is exactly what is stored.
 */
export function StepConsent({ quote, onConfirm, onBack }: Props) {
  const [agreed, setAgreed] = useState(false)
  const p = quote.plan
  const ends = benefitEnds(p.benefitMonths)

  // The rates shown are the ones this zone is actually charged, so the
  // arithmetic on this screen reproduces the total above it.
  const r = quote.rates
  const rates =
    r.single !== undefined
      ? [{ label: 'All usage', value: `${r.single.toFixed(2)}c / kWh` }]
      : [
          { label: 'Peak', value: `${(r.peak ?? 0).toFixed(2)}c / kWh` },
          { label: 'Shoulder', value: `${(r.shoulder ?? 0).toFixed(2)}c / kWh` },
          { label: 'Off-peak', value: `${(r.offpeak ?? 0).toFixed(2)}c / kWh` },
        ]

  return (
    <StepFrame
      index="07"
      label="Before you commit"
      heading={['Everything', 'you are', 'agreeing to.']}
      hint="No summary, no small print elsewhere. This is the plan exactly as the retailer publishes it."
      wide
    >
      <div className="cons">
        <header className="cons__head">
          <span className="cons__ret">{RETAILER_NAME.get(p.retailerId)}</span>
          <h3 className="cons__name display">{p.name}</h3>
          <p className="cons__price">
            <span className="display num">{money(quote.guaranteed)}</span>
            <span className="mono">estimated per year, guaranteed rate</span>
          </p>
        </header>

        <div className="cons__grid">
          <section className="cons__block">
            <h4 className="mono">Rates</h4>
            <dl>
              <div>
                <dt>Daily supply charge</dt>
                <dd className="num">{r.supply.toFixed(2)}c / day</dd>
              </div>
              {rates.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd className="num">{row.value}</dd>
                </div>
              ))}
              {r.controlledLoad !== undefined && (
                <div>
                  <dt>Controlled load</dt>
                  <dd className="num">{r.controlledLoad.toFixed(2)}c / kWh</dd>
                </div>
              )}
              <div>
                <dt>Solar feed-in</dt>
                <dd className="num">{p.fit.toFixed(2)}c / kWh exported</dd>
              </div>
            </dl>
          </section>

          <section className="cons__block">
            <h4 className="mono">Discounts</h4>
            <dl>
              <div>
                <dt>Guaranteed</dt>
                <dd className="num">
                  {p.guaranteedDiscount ? `${p.guaranteedDiscount}% off usage` : 'None'}
                </dd>
              </div>
              <div>
                <dt>Conditional</dt>
                <dd className="num">
                  {p.conditionalDiscount
                    ? `${p.conditionalDiscount}% — only if every bill is paid on time`
                    : 'None'}
                </dd>
              </div>
              <div>
                <dt>Sign-up credit</dt>
                <dd className="num">{p.signupCredit ? money(p.signupCredit) : 'None'}</dd>
              </div>
              <div>
                <dt>If you never earn the conditional discount</dt>
                <dd className="num cons__hi">{money(quote.guaranteed)} / yr</dd>
              </div>
            </dl>
          </section>

          <section className="cons__block">
            <h4 className="mono">Term</h4>
            <dl>
              <div>
                <dt>Intro rate lasts</dt>
                <dd>{p.benefitMonths ? `${p.benefitMonths} months` : 'Ongoing — no expiry'}</dd>
              </div>
              <div>
                <dt>Which means it ends</dt>
                <dd className={ends ? 'cons__warn' : ''}>
                  {ends ? longDate(ends) : 'Never'}
                </dd>
              </div>
              <div>
                <dt>Estimated cost after that</dt>
                <dd className="num">{money(quote.postBenefit)} / yr</dd>
              </div>
              <div>
                <dt>Exit fee</dt>
                <dd className="num">{p.exitFee ? money(p.exitFee) : 'None'}</dd>
              </div>
              <div>
                <dt>Lock-in</dt>
                <dd>{p.lockIn ? 'Yes' : 'No'}</dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="cons__legal">
          <p>
            You have <b>10 business days</b> to change your mind after the
            contract starts, with no penalty. The transfer completes after that,
            and your supply is never interrupted — the wires and the meter do not
            change, only who bills you.
          </p>

          <label className="cons__check">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>
              I have read the rates, discounts and term above, and I consent to
              being transferred to this plan. I understand this consent is
              recorded with today’s date and the figures shown on this screen.
            </span>
          </label>

          <div className="cons__actions">
            <MagneticButton
              variant="solid"
              disabled={!agreed}
              onClick={onConfirm}
              pull={10}
              cursor="open"
            >
              Confirm and switch
            </MagneticButton>
            <button type="button" className="cons__back" onClick={onBack} data-cursor="explore">
              Back to the three options
            </button>
          </div>
        </div>
      </div>
    </StepFrame>
  )
}
