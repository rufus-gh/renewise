# Renewise

An Australian residential electricity switching service. Prices every plan in the
market against a household's actual usage, then watches the calendar so that when
the intro discount expires — and it will — the customer is already on the next one.

Built as a single React app: an editorial marketing site and the product flow share
one design system and one motion language.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

---

## Why the product is shaped this way

Australian market offers are sold on a **benefit period** — typically twelve months
of discounted rates, after which the customer silently rolls onto something worse.
Retailers are required to warn you thirty days out, and almost nobody acts on that
letter. Everything here is built around closing that gap.

Two decisions follow from it, and both are visible in the code:

**We are paid by the customer, not the retailer.** Every comparison service in this
market takes commission; one of them paid an $8.5m penalty for letting that shape
its rankings. Because Renewise takes a subscription instead, the ranking can include
plans from retailers we have no relationship with — which is all of them.

**Guaranteed and conditional prices are never added together.** The headline figure
is what you pay if you miss a bill. Pay-on-time discounts are shown separately as
upside. This is enforced in the engine (`quote()` returns `guaranteed` and `best` as
distinct numbers) and every savings figure on screen is measured against the same
basis as the price beside it.

**"Automatic" is one tap, and we say so.** Under the National Energy Retail Law no
third party can transfer a customer without their explicit informed consent for that
specific contract. There is no lawful zero-touch switch. Auto-pilot re-prices the
market, picks the plan and sends it thirty days out; the customer's part is one
deliberate tap on something they have already read.

---

## Layout

```
src/
  data/
    market.ts       Zones, distributors, retailers, plans, tariffs
    engine.ts       Pricing engine — pure, no I/O
  components/       Marketing site sections + shared motion primitives
  onboarding/
    Onboarding.tsx  Flow state machine
    steps/          One component per step
    ui.tsx          StepFrame, Choice, Toggle, Chip
  lib/gsap.ts       Plugin registration, eases, motion guards
  hooks/useGsap.ts  gsap.context scoped to a ref, reverted on unmount
  styles/           tokens → base → site → flow
```

### The pricing engine

`src/data/engine.ts` is pure and has no I/O, so it runs identically on a server or in
the browser — which also means the demo works with no network. It decomposes a
household's annual consumption into billable buckets, then prices each plan against
them.

What it accounts for:

- Time-of-use windows, using a load shape per household archetype
- Solar generation, on-site self-consumption and export
- Battery time-shifting of evening load into the overnight window
- Controlled-load circuits billed at a separate rate
- **Feed-in tariff caps** — retailers offering a high FiT cap it by kWh/day, and
  ignoring that makes any large system price as though every exported kWh earned the
  premium rate
- **Per-zone network factors** — network costs are roughly half a bill and vary
  enormously by distribution zone, so base rates are scaled so a mid-market plan
  lands near the published DMO/VDO reference price for that zone
- Benefit-period expiry, priced explicitly into a two-year total

Every quote carries its assumptions and a confidence band. The rates shown on the
consent screen are the zone-effective ones, so the arithmetic on that screen
reproduces the total above it.

### Where the data comes from

`market.ts` ships a representative snapshot in the shape of the AER's open **CDR
Product Reference Data** endpoints:

```
GET https://cdr.energymadeeasy.gov.au/{cdrCode}/cds-au/v1/energy/plans
      ?type=ALL&fuelType=ELECTRICITY&effective=CURRENT&page-size=1000
Headers:  x-v: 1     x-min-v: 1
```

Every authorised retailer must publish generic plan data there. It is public,
unauthenticated, and needs no commercial agreement — so swapping the snapshot for a
nightly ingest is a data-source change, not an engine change.

Real usage data (two years of interval metering, NMI standing data, DER register)
comes from AEMO via the customer's retailer under CDR consumer data sharing. That
needs ACCC accreditation or the CDR Representative model, so it is a later phase;
benchmarks and bill upload cover the gap.

---

## The flow

```
01 Address      → resolves the distribution zone, which decides
                  which plans legally exist for this household
02 Provider     → prices the incumbent's expired rate, so "savings"
                  is measured against what they actually pay
03 Usage        → three household shapes, never labelled low/medium/high
04 Solar & battery
05 Priority     → a scoring weight, not a filter
06 Calculation  → the market being priced, shown rather than spun
07 Results      → three options on different axes, plus the full market
08 Consent      → full disclosure, then explicit informed consent
09 Mode         → auto-pilot or manual, chosen against their own expiry date
10 Dashboard    → benefit clock, switch status, "has your situation changed?"
```

Try `JUDGES2026` in the promo field on the dashboard.

---

## Motion

GSAP with ScrollTrigger. Every timeline is created inside `gsap.context()` scoped to
a ref (`useGsap`) and reverted on unmount, so nothing leaks between sections.

Three rules the code sticks to:

**GSAP owns any transform it later animates.** A CSS percentage transform resolves to
pixels by the time GSAP reads it, so a later `yPercent` tween animates a different
property than the one holding the element down — the element never moves. Start
states for animated transforms are set with `gsap.set`, never in CSS.

**Nothing the user needs is revealed only by an animation.** A hidden tab stops rAF,
so a timeline started there never runs. `shouldAnimate()` returns false for reduced
motion *and* hidden documents, and every entrance applies its end state instead.
Step transitions advance state first and animate second, so the flow can never strand
itself mid-tween.

**Colour endpoints are literals.** GSAP cannot parse `var(--token)` as a tween
endpoint; it silently becomes transparent.

Scroll-driven scenes are scrubbed rather than fired. The signature scene — the
benefit-expiry cliff — pins on desktop and plays through unpinned below 900px.

---

## Accessibility & performance

- Semantic sections, one `h1`, visible focus states, a skip link
- The custom cursor is removed entirely on touch and under reduced motion; no
  interaction depends on hover
- Consent is a real unticked checkbox with the disclosure above it
- Tabular figures everywhere money appears
- The flow is a separate chunk, warmed on idle — the marketing site ships ~127 kB
  gzipped without it
- Animation is transform and opacity only; no layout-triggering properties
- Scroll work is done with class toggles and direct DOM writes, so no React state
  updates during scroll

---

## Not built yet

- Real CDR ingest and the accreditation path behind it
- Bill upload / OCR for exact current rates
- Stripe subscriptions (the promo redemption is UI only)
- Gas, and the states beyond the seeded localities
