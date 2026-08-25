import { LOCALITIES, type Locality, type ZoneId } from './market'

export interface RawPostcodeRecord {
  postcode: number | string
  place_name: string
  state_code: string
  state_name?: string
  latitude?: number
  longitude?: number
}

/**
 * Maps any Australian suburb, postcode, and state to the corresponding
 * electricity distribution network zone.
 */
export function resolveZone(stateCode: string, postcodeStr: string, suburbName?: string): ZoneId {
  const p = parseInt(postcodeStr, 10)
  const st = (stateCode || '').trim().toUpperCase()
  const sub = (suburbName || '').trim().toLowerCase()

  if (st === 'ACT' || (p >= 2600 && p <= 2618) || (p >= 2900 && p <= 2914)) {
    return 'evoenergy'
  }

  if (st === 'TAS' || (p >= 7000 && p <= 7999)) {
    return 'tasnetworks'
  }

  if (st === 'SA' || (p >= 5000 && p <= 5999)) {
    return 'sapn'
  }

  if (st === 'QLD' || (p >= 4000 && p <= 4999)) {
    // SE QLD (Brisbane, Gold Coast, Sunshine Coast, Moreton Bay, Ipswich)
    if ((p >= 4000 && p <= 4349) || (p >= 4500 && p <= 4549)) {
      return 'energex'
    }
    // Regional QLD (Ergon)
    return 'ergon'
  }

  if (st === 'VIC' || (p >= 3000 && p <= 3999)) {
    // Melbourne CBD / Inner
    if (
      (p >= 3000 && p <= 3008) ||
      (p >= 3051 && p <= 3057) ||
      p === 3121 ||
      p === 3141 ||
      p === 3142 ||
      p === 3181 ||
      (p >= 3205 && p <= 3207) ||
      sub.includes('melbourne') ||
      sub.includes('carlton') ||
      sub.includes('fitzroy') ||
      sub.includes('richmond')
    ) {
      return 'citipower'
    }

    // United Energy (Bayside, South East Melbourne, Peninsula)
    if (
      (p >= 3143 && p <= 3153) ||
      (p >= 3161 && p <= 3199) ||
      (p >= 3910 && p <= 3996) ||
      sub.includes('brighton') ||
      sub.includes('st kilda') ||
      sub.includes('frankston') ||
      sub.includes('mornington')
    ) {
      return 'united'
    }

    // Jemena (North / North-West Melbourne)
    if (
      (p >= 3011 && p <= 3049) ||
      (p >= 3070 && p <= 3085) ||
      (p >= 3427 && p <= 3429) ||
      sub.includes('footscray') ||
      sub.includes('essendon') ||
      sub.includes('preston') ||
      sub.includes('sunbury')
    ) {
      return 'jemena'
    }

    // Powercor (Western suburbs, Geelong, Ballarat, Bendigo)
    if (
      p === 3024 ||
      (p >= 3211 && p <= 3499) ||
      sub.includes('geelong') ||
      sub.includes('ballarat') ||
      sub.includes('bendigo') ||
      sub.includes('werribee')
    ) {
      return 'powercor'
    }

    // AusNet Services (Eastern suburbs, Outer East, Gippsland)
    return 'ausnet'
  }

  if (st === 'NSW' || (p >= 2000 && p <= 2999)) {
    // Endeavour Energy (Western Sydney, Illawarra, Blue Mountains)
    if (
      (p >= 2140 && p <= 2179) ||
      (p >= 2500 && p <= 2574) ||
      (p >= 2745 && p <= 2786) ||
      sub.includes('parramatta') ||
      sub.includes('penrith') ||
      sub.includes('liverpool') ||
      sub.includes('campbelltown') ||
      sub.includes('wollongong') ||
      sub.includes('blacktown')
    ) {
      return 'endeavour'
    }

    // Essential Energy (Regional / Rural NSW)
    if (
      (p >= 2311 && p <= 2490) ||
      (p >= 2575 && p <= 2649) ||
      (p >= 2651 && p <= 2739) ||
      (p >= 2787 && p <= 2899) ||
      sub.includes('coffs') ||
      sub.includes('wagga') ||
      sub.includes('byron') ||
      sub.includes('dubbo') ||
      sub.includes('bathurst') ||
      sub.includes('tamworth') ||
      sub.includes('orange') ||
      sub.includes('albury')
    ) {
      return 'essential'
    }

    // Ausgrid (Sydney East, Inner West, Northern Beaches, Central Coast, Newcastle)
    return 'ausgrid'
  }

  // WA / NT / Other fallback to Ausgrid benchmark
  return 'ausgrid'
}

let loadedLocalities: Locality[] | null = null
let fetchPromise: Promise<Locality[]> | null = null

const POSTCODE_API_URL =
  'https://raw.githubusercontent.com/Elkfox/Australian-Postcode-Data/master/au_postcodes.json'

/**
 * Asynchronously loads the complete Australian postcodes dataset (~16k localities).
 * Returns cached list once loaded.
 */
export async function loadAustralianLocalities(): Promise<Locality[]> {
  if (loadedLocalities) return loadedLocalities
  if (fetchPromise) return fetchPromise

  fetchPromise = (async () => {
    try {
      const res = await fetch(POSTCODE_API_URL, { cache: 'force-cache' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: RawPostcodeRecord[] = await res.json()

      const seen = new Set<string>()
      const list: Locality[] = []

      for (const item of data) {
        if (!item.place_name || !item.postcode) continue
        const suburb = String(item.place_name).trim()
        const postcode = String(item.postcode).padStart(4, '0')
        const state = String(item.state_code || '').trim()
        const key = `${suburb.toLowerCase()}-${postcode}`

        if (seen.has(key)) continue
        seen.add(key)

        const zone = resolveZone(state, postcode, suburb)
        list.push({ suburb, postcode, zone })
      }

      loadedLocalities = list
      return list
    } catch (err) {
      console.warn('Failed to fetch online postcodes dataset, using built-in seed:', err)
      loadedLocalities = LOCALITIES
      return LOCALITIES
    }
  })()

  return fetchPromise
}

// Kick off background fetch so it is ready on first keystroke
if (typeof window !== 'undefined') {
  setTimeout(() => {
    loadAustralianLocalities().catch(() => {})
  }, 100)
}

/**
 * Searches across all Australian suburbs and postcodes (both local seed & full dataset).
 */
export async function searchLocalities(query: string, maxResults = 8): Promise<Locality[]> {
  const term = query.trim().toLowerCase()
  if (term.length < 2) return []

  // Ensure dataset is loaded
  const dataset = loadedLocalities || (await loadAustralianLocalities())

  // Match: Exact suburb match > Suburb starts with > Postcode starts with > Suburb contains
  const exact: Locality[] = []
  const startsWith: Locality[] = []
  const postcodeMatch: Locality[] = []
  const contains: Locality[] = []

  const isNumeric = /^\d+$/.test(term)

  for (const item of dataset) {
    const s = item.suburb.toLowerCase()
    const p = item.postcode

    if (isNumeric) {
      if (p.startsWith(term)) {
        postcodeMatch.push(item)
        if (postcodeMatch.length >= maxResults * 2) break
      }
    } else {
      if (s === term) {
        exact.push(item)
      } else if (s.startsWith(term)) {
        startsWith.push(item)
      } else if (s.includes(term)) {
        contains.push(item)
      }
      if (exact.length + startsWith.length + contains.length >= maxResults * 3) break
    }
  }

  const combined = isNumeric
    ? postcodeMatch
    : [...exact, ...startsWith, ...contains]

  return combined.slice(0, maxResults)
}
