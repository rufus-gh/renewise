import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { gsap, EASE, shouldAnimate } from '../lib/gsap'
import { plansForZone, ZONES, type Locality } from '../data/market'
import {
  rank,
  type Archetype,
  type Priority,
  type Profile,
  type ValueTag,
} from '../data/engine'
import { Mark } from '../components/Preloader'
import { StepAddress } from './steps/StepAddress'
import { StepProvider } from './steps/StepProvider'
import { StepUsage } from './steps/StepUsage'
import { StepAssets } from './steps/StepAssets'
import { StepPriority } from './steps/StepPriority'
import { StepCalculating } from './steps/StepCalculating'
import { StepResults } from './steps/StepResults'
import { StepConsent } from './steps/StepConsent'
import { StepMode } from './steps/StepMode'
import { StepDashboard } from './steps/StepDashboard'

const QUESTION_STEPS = 5

interface State {
  locality: Locality | null
  retailerId: string | null
  years: number
  archetype: Archetype | null
  controlledLoad: boolean
  appliances: string[]
  aiPrompt: string
  solarKw: number
  battery: boolean
  priority: Priority | null
  values: ValueTag[]
  chosenPlanId: string | null
  mode: 'auto' | 'manual' | null
}

const INITIAL: State = {
  locality: null,
  retailerId: null,
  years: 3,
  archetype: null,
  controlledLoad: false,
  appliances: [],
  aiPrompt: '',
  solarKw: 0,
  battery: false,
  priority: null,
  values: [],
  chosenPlanId: null,
  mode: null,
}

interface Props {
  initialStep?: number
  initialState?: Partial<State>
  onExit: () => void
}

