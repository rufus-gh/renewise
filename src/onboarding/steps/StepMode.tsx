import { benefitEnds, longDate, money, type Quote } from '../../data/engine'
import { MagneticButton } from '../../components/MagneticButton'
import { StepFrame } from '../ui'

interface Props {
  quote: Quote
  mode: 'auto' | 'manual' | null
  onMode: (m: 'auto' | 'manual') => void
  onFinish: () => void
}

/**
 * The mode question, asked at the only moment it makes sense: right
 * after they've seen their own expiry date.
 *
 * Both modes end in a tap. Australian law requires explicit informed
 * consent for each transfer, so there is no lawful zero-touch switch —
 * saying so plainly is more credible than the alternative, and it makes
 * the auto-pilot promise something we can actually keep.
 */
export function StepMode({ quote, mode, onMode, onFinish }: Props) {
  const ends = benefitEnds(quote.plan.benefitMonths)
  const uplift = quote.postBenefit - quote.guaranteed

  return (
    <StepFrame
      index="08"
      label="What happens next year"
      heading={
        ends
          ? ['Your rate', 'expires', longDate(ends) + '.']
          : ['Your rate', 'has no', 'expiry date.']
      }
      hint={
        ends
          ? `On that day this plan gets about ${money(uplift)} a year more expensive, unless somebody moves you. Choose who that somebody is.`
          : 'Nothing to defuse on this one — but the market still moves, so we keep checking every quarter.'
      }
      wide
    >
      <div className="mode">
        <button
          type="button"
          className="mode__card"
          data-on={mode === 'auto' || undefined}
          aria-pressed={mode === 'auto'}
          onClick={() => onMode('auto')}
          data-cursor="explore"
        >
          <span className="mode__tag mono">Auto-pilot</span>
          <span className="mode__t display">We handle it</span>
          <ul className="mode__steps">
            <li>
              <b>30 days out</b> we re-price the whole market on your usage and
              pick the best plan for you.
            </li>
            <li>
              <b>Straight away</b> you get told what we chose, what it saves, and
              what happens if you do nothing.
            </li>
            <li>
              <b>Seven days out</b> one tap confirms it. Reminders at three days
              and one day.
            </li>
          </ul>
          <span className="mode__law">
            Why a tap? No third party can transfer you without your explicit
            consent for that specific plan. We do everything else.
          </span>
        </button>

        <button
          type="button"
          className="mode__card"
          data-on={mode === 'manual' || undefined}
          aria-pressed={mode === 'manual'}
          onClick={() => onMode('manual')}
          data-cursor="explore"
        >
          <span className="mode__tag mono">Manual</span>
          <span className="mode__t display">You decide</span>
          <ul className="mode__steps">
            <li>
              <b>30 days out</b> we shortlist two or three plans and show you why
              each one made the cut.
            </li>
            <li>
              <b>You choose</b> which one, or none — and we hold the shortlist
              until you do.
            </li>
            <li>
              <b>Or set your own date</b> if you would rather be asked earlier, or
              only once a year.
            </li>
          </ul>
          <span className="mode__law">
            Same monitoring, same market, same figures. The only difference is who
            makes the first move.
          </span>
        </button>
      </div>

      <div className="mode__go">
        <MagneticButton disabled={!mode} onClick={onFinish} pull={10} cursor="open">
          {mode === 'manual' ? 'Save and continue' : 'Turn on auto-pilot'}
        </MagneticButton>
        <span className="mono">Change this whenever you like</span>
      </div>
    </StepFrame>
  )
}
