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
  'globird',
  'engie',
  'ovo',
  'tango',
]

interface Props {
  value: string | null
  years: number
  onPick: (id: string) => void
  onYears: (y: number) => void
}

/**
 * Knowing the incumbent is what makes "projected savings" an honest
 * number — we price their actual expired-benefit rate rather than
 * comparing against the default offer.
 */
export function StepProvider({ value, years, onPick, onYears }: Props) {
  const featured = FEATURED.map((id) => RETAILERS.find((r) => r.id === id)!).filter(Boolean)
  const rest = RETAILERS.filter((r) => !FEATURED.includes(r.id))

  return (
    <StepFrame
      index="02"
      label="Who bills you now"
      heading={['Who are you', 'with today?']}
      hint="We price their current rates for your address, so the saving is measured against what you actually pay — not against a headline."
    >
      <div className="prov">
        <ul className="prov__grid">
          {featured.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className="prov__b"
                data-on={value === r.id || undefined}
                aria-pressed={value === r.id}
                onClick={() => onPick(r.id)}
                data-cursor="explore"
              >
                {r.name}
              </button>
            </li>
          ))}
        </ul>

        <details className="prov__more">
          <summary data-cursor="explore">Someone else</summary>
          <ul className="prov__grid prov__grid--rest">
            {rest.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="prov__b"
                  data-on={value === r.id || undefined}
                  aria-pressed={value === r.id}
                  onClick={() => onPick(r.id)}
                  data-cursor="explore"
                >
                  {r.name}
                </button>
              </li>
            ))}
          </ul>
        </details>

        <div className="prov__years">
          <label htmlFor="years" className="prov__yl mono">
            Roughly how long with them
          </label>
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
            <output className="prov__yv num">
              {years === 0 ? 'Under a year' : years === 8 ? '8+ years' : `${years} years`}
            </output>
          </div>
          <p className="prov__note">
            Rates drift upward the longer you stay. Every year on the same plan
            adds roughly 2% to what you pay, and none of it is announced.
          </p>
        </div>
      </div>
    </StepFrame>
  )
}
