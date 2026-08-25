import { useState } from 'react'
import { Mark } from './Preloader'
import { MagneticButton } from './MagneticButton'

interface Props {
  onSuccess: (user: { name: string; email: string }) => void
  onClose: () => void
}

const VALID_USERS = [
  { user: 'demo@renewise.com.au', pass: 'renewise2026', name: 'Mark F.' },
  { user: 'demo@renewise.com.au', pass: 'password123', name: 'Mark F.' },
  { user: 'demo', pass: 'renewise2026', name: 'Mark F.' },
  { user: 'demo', pass: 'password123', name: 'Mark F.' },
  { user: 'pitch', pass: 'pitch2026', name: 'Pitch Demo' },
]

export function LoginModal({ onSuccess, onClose }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleQuickFill = () => {
    setUsername('demo@renewise.com.au')
    setPassword('renewise2026')
    setError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const u = username.trim().toLowerCase()
    const p = password.trim()

    const match = VALID_USERS.find(
      (item) => item.user.toLowerCase() === u && item.pass === p,
    )

    if (match) {
      setError('')
      onSuccess({ name: match.name, email: u })
    } else {
      setError('Invalid demo credentials. Use Quick-Fill or demo@renewise.com.au / renewise2026')
    }
  }

  return (
    <div className="login-modal" role="dialog" aria-modal="true">
      <div className="login-modal__backdrop" onClick={onClose} />
      <div className="login-modal__dialog">
        <header className="login-modal__head">
          <div className="login-modal__brand">
            <Mark size={16} />
            <span className="mono">Renewise Account</span>
          </div>
          <button
            type="button"
            className="login-modal__close"
            onClick={onClose}
            aria-label="Close login dialog"
            data-cursor="explore"
          >
            &times;
          </button>
        </header>

        <form onSubmit={handleSubmit} className="login-modal__form">
          <h2 className="login-modal__h display">Sign in to your account</h2>
          <p className="login-modal__sub mono">
            Autonomous electricity tracking and switch dashboard.
          </p>

          <div className="login-modal__quick">
            <button
              type="button"
              className="login-modal__quick-btn mono"
              onClick={handleQuickFill}
              data-cursor="explore"
            >
              ⚡ 1-Click Fill Demo Credentials
            </button>
          </div>

          <div className="login-modal__fields">
            <label className="login-modal__field">
              <span className="mono">Username or Email</span>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setError('')
                }}
                placeholder="demo@renewise.com.au"
                autoComplete="username"
                required
              />
            </label>

            <label className="login-modal__field">
              <span className="mono">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                placeholder="••••••••••••"
                autoComplete="current-password"
                required
              />
            </label>
          </div>

          {error && <p className="login-modal__err mono">{error}</p>}

          <div className="login-modal__actions">
            <MagneticButton variant="solid" pull={8} cursor="open">
              Sign In
            </MagneticButton>
          </div>

          <p className="login-modal__hint mono">
            Demo credentials: <code>demo@renewise.com.au</code> / <code>renewise2026</code>
          </p>
        </form>
      </div>
    </div>
  )
}
