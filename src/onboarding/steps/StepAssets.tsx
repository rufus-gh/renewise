import { StepFrame, Toggle } from '../ui'

interface Props {
  solarKw: number
  battery: boolean
  onSolar: (kw: number) => void
  onBattery: (v: boolean) => void
}

/**
 * Solar and battery can invert the entire ranking — export rates and
 * overnight shifting change which tariff wins, not just by how much.
 * Most comparators ignore this, which is exactly why it is asked here.
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
            <label htmlFor="kw" className="mono">
              System size
            </label>
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
              <output className="assets__v num">{solarKw.toFixed(1)} kW</output>
            </div>
            <p className="assets__note">
              About {Math.round(solarKw * 1350).toLocaleString('en-AU')} kWh a year
              generated. Roughly a third of it is used in the house; the rest is
              exported, and what that is worth depends entirely on the plan.
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
