/* ──────────────────────────────────────────────────────────────
   Market reference data.

   In production this table is populated nightly from the AER's open
   CDR Product Reference Data endpoints
   (https://cdr.energymadeeasy.gov.au/{cdrCode}/cds-au/v1/energy/plans),
   which publish every authorised retailer's tariffs without auth.
   What ships here is a representative snapshot in that same shape, so
   the pricing engine below is the real one and swapping the source is
   an ingest change, not an engine change.
   ────────────────────────────────────────────────────────────── */

export type ZoneId =
  | 'ausgrid'
  | 'endeavour'
  | 'essential'
  | 'energex'
  | 'ergon'
  | 'sapn'
  | 'citipower'
  | 'powercor'
  | 'united'
  | 'jemena'
  | 'ausnet'
  | 'evoenergy'
  | 'tasnetworks'

export type StateId = 'NSW' | 'QLD' | 'SA' | 'VIC' | 'ACT' | 'TAS'

export interface Zone {
  id: ZoneId
  distributor: string
  state: StateId
  /** Annual kWh benchmarks by household archetype for this zone. */
  benchmark: { lean: number; family: number; heavy: number }
  /** DMO / VDO annual reference price, flat-rate residential, no controlled load. */
  referencePrice: number
  /**
   * Network costs are roughly half a bill and vary enormously between
   * distribution zones. Retailer tariffs are published per zone; this
   * factor scales the snapshot's base rates so a mid-market plan lands
   * near the published reference price for the zone.
   */
  networkFactor: number
  /** Regime the zone sits under — Victoria is a separate rulebook. */
  regime: 'DMO' | 'VDO'
}

export const ZONES: Record<ZoneId, Zone> = {
  ausgrid: {
    id: 'ausgrid',
    distributor: 'Ausgrid',
    state: 'NSW',
    benchmark: { lean: 2800, family: 4600, heavy: 8200 },
    referencePrice: 1948,
    regime: 'DMO',
    networkFactor: 1.02,
  },
  endeavour: {
    id: 'endeavour',
    distributor: 'Endeavour Energy',
    state: 'NSW',
    benchmark: { lean: 3200, family: 5400, heavy: 9200 },
    referencePrice: 2274,
    regime: 'DMO',
    networkFactor: 1.06,
  },
  essential: {
    id: 'essential',
    distributor: 'Essential Energy',
    state: 'NSW',
    benchmark: { lean: 3600, family: 5800, heavy: 9800 },
    referencePrice: 2611,
    regime: 'DMO',
    networkFactor: 1.13,
  },
  energex: {
    id: 'energex',
    distributor: 'Energex',
    state: 'QLD',
    benchmark: { lean: 3400, family: 5600, heavy: 9600 },
    referencePrice: 1972,
    regime: 'DMO',
    networkFactor: 0.88,
  },
  ergon: {
    id: 'ergon',
    distributor: 'Ergon Energy',
    state: 'QLD',
    benchmark: { lean: 3800, family: 6200, heavy: 10500 },
    referencePrice: 2145,
    regime: 'DMO',
    networkFactor: 0.87,
  },
  sapn: {
    id: 'sapn',
    distributor: 'SA Power Networks',
    state: 'SA',
    benchmark: { lean: 3000, family: 4800, heavy: 8400 },
    referencePrice: 2299,
    regime: 'DMO',
    networkFactor: 1.17,
  },
  citipower: {
    id: 'citipower',
    distributor: 'CitiPower',
    state: 'VIC',
    benchmark: { lean: 2600, family: 4000, heavy: 7200 },
    referencePrice: 1523,
    regime: 'VDO',
    networkFactor: 0.89,
  },
  powercor: {
    id: 'powercor',
    distributor: 'Powercor',
    state: 'VIC',
    benchmark: { lean: 3000, family: 4600, heavy: 8000 },
    referencePrice: 1690,
    regime: 'VDO',
    networkFactor: 0.88,
  },
  united: {
    id: 'united',
    distributor: 'United Energy',
    state: 'VIC',
    benchmark: { lean: 2800, family: 4300, heavy: 7600 },
    referencePrice: 1604,
    regime: 'VDO',
    networkFactor: 0.88,
  },
  jemena: {
    id: 'jemena',
    distributor: 'Jemena',
    state: 'VIC',
    benchmark: { lean: 2700, family: 4200, heavy: 7400 },
    referencePrice: 1571,
    regime: 'VDO',
    networkFactor: 0.89,
  },
  ausnet: {
    id: 'ausnet',
    distributor: 'AusNet Services',
    state: 'VIC',
    benchmark: { lean: 3200, family: 5000, heavy: 8600 },
    referencePrice: 1836,
    regime: 'VDO',
    networkFactor: 0.9,
  },
  evoenergy: {
    id: 'evoenergy',
    distributor: 'Evoenergy',
    state: 'ACT',
    benchmark: { lean: 3400, family: 5400, heavy: 9000 },
    referencePrice: 1841,
    regime: 'DMO',
    networkFactor: 0.84,
  },
  tasnetworks: {
    id: 'tasnetworks',
    distributor: 'TasNetworks',
    state: 'TAS',
    benchmark: { lean: 4200, family: 6800, heavy: 11000 },
    referencePrice: 2402,
    regime: 'DMO',
    networkFactor: 0.91,
  },
}

