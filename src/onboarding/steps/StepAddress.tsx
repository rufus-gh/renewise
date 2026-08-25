import { useEffect, useState } from 'react'
import { ZONES, type Locality } from '../../data/market'
import { searchLocalities } from '../../data/postcodes'
import { StepFrame } from '../ui'

interface Props {
  value: Locality | null
  onPick: (l: Locality) => void
}

/**
 * One field. Resolves the distribution zone across all Australian
 * postcodes and suburbs via the open dataset index.
 */
export function StepAddress({ value, onPick }: Props) {
  const [q, setQ] = useState(value ? `${value.suburb} ${value.postcode}` : '')
  const [matches, setMatches] = useState<Locality[]>([])

  useEffect(() => {
    let active = true
    const term = q.trim()
    if (term.length < 2) {
      setMatches([])
      return
    }

    searchLocalities(term, 8).then((res) => {
      if (active) setMatches(res)
    })

    return () => {
      active = false
    }
  }, [q])

  return (
    <StepFrame
      index="01"
      label="Where you live"
      heading={['Where are we', 'switching?']}
      hint="Suburb or postcode is enough. Your network — not your state — sets which plans you can actually get."
    >
      <div className="addr">
        <label className="addr__field">
          <span className="sr">Suburb or postcode</span>
          <input
            className="addr__input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Surry Hills, or 2010"
            autoComplete="off"
            spellCheck={false}
            aria-describedby="addr-help"
          />
          <span className="addr__caret" aria-hidden="true" />
        </label>

        <p id="addr-help" className="addr__help mono">
          {matches.length > 0
            ? `${matches.length} match${matches.length > 1 ? 'es' : ''}`
            : 'Try Surry Hills, Geelong, Adelaide, Brisbane City'}
        </p>

        {matches.length > 0 && (
          <ul className="addr__list">
            {matches.map((l) => {
              const z = ZONES[l.zone]
              return (
                <li key={`${l.suburb}-${l.postcode}`}>
                  <button
                    type="button"
                    className="addr__opt"
                    onClick={() => onPick(l)}
                    data-cursor="explore"
                  >
                    <span className="addr__sub">
                      {l.suburb} <em>{l.postcode}</em>
                    </span>
                    <span className="addr__zone mono">
                      {z.distributor} · {z.state} · {z.regime}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </StepFrame>
  )
}