export function Onboarding({ initialStep = 0, initialState, onExit }: Props) {
  const [step, setStep] = useState(initialStep)
  const [s, setS] = useState<State>(() => ({
    ...INITIAL,
    ...(initialStep === 9
      ? {
          locality: { suburb: 'Surry Hills', postcode: '2010', zone: 'ausgrid' },
          retailerId: 'agl',
          years: 3,
          archetype: 'family',
          solarKw: 6.6,
          battery: false,
          mode: 'auto',
        }
      : {}),
    ...initialState,
  }))
  const stage = useRef<HTMLDivElement>(null)
  const root = useRef<HTMLDivElement>(null)

  const set = useCallback(<K extends keyof State>(k: K, v: State[K]) => {
    setS((prev) => ({ ...prev, [k]: v }))
  }, [])

  /**
   * Advance immediately, then animate the incoming step. Gating the state
   * change on an outgoing tween would strand the flow whenever the tab is
   * backgrounded, because rAF — and therefore GSAP — stops ticking.
   */
  const go = useCallback((next: number) => {
    const el = stage.current
    setStep(next)
    el?.scrollTo({ top: 0 })
    if (!el || !shouldAnimate()) return
    gsap.fromTo(
      el,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.34, ease: 'power2.out', overwrite: true },
    )
  }, [])

  /* Entry: a clip wipe from the bottom, matching the preloader's exit. */
  useEffect(() => {
    const el = root.current
    if (!el) return
    document.documentElement.style.overflow = 'hidden'

    // The wipe is decoration; the panel being visible is not. Skip it
    // when the tab is hidden (rAF is stopped, so an interrupted tween
    // would strand the overlay clipped) and always clear the property
    // afterwards so no inline clip can survive the animation.
    if (!shouldAnimate()) return () => {
      document.documentElement.style.overflow = ''
    }

    const tween = gsap.fromTo(
      el,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 0.9,
        ease: 'power4.inOut',
        onComplete: () => gsap.set(el, { clearProps: 'clipPath' }),
      },
    )

    return () => {
      tween.kill()
      gsap.set(el, { clearProps: 'clipPath' })
      document.documentElement.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onExit])

  const zone = s.locality?.zone ?? 'ausgrid'
  const pool = useMemo(() => plansForZone(zone), [zone])
  const extraApplianceKwh = useMemo(() => {
    let extra = s.appliances.length * 900
    if (s.aiPrompt) extra += 800
    return extra
  }, [s.appliances, s.aiPrompt])

  const profile: Profile = useMemo(
    () => ({
      zone,
      archetype: s.archetype ?? 'family',
      annualKwh: ZONES[zone].benchmark[s.archetype ?? 'family'] + extraApplianceKwh,
      solarKw: s.solarKw,
      battery: s.battery,
      controlledLoad: s.controlledLoad,
      priority: s.priority ?? 'price',
      values: s.values,
      currentRetailerId: s.retailerId,
      yearsWithRetailer: s.years,
    }),
    [zone, s.archetype, extraApplianceKwh, s.solarKw, s.battery, s.controlledLoad, s.priority, s.values, s.retailerId, s.years],
  )

  const ranking = useMemo(() => rank(profile, pool), [profile, pool])

  const chosen = useMemo(
    () =>
      ranking.quotes.find((q) => q.plan.id === s.chosenPlanId) ??
      ranking.options.find((o) => o.kind === 'recommended')?.quote ??
      ranking.quotes[0] ??
      null,
    [ranking, s.chosenPlanId],
  )

  const chosenOption = useMemo(
    () => ranking.options.find((o) => o.quote.plan.id === s.chosenPlanId) ?? null,
    [ranking, s.chosenPlanId],
  )

  const canContinue = (() => {
    switch (step) {
      case 0:
        return !!s.locality
      case 1:
        return !!s.retailerId
      case 2:
        return !!s.archetype
      case 3:
        return true
      case 4:
        return true
      default:
        return true
    }
  })()

  const showChrome = step <= 4

  return (
    <div ref={root} className="flow" role="dialog" aria-modal="true" aria-label="Find your plan">
      <header className="flow__head shell">
        <button
          type="button"
          className="flow__mark"
          onClick={onExit}
          aria-label="Renewise, close and return"
          data-cursor="explore"
        >
          <Mark size={14} />
          <span>Renewise</span>
        </button>

        <div className="flow__prog" aria-hidden="true">
          <span className="flow__prog-label mono">
            {step < QUESTION_STEPS ? `Step 0${step + 1} / 0${QUESTION_STEPS}` : 'Comparison'}
          </span>
          <div className="flow__bar">
            <span
              className="flow__barfill"
              style={{
                width: `${Math.min(((step + 1) / QUESTION_STEPS) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        <button
          type="button"
          className="flow__close mono"
          onClick={onExit}
          data-cursor="explore"
        >
          Close [Esc]
        </button>
      </header>

      <div ref={stage} className="flow__stage">
        <div className="flow__content shell">
          {step === 0 && (
            <StepAddress
              value={s.locality}
              onPick={(l) => {
                set('locality', l)
                window.setTimeout(() => go(1), 220)
              }}
            />
          )}

          {step === 1 && (
            <StepProvider
              value={s.retailerId}
              years={s.years}
              onPick={(id) => set('retailerId', id)}
              onYears={(y) => set('years', y)}
            />
          )}

          {step === 2 && (
            <StepUsage
              zone={zone}
              value={s.archetype}
              controlledLoad={s.controlledLoad}
              appliances={s.appliances}
              aiPrompt={s.aiPrompt}
              onPick={(a) => set('archetype', a)}
              onControlledLoad={(v) => set('controlledLoad', v)}
              onToggleAppliance={(id) =>
                setS((prev) => ({
                  ...prev,
                  appliances: prev.appliances.includes(id)
                    ? prev.appliances.filter((item) => item !== id)
                    : [...prev.appliances, id],
                }))
              }
              onAiPrompt={(prompt) => set('aiPrompt', prompt)}
            />
          )}

          {step === 3 && (
            <StepAssets
              solarKw={s.solarKw}
              battery={s.battery}
              onSolar={(kw) => set('solarKw', kw)}
              onBattery={(v) => set('battery', v)}
            />
          )}

          {step === 4 && (
            <StepPriority
              priority={s.priority}
              values={s.values}
              onPriority={(p) => set('priority', p)}
              onToggle={(t) =>
                setS((prev) => ({
                  ...prev,
                  values: prev.values.includes(t)
                    ? prev.values.filter((v) => v !== t)
                    : [...prev.values, t],
                }))
              }
            />
          )}

          {step === 5 && (
            <StepCalculating
              profile={profile}
              quotes={ranking.quotes}
              onDone={() => go(6)}
            />
          )}

          {step === 6 && (
            <StepResults
              ranking={ranking}
              onChoose={(id) => {
                set('chosenPlanId', id)
                go(7)
              }}
            />
          )}

          {step === 7 && chosen && (
            <StepConsent quote={chosen} onConfirm={() => go(8)} onBack={() => go(6)} />
          )}

          {step === 8 && chosen && (
            <StepMode
              quote={chosen}
              mode={s.mode}
              onMode={(m) => set('mode', m)}
              onFinish={() => go(9)}
            />
          )}

          {step === 9 && chosen && s.locality && (
            <StepDashboard
              quote={chosen}
              locality={s.locality}
              saving={chosenOption?.saving ?? ranking.current - chosen.guaranteed}
              mode={s.mode ?? 'auto'}
              onMode={(m) => set('mode', m)}
              onChange={(target) => go(target)}
              onExit={onExit}
            />
          )}
        </div>
      </div>

      {showChrome && (
        <div className="flow__foot shell">
          <button
            type="button"
            className="flow__back"
            onClick={() => (step === 0 ? onExit() : go(step - 1))}
            data-cursor="explore"
          >
            {step === 0 ? 'Leave' : 'Back'}
          </button>

          <button
            type="button"
            className="flow__next"
            disabled={!canContinue}
            onClick={() => go(step + 1)}
            data-cursor="open"
          >
            <span>{step === 4 ? 'Price the market' : 'Continue'}</span>
            <svg viewBox="0 0 20 10" width="22" height="11" aria-hidden="true">
              <path d="M0 5h18M14 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

/** Shared easing handle so step components can match the shell. */
export const FLOW_EASE = EASE
