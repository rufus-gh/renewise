import type { Priority, ValueTag } from '../../data/engine'
import { Chip, Choice, StepFrame } from '../ui'

const TAGS: { id: ValueTag; label: string }[] = [
  { id: 'green', label: '100% GreenPower' },
  { id: 'nolockin', label: 'No lock-in, no exit fee' },
  { id: 'ausupport', label: 'Australian-based support' },
  { id: 'credit', label: 'Sign-up credit' },
  { id: 'vpp', label: 'Virtual power plant' },
  { id: 'ev', label: 'EV charging window' },
]

interface Props {
  priority: Priority | null
  values: ValueTag[]
  onPriority: (p: Priority) => void
  onToggle: (t: ValueTag) => void
}

/**
 * A weighting, not a filter — preferences reorder plans that are
 * already close on price rather than removing cheaper ones. Stored on
 * the profile and honoured at every future re-switch.
 */
export function StepPriority({ priority, values, onPriority, onToggle }: Props) {
  return (
    <StepFrame
      index="05"
      label="What matters"
      heading={['What are you', 'optimising for?']}
      hint="Answered once. We apply it again every time your plan comes up for renewal, without asking."
    >
      <div className="prio">
        <Choice
          title="Lowest total cost"
          note="Rank purely on what leaves your account over a year."
          selected={priority === 'price'}
          onSelect={() => onPriority('price')}
        />
        <Choice
          title="Price, plus a few things I care about"
          note="Still ranked on cost — these only break ties between close plans."
          selected={priority === 'value'}
          onSelect={() => onPriority('value')}
        />

        {priority === 'value' && (
          <div className="prio__chips">
            {TAGS.map((t) => (
              <Chip
                key={t.id}
                label={t.label}
                on={values.includes(t.id)}
                onToggle={() => onToggle(t.id)}
              />
            ))}
          </div>
        )}
      </div>
    </StepFrame>
  )
}
