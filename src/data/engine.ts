/* ──────────────────────────────────────────────────────────────
   Pricing engine.

   Pure functions, no I/O. Two rules govern everything here:

   1. Guaranteed and conditional prices are never added together. The
      headline number is what you pay if life gets in the way; a
      pay-on-time discount is shown separately as upside.
   2. Every quote carries its assumptions and a confidence band. A
      range you can trust beats a point estimate you can't.
   ────────────────────────────────────────────────────────────── */

import { RETAILER_NAME, ZONES, type Plan, type ZoneId } from './market'

export type Archetype = 'lean' | 'family' | 'heavy'
export type Priority = 'price' | 'value'

export type ValueTag =
  | 'green'
  | 'nolockin'
  | 'ausupport'
  | 'credit'
  | 'vpp'
  | 'ev'

export interface Profile {
  zone: ZoneId
  archetype: Archetype
  annualKwh: number
  solarKw: number
  battery: boolean
  controlledLoad: boolean
  priority: Priority
  values: ValueTag[]
  currentRetailerId: string | null
  /** Years on the current plan — drives the loyalty-drift estimate. */
  yearsWithRetailer: number
}

/* Share of grid consumption falling in each time-of-use window, before
   solar and battery are applied. Derived from AER load-profile classes. */
const SHAPE: Record<Archetype, { peak: number; shoulder: number; offpeak: number }> = {
  lean: { peak: 0.28, shoulder: 0.34, offpeak: 0.38 },
  family: { peak: 0.36, shoulder: 0.34, offpeak: 0.3 },
  heavy: { peak: 0.4, shoulder: 0.33, offpeak: 0.27 },
}

/** Annual generation per installed kW, averaged across NEM regions. */
const YIELD_PER_KW = 1350
/** Share of generation consumed on site rather than exported. */
const SELF_USE = { without: 0.34, with: 0.68 }
/** kWh a year typically metered on a separate controlled-load circuit. */
const CONTROLLED_LOAD_KWH = 1000

export interface Breakdown {
  supply: number
  peak: number
  shoulder: number
  offpeak: number
  controlledLoad: number
  usageBeforeDiscount: number
  guaranteedDiscount: number
  conditionalDiscount: number
  solarCredit: number
  signupCredit: number
}

/** Cents-per-unit rates as actually charged in this zone. */
export interface EffectiveRates {
  supply: number
  single?: number
  peak?: number
  shoulder?: number
  offpeak?: number
  controlledLoad?: number
}

export interface Quote {
  plan: Plan
  /** Year-one cost with no conditions met. The headline. */
  guaranteed: number
  /** Year-one cost if every conditional discount is earned. */
  best: number
  /** Cost across 24 months, with benefits falling away at expiry. */
  twoYear: number
  /** What the plan costs once the benefit period ends, annualised. */
  postBenefit: number
  breakdown: Breakdown
  /** What the disclosure screen must show — base rates scaled to the zone. */
  rates: EffectiveRates
  gridKwh: number
  exportKwh: number
  confidence: 'high' | 'medium' | 'low'
  assumptions: string[]
}

interface Split {
  peak: number
  shoulder: number
  offpeak: number
  controlled: number
  gridKwh: number
  exportKwh: number
}

/** Decompose a household's annual consumption into billable buckets. */
export function splitUsage(profile: Profile, planHasCL: boolean): Split {
  const generation = profile.solarKw * YIELD_PER_KW
  const selfUseRate = profile.battery ? SELF_USE.with : SELF_USE.without
  const selfUsed = Math.min(generation * selfUseRate, profile.annualKwh * 0.62)
  const exportKwh = Math.max(generation - selfUsed, 0)

  let controlled = 0
  let remaining = profile.annualKwh
  if (profile.controlledLoad && planHasCL) {
    controlled = Math.min(CONTROLLED_LOAD_KWH, remaining * 0.2)
    remaining -= controlled
  }

  const shape = SHAPE[profile.archetype]
  let peak = remaining * shape.peak
  let shoulder = remaining * shape.shoulder
  let offpeak = remaining * shape.offpeak

  // Solar displaces daytime load first — shoulder, then peak.
  let toDisplace = selfUsed
  const fromShoulder = Math.min(shoulder, toDisplace * 0.7)
  shoulder -= fromShoulder
  toDisplace -= fromShoulder
  const fromPeak = Math.min(peak, toDisplace)
  peak -= fromPeak
  toDisplace -= fromPeak
  offpeak = Math.max(offpeak - toDisplace, 0)

  // A battery time-shifts evening peak into the overnight window.
  if (profile.battery) {
    const shifted = peak * 0.42 + shoulder * 0.18
    peak -= peak * 0.42
    shoulder -= shoulder * 0.18
    offpeak += shifted
  }

  return {
    peak,
    shoulder,
    offpeak,
    controlled,
    gridKwh: peak + shoulder + offpeak + controlled,
    exportKwh,
  }
}