/* ── Address seed ─────────────────────────────────────────────
   Suburb → postcode → distribution zone. The zone is the field that
   decides which plans legally exist for a household, so it is
   resolved at the very first question. */

export interface Locality {
  suburb: string
  postcode: string
  zone: ZoneId
}

export const LOCALITIES: Locality[] = [
  { suburb: 'Surry Hills', postcode: '2010', zone: 'ausgrid' },
  { suburb: 'Newtown', postcode: '2042', zone: 'ausgrid' },
  { suburb: 'Manly', postcode: '2095', zone: 'ausgrid' },
  { suburb: 'Chatswood', postcode: '2067', zone: 'ausgrid' },
  { suburb: 'Bondi Junction', postcode: '2022', zone: 'ausgrid' },
  { suburb: 'Marrickville', postcode: '2204', zone: 'ausgrid' },
  { suburb: 'Newcastle', postcode: '2300', zone: 'ausgrid' },
  { suburb: 'Parramatta', postcode: '2150', zone: 'endeavour' },
  { suburb: 'Penrith', postcode: '2750', zone: 'endeavour' },
  { suburb: 'Liverpool', postcode: '2170', zone: 'endeavour' },
  { suburb: 'Campbelltown', postcode: '2560', zone: 'endeavour' },
  { suburb: 'Wollongong', postcode: '2500', zone: 'endeavour' },
  { suburb: 'Bathurst', postcode: '2795', zone: 'essential' },
  { suburb: 'Coffs Harbour', postcode: '2450', zone: 'essential' },
  { suburb: 'Wagga Wagga', postcode: '2650', zone: 'essential' },
  { suburb: 'Byron Bay', postcode: '2481', zone: 'essential' },
  { suburb: 'Dubbo', postcode: '2830', zone: 'essential' },
  { suburb: 'Brisbane City', postcode: '4000', zone: 'energex' },
  { suburb: 'West End', postcode: '4101', zone: 'energex' },
  { suburb: 'Chermside', postcode: '4032', zone: 'energex' },
  { suburb: 'Southport', postcode: '4215', zone: 'energex' },
  { suburb: 'Toowoomba', postcode: '4350', zone: 'energex' },
  { suburb: 'Cairns', postcode: '4870', zone: 'ergon' },
  { suburb: 'Townsville', postcode: '4810', zone: 'ergon' },
  { suburb: 'Rockhampton', postcode: '4700', zone: 'ergon' },
  { suburb: 'Mackay', postcode: '4740', zone: 'ergon' },
  { suburb: 'Adelaide', postcode: '5000', zone: 'sapn' },
  { suburb: 'Glenelg', postcode: '5045', zone: 'sapn' },
  { suburb: 'Norwood', postcode: '5067', zone: 'sapn' },
  { suburb: 'Mount Barker', postcode: '5251', zone: 'sapn' },
  { suburb: 'Port Lincoln', postcode: '5606', zone: 'sapn' },
  { suburb: 'Melbourne', postcode: '3000', zone: 'citipower' },
  { suburb: 'Carlton', postcode: '3053', zone: 'citipower' },
  { suburb: 'South Yarra', postcode: '3141', zone: 'citipower' },
  { suburb: 'Docklands', postcode: '3008', zone: 'citipower' },
  { suburb: 'Geelong', postcode: '3220', zone: 'powercor' },
  { suburb: 'Ballarat', postcode: '3350', zone: 'powercor' },
  { suburb: 'Werribee', postcode: '3030', zone: 'powercor' },
  { suburb: 'Footscray', postcode: '3011', zone: 'powercor' },
  { suburb: 'Frankston', postcode: '3199', zone: 'united' },
  { suburb: 'Brighton', postcode: '3186', zone: 'united' },
  { suburb: 'Mornington', postcode: '3931', zone: 'united' },
  { suburb: 'Preston', postcode: '3072', zone: 'jemena' },
  { suburb: 'Coburg', postcode: '3058', zone: 'jemena' },
  { suburb: 'Essendon', postcode: '3040', zone: 'jemena' },
  { suburb: 'Ringwood', postcode: '3134', zone: 'ausnet' },
  { suburb: 'Traralgon', postcode: '3844', zone: 'ausnet' },
  { suburb: 'Wodonga', postcode: '3690', zone: 'ausnet' },
  { suburb: 'Canberra City', postcode: '2601', zone: 'evoenergy' },
  { suburb: 'Belconnen', postcode: '2617', zone: 'evoenergy' },
  { suburb: 'Tuggeranong', postcode: '2900', zone: 'evoenergy' },
  { suburb: 'Hobart', postcode: '7000', zone: 'tasnetworks' },
  { suburb: 'Launceston', postcode: '7250', zone: 'tasnetworks' },
  { suburb: 'Devonport', postcode: '7310', zone: 'tasnetworks' },
]

