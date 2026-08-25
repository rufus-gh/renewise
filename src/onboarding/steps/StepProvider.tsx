import { useState } from 'react'
import { RETAILERS } from '../../data/market'
import { StepFrame } from '../ui'

const FEATURED = [
  'agl',
  'origin',
  'energyaustralia',
  'alinta',
  'red',
  'momentum',
  'simply',
  'powershop',
]

interface Props {
  value: string | null
  years: number
  onPick: (id: string) => void
  onYears: (y: number) => void
}

const DURATION_PRESETS = [
  { label: 'Under 1 yr', years: 0 },
  { label: '1–2 yrs', years: 2 },
  { label: '3–4 yrs', years: 3 },
  { label: '5+ yrs', years: 5 },
]

/**
 * Clean, compact provider picker with prominent tenure selector
 * and "Other" retailer support.
 */
export function StepProvider({ value, years, onPick, onYears }: Props) {
  const [customName, setCustomName] = useState('')
  const [showOtherInput, setShowOtherInput] = useState(value === 'other')

  const featured = FEATURED.map((id) => RETAILERS.find((r) => r.id === id)!).filter(Boolean)
  const rest = RETAILERS.filter((r) => !FEATURED.includes(r.id))

  const isOther = value === 'other' || (value !== null && !RETAILERS.some((r) => r.id === value))

  const handlePickOther = () => {
    setShowOtherInput(true)
    onPick('other')
  }

  const penaltyPercent = Math.min(years, 5) * 2

  return (
    <StepFrame
      index="02"
      label="Who bills you now"
      heading={['Who are you', 'with today?']}
      hint="We price their rates for your address so savings are measured against what you actually pay."
    >
      <div className="prov">
        <ul className="prov__grid prov__grid--compact">
          {featured.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className="prov__b"
                data-on={value === r.id || undefined}
                aria-pressed={value === r.id}
                onClick={() => {
                  setShowOtherInput(false)
                  onPick(r.id)
                }}
                data-cursor="explore"
              >
                {r.name}
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="prov__b prov__b--other"
              data-on={isOther || undefined}
              aria-pressed={isOther}
              onClick={handlePickOther}
              data-cursor="explore"
            >
              Other / Not Listed
            </button>
          </li>
        </ul>

        {showOtherInput && (
          <div className="prov__custom">
            <input
              type="text"
              className="prov__custom-in"
              placeholder="Enter provider name (optional)"
              value={customName}
              onChange={(e) => {
                setCustomName(e.target.value)
                onPick(e.target.value.trim() ? `custom:${e.target.value}` : 'other')
              }}
              autoFocus
            />
          </div>
        )}

        <details className="prov__more">
          <summary data-cursor="explore">More providers ({rest.length})</summary>
          <ul className="prov__grid prov__grid--rest">
            {rest.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="prov__b"
                  data-on={value === r.id || undefined}
                  aria-pressed={value === r.id}
                  onClick={() => {
                    setShowOtherInput(false)
                    onPick(r.id)
                  }}
                  data-cursor="explore"
                >
                  {r.name}
                </button>
              </li>
            ))}
          </ul>
        </details>

        {/* Tenure Section - Prominent & Visible Above the Fold */}
        <div className="prov__years prov__years--prominent">
          <div className="prov__yhead">
            <label htmlFor="years" className="prov__yl mono">
              How long have you been on this plan?
            </label>
            <output className="prov__yv num">
              {years === 0 ? 'Under 1 year' : years === 8 ? '8+ years' : `${years} years`}
            </output>
          </div>

          <div className="prov__chips">
            {DURATION_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                className={`prov__chip mono ${years === p.years ? 'is-active' : ''}`}
                onClick={() => onYears(p.years)}
                data-cursor="explore"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="prov__yrow">
            <input
              id="years"
              type="range"
              min={0}
              max={8}
              step={1}
              value={years}
              onChange={(e) => onYears(Number(e.target.value))}
              className="slider"
            />
          </div>

          <p className="prov__note">
            {penaltyPercent > 0
              ? `Estimated +${penaltyPercent}% loyalty penalty vs new customer rates.`
              : 'Newer contracts are usually on initial discounted rates.'}
          </p>
        </div>
      </div>
    </StepFrame>
  )
}