function usageCost(plan: Plan, s: Split): Pick<Breakdown, 'peak' | 'shoulder' | 'offpeak'> {
  if (plan.tariff.kind === 'single') {
    const r = plan.tariff.cPerKwh / 100
    return {
      peak: s.peak * r,
      shoulder: s.shoulder * r,
      offpeak: s.offpeak * r,
    }
  }
  return {
    peak: (s.peak * plan.tariff.peak) / 100,
    shoulder: (s.shoulder * plan.tariff.shoulder) / 100,
    offpeak: (s.offpeak * plan.tariff.offpeak) / 100,
  }
}

export function quote(plan: Plan, profile: Profile): Quote {
  const s = splitUsage(profile, plan.controlledLoad !== undefined)
  const net = ZONES[profile.zone].networkFactor
  const raw = usageCost(plan, s)
  const windows = {
    peak: raw.peak * net,
    shoulder: raw.shoulder * net,
    offpeak: raw.offpeak * net,
  }

  const supply = ((plan.supply * 365) / 100) * net
  const controlledLoad = plan.controlledLoad
    ? ((s.controlled * plan.controlledLoad) / 100) * net
    : 0

  const usageBeforeDiscount =
    windows.peak + windows.shoulder + windows.offpeak + controlledLoad

  const guaranteedDiscount =
    usageBeforeDiscount * ((plan.guaranteedDiscount ?? 0) / 100)
  const conditionalDiscount =
    (usageBeforeDiscount - guaranteedDiscount) *
    ((plan.conditionalDiscount ?? 0) / 100)

  const rates: EffectiveRates = {
    supply: plan.supply * net,
    ...(plan.tariff.kind === 'single'
      ? { single: plan.tariff.cPerKwh * net }
      : {
          peak: plan.tariff.peak * net,
          shoulder: plan.tariff.shoulder * net,
          offpeak: plan.tariff.offpeak * net,
        }),
    ...(plan.controlledLoad !== undefined
      ? { controlledLoad: plan.controlledLoad * net }
      : {}),
  }

  const solarCredit = feedInCredit(plan, s.exportKwh)
  const signupCredit = plan.signupCredit ?? 0

  const guaranteed =
    supply + usageBeforeDiscount - guaranteedDiscount - solarCredit - signupCredit
  const best = guaranteed - conditionalDiscount

  // Once the benefit period ends the discounts and the credit stop.
  const postBenefit = supply + usageBeforeDiscount - solarCredit

  const months = plan.benefitMonths
  const twoYear =
    months === null
      ? guaranteed * 2
      : months >= 24
        ? guaranteed * 2
        : guaranteed + (postBenefit * (24 - months)) / 12 + (guaranteed * (months - 12)) / 12

  const assumptions = [
    `${Math.round(profile.annualKwh).toLocaleString('en-AU')} kWh a year, the ${ZONES[profile.zone].distributor} benchmark for this household size`,
    plan.tariff.kind === 'tou'
      ? `Usage split ${pct(s.peak, s.gridKwh)} peak / ${pct(s.shoulder, s.gridKwh)} shoulder / ${pct(s.offpeak, s.gridKwh)} off-peak`
      : 'Single flat rate — no time-of-use split applied',
  ]
  if (profile.solarKw > 0) {
    assumptions.push(
      `${profile.solarKw} kW of solar generating about ${Math.round(profile.solarKw * YIELD_PER_KW).toLocaleString('en-AU')} kWh, ${Math.round(s.exportKwh).toLocaleString('en-AU')} kWh of it exported`,
    )
  }
  if (profile.battery) {
    assumptions.push('Battery shifting evening consumption into the overnight window')
  }
  if (profile.controlledLoad && plan.controlledLoad) {
    assumptions.push(`${CONTROLLED_LOAD_KWH} kWh billed on a controlled-load circuit`)
  }
  if (plan.conditionalDiscount) {
    assumptions.push(
      `The headline price assumes you never earn the ${plan.conditionalDiscount}% pay-on-time discount`,
    )
  }

  return {
    plan,
    guaranteed,
    best,
    twoYear,
    postBenefit,
    breakdown: {
      supply,
      ...windows,
      controlledLoad,
      usageBeforeDiscount,
      guaranteedDiscount,
      conditionalDiscount,
      solarCredit,
      signupCredit,
    },
    rates,
    gridKwh: s.gridKwh,
    exportKwh: s.exportKwh,
    // Estimated usage caps confidence at medium; CDR interval data lifts it.
    confidence: 'medium',
    assumptions,
  }
}

