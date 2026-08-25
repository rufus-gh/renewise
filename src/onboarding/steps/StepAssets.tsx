import { StepFrame, Toggle } from '../ui'

interface Props {
  solarKw: number
  battery: boolean
  onSolar: (kw: number) => void
  onBattery: (v: boolean) => void
}

const SOLAR_PRESETS = [
  { label: '3.3 kW', kw: 3.3, sub: 'Small / Townhouse' },
  { label: '5.0 kW', kw: 5.0, sub: 'Single-phase' },
  { label: '6.6 kW', kw: 6.6, sub: 'Standard AU' },
  { label: '10.0 kW', kw: 10.0, sub: 'Large home' },
  { label: '13.3 kW', kw: 13.3, sub: 'Dual inverter' },
]

/**
 * Solar presets + fine tuning slider & battery toggle.
 */
export function StepAssets({ solarKw, battery, onSolar, onBattery }: Props) {
  const hasSolar = solarKw > 0

  return (
    <StepFrame
      index="04"
      label="What’s on the roof"
      heading={['Solar?', 'Battery?']}
      hint="These two answers change which plan wins, not just by how much. Feed-in rates and overnight windows can reverse the order completely."
    >
      <div className="assets">
        <Toggle
          question="Do you have solar panels?"
          value={hasSolar}
          onChange={(v) => onSolar(v ? 6.6 : 0)}
        />

        {hasSolar && (
          <div className="assets__size">
            <div className="assets__size-head">
              <label htmlFor="kw" className="mono">
                System size
              </label>
              <output className="assets__v num">{solarKw.toFixed(1)} kW</output>
            </div>

            <div className="assets__presets">
              {SOLAR_PRESETS.map((p) => {
                const isActive = Math.abs(solarKw - p.kw) < 0.1
                return (
                  <button
                    key={p.label}
                    type="button"
                    className={`assets__preset ${isActive ? 'is-active' : ''}`}
                    onClick={() => onSolar(p.kw)}
                    data-cursor="explore"
                  >
                    <span className="assets__preset-val">{p.label}</span>
                    <span className="assets__preset-sub mono">{p.sub}</span>
                  </button>
                )
              })}
            </div>

            <div className="assets__row">
              <input
                id="kw"
                type="range"
                min={1.5}
                max={20}
                step={0.1}
                value={solarKw}
                onChange={(e) => onSolar(Number(e.target.value))}
                className="slider"
              />
            </div>

            <p className="assets__note">
              About {Math.round(solarKw * 1350).toLocaleString('en-AU')} kWh a year
              generated. Roughly a third of it is used in the house; the rest is
              exported at your plan's feed-in tariff.
            </p>
          </div>
        )}

        <Toggle
          question={
            <>
              Do you have a home battery?
              <em> A battery moves evening use into the cheapest window.</em>
            </>
          }
          value={battery}
          onChange={onBattery}
        />
      </div>
    </StepFrame>
  )
}