/* ── Retailers ───────────────────────────────────────────────── */

export interface Retailer {
  id: string
  name: string
  /** CDR code used to address this retailer's public PRD endpoint. */
  cdrCode: string
}

export const RETAILERS: Retailer[] = [
  { id: 'agl', name: 'AGL', cdrCode: 'agl' },
  { id: 'origin', name: 'Origin Energy', cdrCode: 'originenergy' },
  { id: 'energyaustralia', name: 'EnergyAustralia', cdrCode: 'energyaustralia' },
  { id: 'alinta', name: 'Alinta Energy', cdrCode: 'alintaenergy' },
  { id: 'red', name: 'Red Energy', cdrCode: 'redenergy' },
  { id: 'momentum', name: 'Momentum Energy', cdrCode: 'momentumenergy' },
  { id: 'simply', name: 'Simply Energy', cdrCode: 'simplyenergy' },
  { id: 'powershop', name: 'Powershop', cdrCode: 'powershop' },
  { id: 'globird', name: 'GloBird Energy', cdrCode: 'globirdenergy' },
  { id: 'tango', name: 'Tango Energy', cdrCode: 'tangoenergy' },
  { id: 'nectr', name: 'Nectr', cdrCode: 'nectr' },
  { id: 'diamond', name: 'Diamond Energy', cdrCode: 'diamondenergy' },
  { id: 'ovo', name: 'OVO Energy', cdrCode: 'ovoenergy' },
  { id: 'amber', name: 'Amber Electric', cdrCode: 'amber' },
  { id: 'engie', name: 'ENGIE', cdrCode: 'engie' },
  { id: 'sumo', name: 'Sumo', cdrCode: 'sumo' },
  { id: 'actewagl', name: 'ActewAGL', cdrCode: 'actewagl' },
  { id: 'kogan', name: 'Kogan Energy', cdrCode: 'koganenergy' },
]

export const RETAILER_NAME = new Map(RETAILERS.map((r) => [r.id, r.name]))

/* ── Tariffs and plans ───────────────────────────────────────── */

export type Tariff =
  | { kind: 'single'; cPerKwh: number }
  | { kind: 'tou'; peak: number; shoulder: number; offpeak: number }

export interface Plan {
  id: string
  retailerId: string
  name: string
  zones: ZoneId[]
  /** cents per day */
  supply: number
  tariff: Tariff
  /** cents per kWh on a separate controlled-load circuit, if offered */
  controlledLoad?: number
  /** solar feed-in, cents per kWh exported */
  fit: number
  /**
   * Daily export ceiling on the headline feed-in rate. Retailers offering
   * a high FiT almost always cap it — without this, a large system prices
   * as if every exported kWh earned the premium rate, which no Australian
   * plan actually pays.
   */
  fitCapKwhPerDay?: number
  /** Rate paid on export beyond the cap. */
  fitAboveCap?: number
  /** percentage off usage with no conditions attached */
  guaranteedDiscount?: number
  /** percentage off usage that depends on paying on time */
  conditionalDiscount?: number
  /** one-off credit in the first year, dollars */
  signupCredit?: number
  /** months the above benefits last; null means the rate is ongoing */
  benefitMonths: number | null
  exitFee: number
  lockIn: boolean
  /** share of supply matched with accredited GreenPower */
  green: number
  vpp: boolean
  evPlan: boolean
  auSupport: boolean
}