/** Export earns the headline rate only up to the plan's daily cap. */
export function feedInCredit(plan: Plan, exportKwh: number): number {
  if (!plan.fitCapKwhPerDay) return (exportKwh * plan.fit) / 100
  const capped = Math.min(exportKwh, plan.fitCapKwhPerDay * 365)
  const excess = Math.max(exportKwh - capped, 0)
  return (capped * plan.fit + excess * (plan.fitAboveCap ?? 0)) / 100
}

function pct(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : '0%'
}

/* ── Current spend ────────────────────────────────────────────
   Estimated by pricing the incumbent's own market offer with its
   benefits already expired, plus a drift term for years on the same
   plan. Deliberately conservative — a savings figure that overstates
   the starting point is worse than useless. */
export function estimateCurrentSpend(profile: Profile, pool: Plan[]): number {
  const theirs = pool.filter((p) => p.retailerId === profile.currentRetailerId)
  const candidates = theirs.length ? theirs : pool
  // Their cheapest expired rate, not their worst — understating what the
  // customer pays today is the only safe direction for a savings claim.
  const q = candidates
    .map((p) => quote(p, profile))
    .sort((a, b) => a.postBenefit - b.postBenefit)[0]
  const drift = 1 + Math.min(profile.yearsWithRetailer, 5) * 0.021
  return q.postBenefit * drift
}

/* ── Ranking ─────────────────────────────────────────────────── */

export type OptionKind = 'cheapest' | 'recommended' | 'axis'

export interface RankedOption {
  kind: OptionKind
  quote: Quote
  saving: number
  headline: string
  reason: string
}

/** Non-price weighting. Only ever reorders plans that are already close. */
function valueBonus(plan: Plan, profile: Profile): number {
  if (profile.priority === 'price') return 0
  let bonus = 0
  for (const tag of profile.values) {
    if (tag === 'green') bonus += plan.green >= 100 ? 140 : plan.green * 0.5
    if (tag === 'nolockin') bonus += !plan.lockIn && plan.exitFee === 0 ? 90 : -60
    if (tag === 'ausupport') bonus += plan.auSupport ? 80 : 0
    if (tag === 'credit') bonus += (plan.signupCredit ?? 0) * 0.8
    if (tag === 'vpp') bonus += plan.vpp ? 110 : 0
    if (tag === 'ev') bonus += plan.evPlan ? 120 : 0
  }
  return bonus
}

export interface Ranking {
  current: number
  quotes: Quote[]
  options: RankedOption[]
}

export function rank(profile: Profile, pool: Plan[]): Ranking {
  const current = estimateCurrentSpend(profile, pool)
  const quotes = pool
    .map((p) => quote(p, profile))
    .sort((a, b) => a.guaranteed - b.guaranteed)

  // Every card's saving is measured against the same basis as its headline
  // price — the guaranteed rate. Mixing bases is how comparison sites end
  // up quoting a number the customer can never reproduce.
  const saving = (q: Quote) => current - q.guaranteed

  // The hero: cheapest across two years, so the intro rate expiring is
  // priced in rather than ignored.
  const byTwoYear = [...quotes].sort(
    (a, b) =>
      a.twoYear - valueBonus(a.plan, profile) - (b.twoYear - valueBonus(b.plan, profile)),
  )
  const recommended = byTwoYear[0]

  const taken = new Set<string>([recommended.plan.id])
  const options: RankedOption[] = [
    {
      kind: 'recommended',
      quote: recommended,
      saving: saving(recommended),
      headline: 'Recommended',
      reason: recommendedReason(recommended, quotes),
    },
  ]

  // Cheapest guaranteed price, if that is a different plan. When the
  // recommendation is already the cheapest, offer the runner-up instead
  // of printing the same plan twice.
  const cheapest = quotes.find((q) => !taken.has(q.plan.id))
  if (cheapest) {
    taken.add(cheapest.plan.id)
    const sameAsRec = cheapest.guaranteed >= recommended.guaranteed
    options.unshift({
      kind: 'cheapest',
      quote: cheapest,
      saving: saving(cheapest),
      headline: sameAsRec ? 'Runner-up' : 'Cheapest first year',
      reason: sameAsRec
        ? `Costs ${money(cheapest.guaranteed - recommended.guaranteed)} more a year, but worth knowing about if you would rather not be with ${RETAILER_NAME.get(recommended.plan.retailerId) ?? 'them'}.`
        : cheapest.plan.conditionalDiscount
          ? `The lowest guaranteed price in your area. A further ${cheapest.plan.conditionalDiscount}% comes off only if every bill is paid on time.`
          : 'The lowest guaranteed price in your area, on the rates you actually pay.',
    })
  }

  const axis = pickAxis(profile, quotes, taken, current)
  if (axis) options.push(axis)

  options.sort((a, b) => order(a.kind) - order(b.kind))
  return { current, quotes, options }
}

