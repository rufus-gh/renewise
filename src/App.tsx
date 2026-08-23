import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { ScrollTrigger } from './lib/gsap'
import { Cursor } from './components/Cursor'
import { Preloader } from './components/Preloader'
import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { Thesis } from './components/Thesis'
import { SystemVisualization } from './components/SystemVisualization'
import { Signature } from './components/Signature'
import { Proof } from './components/Proof'
import { Capabilities } from './components/Capabilities'
import { Philosophy } from './components/Philosophy'
import { CTA } from './components/CTA'
import { Footer } from './components/Footer'
/* The flow — every step, the pricing engine and the market snapshot —
   is a separate chunk. Visitors who only read the page never download
   it; it is warmed on idle so the click still feels instant. */
const Onboarding = lazy(() =>
  import('./onboarding/Onboarding').then((m) => ({ default: m.Onboarding })),
)
const warmFlow = () => import('./onboarding/Onboarding')

const SEEN = 'renewise:seen'

export default function App() {
  // Repeat visits skip the initialisation entirely.
  const [ready, setReady] = useState(() => sessionStorage.getItem(SEEN) === '1')
  const [showPre] = useState(() => sessionStorage.getItem(SEEN) !== '1')
  const [flow, setFlow] = useState(false)

  const done = useCallback(() => {
    sessionStorage.setItem(SEEN, '1')
    setReady(true)
    ScrollTrigger.refresh()
  }, [])

  // Pinned scenes measure themselves once fonts have settled.
  useEffect(() => {
    if (!ready) return
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 240)
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    const idle = window.requestIdleCallback?.(warmFlow) ?? window.setTimeout(warmFlow, 2000)
    return () => {
      window.clearTimeout(t)
      window.cancelIdleCallback?.(idle as number)
    }
  }, [ready])

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Cursor />
      {showPre && <Preloader onDone={done} />}

      <Nav ready={ready} onStart={() => setFlow(true)} />

      <main id="main">
        <Hero ready={ready} onStart={() => setFlow(true)} />
        <Thesis />
        <SystemVisualization />
        <Signature />
        <Proof />
        <Capabilities />
        <Philosophy />
        <CTA onStart={() => setFlow(true)} />
      </main>

      <Footer />

      {flow && (
        <Suspense fallback={null}>
          <Onboarding onExit={() => setFlow(false)} />
        </Suspense>
      )}
    </>
  )
}
