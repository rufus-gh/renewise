import { useEffect } from 'react'
import { RETAILER_NAME, ZONES } from '../../data/market'
import { benefitEnds, longDate, money, type Quote } from '../../data/engine'
import { MagneticButton } from '../../components/MagneticButton'

interface Props {
  quote: Quote
  onClose: () => void
  onChoose: (planId: string) => void
}

export function PlanDetailsModal({ quote, onClose, onChoose }: Props) {
  const p = quote.plan
  const r = quote.rates
  const ends = benefitEnds(p.benefitMonths)
  const zoneId = p.zones[0]
  const zoneInfo = zoneId ? ZONES[zoneId] : null

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const isTou = r.peak !== undefined

  return (
    <div className="pmodal" role="dialog" aria-modal="true" aria-labelledby="pmodal-title">
      <div className="pmodal__backdrop" onClick={onClose} />
      <div className="pmodal__dialog">
        <header className="pmodal__header">
          <div>
            <span className="pmodal__ret mono">{RETAILER_NAME.get(p.retailerId)}</span>
            <h2 id="pmodal-title" className="pmodal__name display">
              {p.name}
            </h2>
            <p className="pmodal__zone mono">
              {zoneInfo
                ? `${zoneInfo.distributor} Network · ${zoneInfo.state} · ${zoneInfo.regime}`
                : 'National Energy Market (AER CDR)'}
            </p>
          </div>
          <button
            type="button"
            className="pmodal__close"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </header>

        <div className="pmodal__body">
          {/* Headline Cost */}
          <div className="pmodal__cost-card">
            <div className="pmodal__cost-item">
              <span className="mono">Guaranteed cost</span>
              <span className="pmodal__cost-val display num">{money(quote.guaranteed)}</span>
              <span className="pmodal__cost-sub mono">/ year ({money(quote.guaranteed / 12)}/mo)</span>
            </div>
            {p.conditionalDiscount ? (
              <div className="pmodal__cost-item">
                <span className="mono">If paid on time</span>
                <span className="pmodal__cost-val pmodal__cost-val--sig display num">
                  {money(quote.best)}
                </span>
                <span className="pmodal__cost-sub mono">/ year with conditional discount</span>
              </div>
            ) : null}
          </div>

          {/* Time-of-Use Peak Hours & Schedule */}
          <div className="pmodal__section">
            <h3 className="mono pmodal__sec-title">
              {isTou ? 'Time-of-Use Windows & Peak Hours' : 'Flat Rate Schedule'}
            </h3>

            {isTou ? (
              <div className="pmodal__tou-grid">
                <div className="pmodal__tou-card pmodal__tou-card--peak">
                  <div className="pmodal__tou-top">
                    <span className="pmodal__tou-tag mono">Peak Window</span>
                    <span className="pmodal__tou-rate num">{(r.peak ?? 0).toFixed(2)}c/kWh</span>
                  </div>
                  <p className="pmodal__tou-hours">2:00 PM – 8:00 PM</p>
                  <p className="pmodal__tou-days mono">Weekdays (Mon–Fri)</p>
                  <p className="pmodal__tou-note">Highest rate window. Shift heavy loads away from these hours.</p>
                </div>

                <div className="pmodal__tou-card pmodal__tou-card--shoulder">
                  <div className="pmodal__tou-top">
                    <span className="pmodal__tou-tag mono">Shoulder Window</span>
                    <span className="pmodal__tou-rate num">{(r.shoulder ?? 0).toFixed(2)}c/kWh</span>
                  </div>
                  <p className="pmodal__tou-hours">7:00 AM – 2:00 PM &amp; 8:00 PM – 10:00 PM</p>
                  <p className="pmodal__tou-days mono">Weekdays</p>
                  <p className="pmodal__tou-note">Moderate daytime &amp; late evening rate.</p>
                </div>

                <div className="pmodal__tou-card pmodal__tou-card--offpeak">
                  <div className="pmodal__tou-top">
                    <span className="pmodal__tou-tag mono">Off-Peak (Cheapest)</span>
                    <span className="pmodal__tou-rate pmodal__tou-rate--sig num">
                      {(r.offpeak ?? 0).toFixed(2)}c/kWh
                    </span>
                  </div>
                  <p className="pmodal__tou-hours">10:00 PM – 7:00 AM &amp; All Day Weekend</p>
                  <p className="pmodal__tou-days mono">Every night + Sat &amp; Sun</p>
                  <p className="pmodal__tou-note">Best window for EV charging, pool pumps, and laundry.</p>
                </div>
              </div>
            ) : (
              <div className="pmodal__single-card">
                <div>
                  <span className="mono">Flat Usage Rate</span>
                  <p className="pmodal__tou-rate num">{(r.single ?? 0).toFixed(2)}c / kWh</p>
                  <p className="pmodal__tou-hours">All hours, 24/7</p>
                </div>
              </div>
            )}
          </div>

          <div className="pmodal__sections">
            {/* Supply & Additional Circuits */}
            <div className="pmodal__section">
              <h3 className="mono pmodal__sec-title">Daily Supply &amp; Solar Export</h3>
              <dl className="pmodal__dl">
                <div>
                  <dt>Daily supply charge (fixed)</dt>
                  <dd className="num">{r.supply.toFixed(2)}c / day</dd>
                </div>
                {r.controlledLoad !== undefined && (
                  <div>
                    <dt>Controlled load circuit (Hot water: 11pm–7am)</dt>
                    <dd className="num">{r.controlledLoad.toFixed(2)}c / kWh</dd>
                  </div>
                )}
                <div>
                  <dt>Solar feed-in tariff (FiT)</dt>
                  <dd className="num">{p.fit.toFixed(2)}c / kWh exported</dd>
                </div>
              </dl>
            </div>

            {/* Discounts & Terms */}
            <div className="pmodal__section">
              <h3 className="mono pmodal__sec-title">Discounts &amp; Contract Terms</h3>
              <dl className="pmodal__dl">
                <div>
                  <dt>Guaranteed discount</dt>
                  <dd className="num">
                    {p.guaranteedDiscount ? `${p.guaranteedDiscount}% off usage` : 'None (flat rate)'}
                  </dd>
                </div>
                <div>
                  <dt>Conditional pay-on-time</dt>
                  <dd className="num">
                    {p.conditionalDiscount
                      ? `${p.conditionalDiscount}% (only applies when paid on-time)`
                      : 'None'}
                  </dd>
                </div>
                <div>
                  <dt>Introductory benefit period</dt>
                  <dd>{p.benefitMonths ? `${p.benefitMonths} months` : 'Ongoing / No expiry'}</dd>
                </div>
                <div>
                  <dt>Benefit expiry date</dt>
                  <dd className={ends ? 'pmodal__warn' : ''}>
                    {ends ? longDate(ends) : 'Never'}
                  </dd>
                </div>
                <div>
                  <dt>Lock-in contract / Exit fee</dt>
                  <dd>{p.exitFee ? `${money(p.exitFee)} exit fee` : 'No lock-in · $0 exit fee'}</dd>
                </div>
                <div>
                  <dt>Cooling-off period</dt>
                  <dd>10 business days statutory</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <footer className="pmodal__footer">
          <button type="button" className="pmodal__back mono" onClick={onClose}>
            Back to comparison
          </button>
          <MagneticButton
            variant="solid"
            onClick={() => {
              onClose()
              onChoose(p.id)
            }}
            pull={8}
          >
            Choose this plan
          </MagneticButton>
        </footer>
      </div>
    </div>
  )
}
