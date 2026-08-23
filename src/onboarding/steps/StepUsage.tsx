import { ZONES, type ZoneId } from '../../data/market'
import type { Archetype } from '../../data/engine'
import { Choice, StepFrame, Toggle } from '../ui'

const OPTIONS: { id: Archetype; title: string; note: string }[] = [
  {
    id: 'lean',
    title: 'One or two people, out most days',
    note: 'Unit or small house, no pool, aircon used sparingly.',
  },
  {
    id: 'family',
    title: 'Family home, someone’s usually in',
    note: 'Three or more people, laundry most days, heating in winter.',
  },
  {
    id: 'heavy',
    title: 'Big household — pool, ducted air, or both',
    note: 'Four or more people, or a house that runs hot and cold all year.',
  },
]

interface Props {
  zone: ZoneId
  value: Archetype | null
  controlledLoad: boolean
  onPick: (a: Archetype) => void
  onControlledLoad: (v: boolean) => void
}

/**
 * Never labelled low / medium / high — nobody knows which one they are.
 * The kWh figure sits underneath as metadata and is drawn from the
 * benchmark for their own network, not a national average.
 */
export function StepUsage({ zone, value, controlledLoad, onPick, onControlledLoad }: Props) {
  const bench = ZONES[zone].benchmark

  return (
    <StepFrame
      index="03"
      label="How much you use"
      heading={['How busy is', 'the house?']}
      hint={`Benchmarks shown are for ${ZONES[zone].distributor}. Close is enough — you can correct it later, and a bill upload makes it exact.`}
    >
      <div className="usage">
        {OPTIONS.map((o) => (
          <Choice
            key={o.id}
            title={o.title}
            note={o.note}
            meta={`${bench[o.id].toLocaleString('en-AU')} kWh/yr`}
            selected={value === o.id}
            onSelect={() => onPick(o.id)}
          />
        ))}

        <div className="usage__extra">
          <Toggle
            question={
              <>
                Separate off-peak circuit for hot water or slab heating?
                <em> Often labelled “controlled load” on your bill.</em>
              </>
            }
            value={controlledLoad}
            onChange={onControlledLoad}
          />
        </div>
      </div>
    </StepFrame>
  )
}
