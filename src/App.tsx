import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { ScrollTrigger } from './lib/gsap'
import { Preloader } from './components/Preloader'
import { Nav, type AuthUser } from './components/Nav'
import { Hero } from './components/Hero'
import { Thesis } from './components/Thesis'
import { SystemVisualization } from './components/SystemVisualization'
import { Signature } from './components/Signature'
import { Proof } from './components/Proof'
import { Capabilities } from './components/Capabilities'
import { Philosophy } from './components/Philosophy'
import { CTA } from './components/CTA'
import { Footer } from './components/Footer'
import { LoginModal } from './components/LoginModal'

/* The flow — every step, the pricing engine and the market snapshot —
   is a separate chunk. Visitors who only read the page never download
   it; it is warmed on idle so the click still feels instant. */
const Onboarding = lazy(() =>
  import('./onboarding/Onboarding').then((m) => ({ default: m.Onboarding })),
)
const warmFlow = () => import('./onboarding/Onboarding')

const SEEN = 'renewise:seen'
const AUTH_KEY = 'renewise:auth'

export default function App() {
  // Repeat visits skip the initialisation entirely.
  const [ready, setReady] = useState(() => sessionStorage.getItem(SEEN) === '1')
  const [showPre] = useState(() => sessionStorage.getItem(SEEN) !== '1')
  const [flow, setFlow] = useState(false)
  const [flowStep, setFlowStep] = useState(0)
  const [loginOpen, setLoginOpen] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = sessionStorage.getItem(AUTH_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

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

  const handleStart = (step = 0) => {
    setFlowStep(step)
    setFlow(true)
  }

  const handleLoginSuccess = (authed: AuthUser) => {
    setUser(authed)
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(authed))
    setLoginOpen(false)
    // Directly open the live customer dashboard
    handleStart(9)
  }

  const handleLogout = () => {
    setUser(null)
    sessionStorage.removeItem(AUTH_KEY)
  }

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      {showPre && <Preloader onDone={done} />}

      <Nav
        ready={ready}
        user={user}
        onStart={() => handleStart(0)}
        onOpenLogin={() => setLoginOpen(true)}
        onOpenDashboard={() => handleStart(9)}
        onLogout={handleLogout}
      />

      <main id="main">
        <Hero ready={ready} onStart={() => handleStart(0)} />
        <Thesis />
        <SystemVisualization />
        <Signature />
        <Proof />
        <Capabilities />
        <Philosophy />
        <CTA onStart={() => handleStart(0)} />
      </main>

      <Footer />

      {loginOpen && (
        <LoginModal
          onSuccess={handleLoginSuccess}
          onClose={() => setLoginOpen(false)}
        />
      )}

      {flow && (
        <Suspense fallback={null}>
          <Onboarding initialStep={flowStep} onExit={() => setFlow(false)} />
        </Suspense>
      )}
    </>
  )
}