const NSW: ZoneId[] = ['ausgrid', 'endeavour', 'essential']
const QLD: ZoneId[] = ['energex', 'ergon']
const VIC: ZoneId[] = ['citipower', 'powercor', 'united', 'jemena', 'ausnet']
const ALL: ZoneId[] = [...NSW, ...QLD, ...VIC, 'sapn', 'evoenergy', 'tasnetworks']

export const PLANS: Plan[] = [
  {
    id: 'agl-value-saver',
    retailerId: 'agl',
    name: 'Value Saver',
    zones: ALL,
    supply: 108.4,
    tariff: { kind: 'single', cPerKwh: 32.9 },
    controlledLoad: 20.1,
    fit: 4.5,
    guaranteedDiscount: 6,
    benefitMonths: 12,
    exitFee: 0,
    lockIn: false,
    green: 0,
    vpp: false,
    evPlan: false,
    auSupport: false,
  },
  {
    id: 'agl-solar-boost',
    retailerId: 'agl',
    name: 'Solar Boost Plus',
    zones: [...NSW, ...QLD, 'sapn'],
    supply: 127.4,
    tariff: { kind: 'tou', peak: 54.9, shoulder: 33.8, offpeak: 24.6 },
    controlledLoad: 20.4,
    fit: 11.5,
    fitCapKwhPerDay: 10,
    fitAboveCap: 3.0,
    benefitMonths: 12,
    exitFee: 0,
    lockIn: false,
    green: 0,
    vpp: true,
    evPlan: false,
    auSupport: false,
  },
  {
    id: 'origin-everyday-rewards',
    retailerId: 'origin',
    name: 'Everyday Rewards Variable',
    zones: ALL,
    supply: 112.7,
    tariff: { kind: 'single', cPerKwh: 33.8 },
    controlledLoad: 21.0,
    fit: 5.0,
    conditionalDiscount: 12,
    signupCredit: 75,
    benefitMonths: 12,
    exitFee: 0,
    lockIn: false,
    green: 0,
    vpp: false,
    evPlan: false,
    auSupport: false,
  },
  {
    id: 'origin-ev-power-up',
    retailerId: 'origin',
    name: 'EV Power Up',
    zones: [...NSW, ...QLD, ...VIC, 'sapn'],
    supply: 116.0,
    tariff: { kind: 'tou', peak: 54.2, shoulder: 32.9, offpeak: 8.0 },
    controlledLoad: 19.8,
    fit: 5.0,
    benefitMonths: 24,
    exitFee: 0,
    lockIn: false,
    green: 0,
    vpp: false,
    evPlan: true,
    auSupport: false,
  },
  {
    id: 'ea-total-plan',
    retailerId: 'energyaustralia',
    name: 'Total Plan Home',
    zones: ALL,
    supply: 114.9,
    tariff: { kind: 'single', cPerKwh: 31.6 },
    controlledLoad: 20.8,
    fit: 4.0,
    guaranteedDiscount: 4,
    conditionalDiscount: 5,
    benefitMonths: 12,
    exitFee: 0,
    lockIn: false,
    green: 0,
    vpp: false,
    evPlan: false,
    auSupport: false,
  },
  {
    id: 'alinta-home-deal',
    retailerId: 'alinta',
    name: 'HomeDeal',
    zones: [...NSW, ...QLD, ...VIC, 'sapn'],
    supply: 98.6,
    tariff: { kind: 'single', cPerKwh: 30.4 },
    controlledLoad: 19.4,
    fit: 3.3,
    guaranteedDiscount: 8,
    benefitMonths: 12,
    exitFee: 0,
    lockIn: false,
    green: 0,
    vpp: false,
    evPlan: false,
    auSupport: false,
  },
  {
    id: 'red-living-energy',
    retailerId: 'red',
    name: 'Living Energy Saver',
    zones: [...NSW, ...QLD, ...VIC, 'sapn'],
    supply: 104.1,
    tariff: { kind: 'single', cPerKwh: 30.9 },
    controlledLoad: 19.9,
    fit: 6.6,
    guaranteedDiscount: 5,
    benefitMonths: 24,
    exitFee: 0,
    lockIn: false,
    green: 0,
    vpp: false,
    evPlan: false,
    auSupport: true,
  },
  {
    id: 'red-ev-saver',
    retailerId: 'red',
    name: 'EV Saver',
    zones: [...NSW, ...VIC],
    supply: 107.5,
    tariff: { kind: 'tou', peak: 49.9, shoulder: 30.2, offpeak: 10.0 },
    fit: 6.0,
    benefitMonths: 12,
    exitFee: 0,
    lockIn: false,
    green: 0,
    vpp: false,
    evPlan: true,
    auSupport: true,
  },
  {
    id: 'momentum-smile-power',
    retailerId: 'momentum',
    name: 'Smile Power Flexi',
    zones: [...NSW, ...VIC, 'sapn', 'tasnetworks'],
    supply: 101.3,
    tariff: { kind: 'single', cPerKwh: 31.2 },
    controlledLoad: 19.6,
    fit: 5.2,
    guaranteedDiscount: 3,
    benefitMonths: null,
    exitFee: 0,
    lockIn: false,
    green: 0,
    vpp: false,
    evPlan: false,
    auSupport: true,
  },
  {
    id: 'simply-rate-saver',
    retailerId: 'simply',
    name: 'Rate Saver',
    zones: [...NSW, ...QLD, ...VIC, 'sapn'],
    supply: 96.8,
    tariff: { kind: 'single', cPerKwh: 29.7 },
    controlledLoad: 18.9,
    fit: 3.0,
    conditionalDiscount: 10,
    benefitMonths: 12,
    exitFee: 45,
    lockIn: true,
    green: 0,
    vpp: false,
    evPlan: false,
    auSupport: false,
  },
  {
    id: 'powershop-shopper',
    retailerId: 'powershop',
    name: 'Shopper Market Offer',
    zones: [...NSW, ...QLD, ...VIC, 'sapn'],
    supply: 106.2,
    tariff: { kind: 'single', cPerKwh: 30.1 },
    controlledLoad: 19.2,
    fit: 6.0,
    guaranteedDiscount: 4,
    benefitMonths: null,
    exitFee: 0,
    lockIn: false,
    green: 100,
    vpp: false,
    evPlan: false,
    auSupport: true,
  },
  {
    id: 'globird-glosave',
    retailerId: 'globird',
    name: 'GloSave',
    zones: [...VIC, ...NSW, 'energex'],
    supply: 89.4,
    tariff: { kind: 'single', cPerKwh: 28.8 },
    controlledLoad: 18.4,
    fit: 2.0,
    guaranteedDiscount: 2,
    benefitMonths: 12,
    exitFee: 0,
    lockIn: false,
    green: 0,
    vpp: false,
    evPlan: false,
    auSupport: false,
  },
  {
    id: 'globird-globo-tou',
    retailerId: 'globird',
    name: 'GloBo Time of Use',
    zones: [...VIC, ...NSW],
    supply: 92.1,
    tariff: { kind: 'tou', peak: 47.6, shoulder: 28.4, offpeak: 17.9 },
    controlledLoad: 18.1,
    fit: 3.5,
    benefitMonths: 12,
    exitFee: 0,
    lockIn: false,
    green: 0,
    vpp: false,
    evPlan: false,
    auSupport: false,
  },
  {
    id: 'tango-home-select',
    retailerId: 'tango',
    name: 'Home Select',
    zones: [...VIC, ...NSW, 'sapn'],
    supply: 94.7,
    tariff: { kind: 'single', cPerKwh: 29.9 },
    controlledLoad: 19.0,
    fit: 4.0,
    guaranteedDiscount: 6,
    benefitMonths: 12,
    exitFee: 0,
    lockIn: false,
    green: 0,
    vpp: false,
    evPlan: false,
    auSupport: true,
  },
  {
    id: 'nectr-solar-max',
    retailerId: 'nectr',
    name: 'Solar Max 12',
    zones: [...NSW, ...QLD, ...VIC, 'sapn'],
    supply: 124.6,
    tariff: { kind: 'single', cPerKwh: 34.9 },
    controlledLoad: 19.7,
    fit: 12.0,
    fitCapKwhPerDay: 8,
    fitAboveCap: 2.5,
    benefitMonths: 12,
    exitFee: 0,
    lockIn: false,
    green: 0,
    vpp: false,
    evPlan: false,
    auSupport: false,
  },
  {
    id: 'diamond-everyday-green',
    retailerId: 'diamond',
    name: 'Everyday Green',
    zones: [...NSW, ...VIC, 'sapn', 'energex'],
    supply: 113.6,
    tariff: { kind: 'single', cPerKwh: 32.2 },
    controlledLoad: 20.2,
    fit: 8.0,
    fitCapKwhPerDay: 14,
    fitAboveCap: 4.0,
    benefitMonths: null,
    exitFee: 0,
    lockIn: false,
    green: 100,
    vpp: true,
    evPlan: false,
    auSupport: true,
  },
  {
    id: 'ovo-the-one',
    retailerId: 'ovo',
    name: 'The One Plan',
    zones: [...NSW, ...QLD, ...VIC, 'sapn'],
    supply: 102.9,
    tariff: { kind: 'tou', peak: 48.4, shoulder: 29.6, offpeak: 19.8 },
    controlledLoad: 18.7,
    fit: 5.0,
    guaranteedDiscount: 7,
    benefitMonths: 12,
    exitFee: 0,
    lockIn: false,
    green: 25,
    vpp: false,
    evPlan: true,
    auSupport: true,
  },
  {
    id: 'amber-smartshift',
    retailerId: 'amber',
    name: 'SmartShift Wholesale',
    zones: [...NSW, ...QLD, ...VIC, 'sapn'],
    supply: 118.5,
    tariff: { kind: 'tou', peak: 44.0, shoulder: 26.8, offpeak: 14.2 },
    fit: 9.5,
    fitCapKwhPerDay: 12,
    fitAboveCap: 4.5,
    benefitMonths: null,
    exitFee: 0,
    lockIn: false,
    green: 0,
    vpp: true,
    evPlan: true,
    auSupport: true,
  },
  {
    id: 'engie-simple',
    retailerId: 'engie',
    name: 'Simple Saver',
    zones: [...NSW, ...QLD, ...VIC, 'sapn'],
    supply: 99.9,
    tariff: { kind: 'single', cPerKwh: 30.6 },
    controlledLoad: 19.3,
    fit: 4.5,
    guaranteedDiscount: 5,
    signupCredit: 50,
    benefitMonths: 12,
    exitFee: 0,
    lockIn: false,
    green: 10,
    vpp: false,
    evPlan: false,
    auSupport: false,
  },
  {
    id: 'kogan-first',
    retailerId: 'kogan',
    name: 'First Energy Saver',
    zones: [...NSW, ...QLD, ...VIC, 'sapn'],
    supply: 93.2,
    tariff: { kind: 'single', cPerKwh: 29.4 },
    controlledLoad: 18.6,
    fit: 3.0,
    guaranteedDiscount: 7,
    benefitMonths: 12,
    exitFee: 0,
    lockIn: false,
    green: 0,
    vpp: false,
    evPlan: false,
    auSupport: false,
  },
  {
    id: 'actewagl-home',
    retailerId: 'actewagl',
    name: 'Home Saver ACT',
    zones: ['evoenergy'],
    supply: 96.4,
    tariff: { kind: 'single', cPerKwh: 26.8 },
    controlledLoad: 17.2,
    fit: 8.0,
    guaranteedDiscount: 4,
    benefitMonths: 12,
    exitFee: 0,
    lockIn: false,
    green: 0,
    vpp: false,
    evPlan: false,
    auSupport: true,
  },
  {
    id: 'sumo-power',
    retailerId: 'sumo',
    name: 'Sumo Power Plus',
    zones: [...VIC, ...NSW],
    supply: 103.4,
    tariff: { kind: 'single', cPerKwh: 30.8 },
    controlledLoad: 19.5,
    fit: 4.7,
    conditionalDiscount: 15,
    benefitMonths: 12,
    exitFee: 65,
    lockIn: true,
    green: 0,
    vpp: false,
    evPlan: false,
    auSupport: false,
  },
]

export function plansForZone(zone: ZoneId): Plan[] {
  return PLANS.filter((p) => p.zones.includes(zone))
}