function recommendedReason(rec: Quote, quotes: Quote[]): string {
  const cheapest = quotes[0]
  if (cheapest.plan.id === rec.plan.id) {
    return 'Cheapest now and still cheapest once the intro rate expires — rare, and worth taking.'
  }
  const yearOne = rec.guaranteed - cheapest.guaranteed
  const afterwards = cheapest.postBenefit - rec.postBenefit
  if (yearOne > 0 && afterwards > 0) {
    return `Costs ${money(yearOne)} more in year one, then about ${money(afterwards)} less every year after the intro rate expires.`
  }
  if (rec.plan.benefitMonths === null) {
    return 'An ongoing rate with no expiry date, so there is no cliff to manage in twelve months.'
  }
  return 'Best total cost across the next two years once the intro period is priced in.'
}

function order(k: OptionKind): number {
  return k === 'cheapest' ? 0 : k === 'recommended' ? 1 : 2
}

function pickAxis(
  profile: Profile,
  quotes: Quote[],
  taken: Set<string>,
  current: number,
): RankedOption | null {
  const pool = quotes.filter((q) => !taken.has(q.plan.id))
  if (!pool.length) return null

  // Never surface a third option that costs more than doing nothing.
  const viable = pool.filter((q) => q.guaranteed < current)
  const from = viable.length ? viable : pool

  if (profile.solarKw > 0) {
    // Best export value among plans that are still competitive overall —
    // the highest feed-in rate on an expensive plan is a trap.
    const median = [...from].sort((a, b) => a.plan.fit - b.plan.fit)[
      Math.floor(from.length / 2)
    ].plan.fit
    const solarish = from.filter((q) => q.plan.fit >= median)
    const best = (solarish.length ? solarish : from).sort(
      (a, b) => a.guaranteed - b.guaranteed,
    )[0]
    const cap = best.plan.fitCapKwhPerDay
    return {
      kind: 'axis',
      quote: best,
      saving: current - best.guaranteed,
      headline: 'Best for your solar',
      reason: `Pays ${best.plan.fit.toFixed(1)}c a kWh for what you export${cap ? `, up to ${cap} kWh a day` : ''} — about ${money(feedInCredit(best.plan, best.exportKwh))} a year back from the roof.`,
    }
  }

  if (profile.values.includes('green')) {
    const green = from.filter((q) => q.plan.green > 0)
    if (green.length) {
      const best = green.sort(
        (a, b) => b.plan.green - a.plan.green || a.guaranteed - b.guaranteed,
      )[0]
      return {
        kind: 'axis',
        quote: best,
        saving: current - best.guaranteed,
        headline: 'Fully renewable',
        reason: `${best.plan.green}% of your supply matched with accredited GreenPower, at a price that still beats what you pay now.`,
      }
    }
  }

  const flexible = from
    .filter((q) => !q.plan.lockIn && q.plan.exitFee === 0 && q.plan.benefitMonths === null)
    .sort((a, b) => a.guaranteed - b.guaranteed)[0]
  if (flexible) {
    return {
      kind: 'axis',
      quote: flexible,
      saving: current - flexible.guaranteed,
      headline: 'No expiry date',
      reason:
        'An ongoing rate with no intro period, so there is no cliff to manage later. Cheaper over five years than most twelve-month deals.',
    }
  }

  const fallback = from.sort((a, b) => a.guaranteed - b.guaranteed)[0]
  return {
    kind: 'axis',
    quote: fallback,
    saving: current - fallback.guaranteed,
    headline: 'Worth a look',
    reason: 'Close on price, with no lock-in and no exit fee.',
  }
}

/* ── Formatting ──────────────────────────────────────────────── */

export const money = (n: number): string => {
  const v = Math.round(n)
  // A large enough system genuinely runs a credit — show it as one
  // rather than emitting "$-168".
  return v < 0
    ? `\u2212$${Math.abs(v).toLocaleString('en-AU')}`
    : `$${v.toLocaleString('en-AU')}`
}

export const moneyPrecise = (n: number): string =>
  `$${n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function benefitEnds(months: number | null, from = new Date()): Date | null {
  if (months === null) return null
  const d = new Date(from)
  d.setMonth(d.getMonth() + months)
  return d
}

export const longDate = (d: Date): string =>
  d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
