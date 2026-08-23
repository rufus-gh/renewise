import { useRef, type ReactNode } from 'react'
import { gsap, EASE, shouldAnimate } from '../lib/gsap'
import { useGsap } from '../hooks/useGsap'

/** Entrance for a step: label, then heading lines, then the choices. */
export function StepFrame({
  index,
  label,
  heading,
  hint,
  children,
  wide,
}: {
  index: string
  label: string
  heading: ReactNode[]
  hint?: ReactNode
  children: ReactNode
  wide?: boolean
}) {
  const scope = useGsap<HTMLDivElement>((_ctx, el) => {
    const lines = el.querySelectorAll('.fq__h .js-line')
    const rest = el.querySelectorAll('.fq__stagger > *')
    if (!shouldAnimate()) {
      gsap.set([lines, rest, '.fq__label', '.fq__hint'], { opacity: 1, y: 0, yPercent: 0 })
      return
    }
    gsap.set(lines, { yPercent: 130 })
    gsap.set(rest, { opacity: 0, y: 18 })
    gsap
      .timeline()
      .fromTo('.fq__label', { opacity: 0 }, { opacity: 1, duration: 0.4, ease: EASE.ui })
      .to(lines, { yPercent: 0, duration: 0.85, ease: EASE.type, stagger: 0.07 }, 0.05)
      .fromTo(
        '.fq__hint',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, ease: EASE.ui },
        0.34,
      )
      .to(rest, { opacity: 1, y: 0, duration: 0.6, ease: EASE.ui, stagger: 0.055 }, 0.4)
  })

  return (
    <div ref={scope} className={`fq ${wide ? 'fq--wide' : ''}`}>
      <div className="fq__label mono">
        <span>{index}</span>
        <span>{label}</span>
      </div>
      <h2 className="fq__h display">
        {heading.map((h, i) => (
          <span className="line-mask" key={i}>
            <span className="js-line">{h}</span>
          </span>
        ))}
      </h2>
      {hint && <p className="fq__hint">{hint}</p>}
      <div className="fq__stagger">{children}</div>
    </div>
  )
}

/** A choice row. Deliberately large, deliberately few words. */
export function Choice({
  title,
  meta,
  note,
  selected,
  onSelect,
}: {
  title: ReactNode
  meta?: ReactNode
  note?: ReactNode
  selected?: boolean
  onSelect: () => void
}) {
  const el = useRef<HTMLButtonElement>(null)

  return (
    <button
      ref={el}
      type="button"
      className="choice"
      aria-pressed={selected}
      data-selected={selected || undefined}
      onClick={onSelect}
      data-cursor="explore"
    >
      <span className="choice__body">
        <span className="choice__title">{title}</span>
        {note && <span className="choice__note">{note}</span>}
      </span>
      {meta && <span className="choice__meta mono num">{meta}</span>}
      <span className="choice__tick" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="14" height="14">
          <path
            d="M2 8.5 6 12.5 14 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      </span>
    </button>
  )
}

/** Binary answer, rendered as a pair rather than a switch. */
export function Toggle({
  question,
  value,
  onChange,
  yes = 'Yes',
  no = 'No',
}: {
  question: ReactNode
  value: boolean | null
  onChange: (v: boolean) => void
  yes?: string
  no?: string
}) {
  return (
    <div className="tgl">
      <span className="tgl__q">{question}</span>
      <span className="tgl__opts">
        {[
          { v: true, l: yes },
          { v: false, l: no },
        ].map((o) => (
          <button
            key={o.l}
            type="button"
            className="tgl__b"
            data-on={value === o.v || undefined}
            aria-pressed={value === o.v}
            onClick={() => onChange(o.v)}
            data-cursor="explore"
          >
            {o.l}
          </button>
        ))}
      </span>
    </div>
  )
}

export function Chip({
  label,
  on,
  onToggle,
}: {
  label: string
  on: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      className="chip"
      data-on={on || undefined}
      aria-pressed={on}
      onClick={onToggle}
      data-cursor="explore"
    >
      {label}
    </button>
  )
}
