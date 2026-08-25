import { useState } from 'react'
import { ZONES, type ZoneId } from '../../data/market'
import type { Archetype } from '../../data/engine'
import { Choice, StepFrame, Toggle } from '../ui'

const OPTIONS: { id: Archetype; title: string; note: string }[] = [
  {
    id: 'lean',
    title: 'One or two people, out most days',
    note: 'Unit or small house, moderate appliances.',
  },
  {
    id: 'family',
    title: 'Family home, someone’s usually in',
    note: 'Three or more people, daily laundry and daytime usage.',
  },
  {
    id: 'heavy',
    title: 'Large household, high daily power draw',
    note: 'Four or more people with continuous appliances running.',
  },
]

export interface ApplianceOption {
  id: string
  label: string
  kwh: number
  icon: string
  desc: string
}

export const APPLIANCE_OPTIONS: ApplianceOption[] = [
  { id: 'aircon', label: 'Ducted Air Conditioning / Heat Pump', kwh: 1200, icon: '❄️', desc: 'High seasonal peak usage' },
  { id: 'pool', label: 'Pool or Spa Pump', kwh: 1400, icon: '🏊', desc: '4–8 hrs daily filtration' },
  { id: 'ev', label: 'Electric Vehicle (Home Charging)', kwh: 2000, icon: '⚡', desc: 'Charges overnight / weekends' },
  { id: 'wfh', label: 'Work From Home (Full Time)', kwh: 600, icon: '💻', desc: 'Active daytime energy consumption' },
  { id: 'water', label: 'Electric Storage Hot Water', kwh: 1000, icon: '♨️', desc: 'Controlled or off-peak heating' },
  { id: 'cook', label: 'Induction / Electric Cooking', kwh: 400, icon: '🍳', desc: 'All-electric household' },
]

interface Props {
  zone: ZoneId
  value: Archetype | null
  controlledLoad: boolean
  appliances: string[]
  aiPrompt: string
  onPick: (a: Archetype) => void
  onControlledLoad: (v: boolean) => void
  onToggleAppliance: (id: string) => void
  onAiPrompt: (prompt: string) => void
}

/**
 * Step 3: Household size + Optional appliance requirements + Mockup AI Agent Prompt box.
 */
export function StepUsage({
  zone,
  value,
  controlledLoad,
  appliances,
  aiPrompt,
  onPick,
  onControlledLoad,
  onToggleAppliance,
  onAiPrompt,
}: Props) {
  const bench = ZONES[zone].benchmark
  const [showCustom, setShowCustom] = useState(appliances.length > 0 || !!aiPrompt)
  const [inputPrompt, setInputPrompt] = useState(aiPrompt)
  const [aiStatus, setAiStatus] = useState<'idle' | 'analyzing' | 'applied'>('idle')

  const handleApplyAi = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputPrompt.trim()) return
    setAiStatus('analyzing')
    setTimeout(() => {
      onAiPrompt(inputPrompt.trim())
      setAiStatus('applied')
    }, 600)
  }

  // Calculate extra kWh from ticked appliances
  const extraKwh = appliances.reduce((sum, id) => {
    const item = APPLIANCE_OPTIONS.find((a) => a.id === id)
    return sum + (item?.kwh ?? 0)
  }, 0)

  return (
    <StepFrame
      index="03"
      label="How much you use"
      heading={['How busy is', 'the house?']}
      hint={`Benchmarks shown are for ${ZONES[zone].distributor}. Customise appliances below for exact time-of-use calculations.`}
    >
      <div className="usage">
        <div className="usage__choices">
          {OPTIONS.map((o) => (
            <Choice
              key={o.id}
              title={o.title}
              note={o.note}
              meta={`${(bench[o.id] + extraKwh).toLocaleString('en-AU')} kWh/yr`}
              selected={value === o.id}
              onSelect={() => onPick(o.id)}
            />
          ))}
        </div>

        {/* Optional Custom Energy Usage Requirements */}
        <div className="usage__custom-sec">
          <button
            type="button"
            className="usage__custom-toggle mono"
            onClick={() => setShowCustom((v) => !v)}
            data-cursor="explore"
          >
            <span>{showCustom ? '– Hide extra requirements' : '+ Customise specific appliances & lifestyle'}</span>
            {appliances.length > 0 && (
              <span className="usage__badge">+{extraKwh.toLocaleString()} kWh ({appliances.length} items)</span>
            )}
          </button>

          {showCustom && (
            <div className="usage__custom-panel">
              <p className="usage__custom-sub">
                Select your major energy draws to match the optimal time-of-use windows:
              </p>

              <div className="usage__app-grid">
                {APPLIANCE_OPTIONS.map((app) => {
                  const isChecked = appliances.includes(app.id)
                  return (
                    <button
                      key={app.id}
                      type="button"
                      className={`usage__app-card ${isChecked ? 'is-selected' : ''}`}
                      onClick={() => onToggleAppliance(app.id)}
                    >
                      <div className="usage__app-head">
                        <span className="usage__app-icon">{app.icon}</span>
                        <span className={`usage__app-check ${isChecked ? 'is-on' : ''}`} />
                      </div>
                      <span className="usage__app-title">{app.label}</span>
                      <span className="usage__app-desc">{app.desc}</span>
                      <span className="usage__app-kwh mono">+{app.kwh} kWh/yr</span>
                    </button>
                  )
                })}
              </div>

              {/* AI Agent Custom Box (Mockup) */}
              <div className="usage__ai-box">
                <div className="usage__ai-head">
                  <span className="usage__ai-icon">✨</span>
                  <div>
                    <h4 className="usage__ai-title">Renewise AI Custom Load Agent</h4>
                    <p className="usage__ai-desc">
                      Type any custom schedule or equipment — our AI agent maps it directly to the lowest rate tariff.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleApplyAi} className="usage__ai-form">
                  <input
                    type="text"
                    className="usage__ai-input"
                    placeholder="e.g. 'I run pottery kilns on weekends and charge 2 EVs overnight after 10pm'"
                    value={inputPrompt}
                    onChange={(e) => {
                      setInputPrompt(e.target.value)
                      if (aiStatus === 'applied') setAiStatus('idle')
                    }}
                  />
                  <button
                    type="submit"
                    className="usage__ai-btn mono"
                    disabled={aiStatus === 'analyzing'}
                  >
                    {aiStatus === 'analyzing'
                      ? 'Analyzing...'
                      : aiStatus === 'applied'
                        ? '✓ Profile Applied'
                        : 'Optimize with AI'}
                  </button>
                </form>

                {aiStatus === 'applied' && (
                  <div className="usage__ai-status mono">
                    ⚡ AI Optimization: Mapped custom load constraints (+800 kWh shifted to off-peak tariff window).
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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
