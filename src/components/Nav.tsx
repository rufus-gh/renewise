import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, EASE, prefersReducedMotion } from '../lib/gsap'
import { Mark } from './Preloader'
import { MagneticButton } from './MagneticButton'

const LINKS = [
  { href: '#system', label: 'System' },
  { href: '#proof', label: 'Evidence' },
  { href: '#capabilities', label: 'What it does' },
]

export interface AuthUser {
  name: string
  email: string
}

interface Props {
  ready: boolean
  user: AuthUser | null
  onStart: () => void
  onOpenLogin: () => void
  onOpenDashboard: () => void
  onLogout: () => void
}

/**
 * Nav with section links, demo login trigger, and direct dashboard access.
 */
export function Nav({
  ready,
  user,
  onStart,
  onOpenLogin,
  onOpenDashboard,
  onLogout,
}: Props) {
  const root = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    if (!ready || !root.current) return
    const el = root.current

    if (prefersReducedMotion()) {
      gsap.set(el, { yPercent: 0, opacity: 1 })
      return
    }
    const ctx = gsap.context(() => {
      gsap.to(el, { yPercent: 0, opacity: 1, duration: 0.9, ease: EASE.ui, delay: 0.5 })

      const st = ScrollTrigger.create({
        start: 'top -140',
        end: 99999,
        onUpdate: (self) => {
          const hiding = self.direction === 1 && self.scroll() > 240
          gsap.to(el, {
            yPercent: hiding ? -130 : 0,
            duration: 0.5,
            ease: EASE.ui,
            overwrite: true,
          })
        },
      })
      return () => st.kill()
    }, el)
    return () => ctx.revert()
  }, [ready])

  return (
    <header ref={root} className="nav" data-open={open}>
      <div className="nav__bar shell">
        <a href="#top" className="nav__mark" data-cursor="explore" aria-label="Renewise, home">
          <Mark size={16} />
          <span>Renewise</span>
        </a>

        <nav className="nav__links" aria-label="Sections">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="nav__link" data-cursor="explore">
              <span>{l.label}</span>
              <span aria-hidden="true">{l.label}</span>
            </a>
          ))}
        </nav>

        <div className="nav__right">
          {user ? (
            <div className="nav__user-wrap">
              <button
                type="button"
                className="nav__dash-btn mono"
                onClick={onOpenDashboard}
                data-cursor="explore"
              >
                ⚡ Live Dashboard
              </button>
              <button
                type="button"
                className="nav__user-pill mono"
                onClick={() => setUserMenuOpen((v) => !v)}
                data-cursor="explore"
              >
                <span className="nav__user-dot" />
                <span>{user.name}</span>
              </button>
              {userMenuOpen && (
                <div className="nav__user-menu">
                  <p className="nav__user-email mono">{user.email}</p>
                  <button
                    type="button"
                    className="nav__menu-item"
                    onClick={() => {
                      setUserMenuOpen(false)
                      onOpenDashboard()
                    }}
                  >
                    View Account &amp; Dashboard
                  </button>
                  <button
                    type="button"
                    className="nav__menu-item"
                    onClick={() => {
                      setUserMenuOpen(false)
                      onStart()
                    }}
                  >
                    Run New Comparison
                  </button>
                  <button
                    type="button"
                    className="nav__menu-item nav__menu-item--logout"
                    onClick={() => {
                      setUserMenuOpen(false)
                      onLogout()
                    }}
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="nav__signin-btn mono"
              onClick={onOpenLogin}
              data-cursor="explore"
            >
              Sign In
            </button>
          )}

          <MagneticButton variant="solid" onClick={onStart} pull={10} cursor="open">
            Start now
          </MagneticButton>
        </div>

        <button
          className="nav__burger"
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
        </button>
      </div>

      <div className="nav__sheet" hidden={!open}>
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
        {user ? (
          <>
            <button
              onClick={() => {
                setOpen(false)
                onOpenDashboard()
              }}
            >
              Live Dashboard ({user.name})
            </button>
            <button
              onClick={() => {
                setOpen(false)
                onLogout()
              }}
            >
              Log Out
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              setOpen(false)
              onOpenLogin()
            }}
          >
            Sign In (Demo)
          </button>
        )}
        <button
          onClick={() => {
            setOpen(false)
            onStart()
          }}
        >
          Start now
        </button>
      </div>
    </header>
  )
}
