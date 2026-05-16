import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Loader2, ChevronRight, X, Sprout, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from '../components/Logo.jsx'

const BG_IMAGE = 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1920&q=90'

export default function Login() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const user = await login(form)
      toast.success(`Welcome back, ${user.full_name.split(' ')[0]}!`)
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');

        .pg-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          position: relative;
          overflow: hidden;
        }
        .pg-bg {
          position: absolute;
          inset: 0;
          background-image: url('${BG_IMAGE}');
          background-size: cover;
          background-position: center 30%;
          will-change: transform;
        }
        .pg-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            160deg,
            rgba(10,26,10,0.78) 0%,
            rgba(15,40,15,0.55) 50%,
            rgba(30,60,20,0.40) 100%
          );
        }
        .pg-grain {
          position: absolute;
          inset: 0;
          opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size: 200px 200px;
          pointer-events: none;
        }

        /* ---- Hero content ---- */
        .pg-content {
          position: relative;
          z-index: 10;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 2rem 2.5rem;
        }
        @media(min-width:768px){ .pg-content { padding: 3rem 5rem; } }

        .pg-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 999px;
          padding: 0.35rem 0.9rem;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(210,240,200,0.95);
          width: fit-content;
          margin-bottom: 1.6rem;
        }

        .pg-headline {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(2.8rem, 7vw, 6rem);
          font-weight: 900;
          line-height: 1.02;
          color: #f0f9ed;
          max-width: 680px;
          margin-bottom: 1.4rem;
        }
        .pg-headline em {
          font-style: italic;
          color: #a8d878;
        }

        .pg-sub {
          font-size: 1.05rem;
          font-weight: 300;
          color: rgba(220,245,210,0.82);
          max-width: 480px;
          line-height: 1.65;
          margin-bottom: 2.6rem;
        }

        .pg-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          background: #a8d878;
          color: #0d2208;
          font-weight: 600;
          font-size: 1rem;
          padding: 0.95rem 2rem;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 8px 32px rgba(0,0,0,0.25), 0 2px 8px rgba(168,216,120,0.3);
          letter-spacing: 0.01em;
        }
        .pg-cta:hover {
          background: #bce890;
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.3), 0 4px 12px rgba(168,216,120,0.4);
        }
        .pg-cta:active { transform: translateY(0); }

        .pg-register-link {
          margin-top: 1.2rem;
          font-size: 0.85rem;
          color: rgba(200,230,185,0.75);
        }
        .pg-register-link a {
          color: #a8d878;
          font-weight: 600;
          text-decoration: none;
          border-bottom: 1px solid rgba(168,216,120,0.4);
        }
        .pg-register-link a:hover { border-color: #a8d878; }

        /* bottom stat strip */
        .pg-stats {
          display: flex;
          gap: 2.5rem;
          margin-top: auto;
          padding-top: 3rem;
        }
        .pg-stat-val {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          font-weight: 700;
          color: #a8d878;
          line-height: 1;
        }
        .pg-stat-label {
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(200,230,185,0.6);
          margin-top: 0.25rem;
        }

        /* ---- Modal backdrop ---- */
        .pg-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background: rgba(5,15,5,0.65);
          backdrop-filter: blur(6px);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.35s ease;
        }
        .pg-backdrop.open {
          opacity: 1;
          pointer-events: all;
        }

        /* ---- Form card ---- */
        .pg-card {
          width: 100%;
          max-width: 420px;
          background: rgba(8, 24, 8, 0.88);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(168,216,120,0.2);
          border-radius: 24px;
          padding: 2.4rem 2.2rem 2rem;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
          transform: translateY(24px) scale(0.97);
          transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.35s ease;
          opacity: 0;
        }
        .pg-backdrop.open .pg-card {
          transform: translateY(0) scale(1);
          opacity: 1;
        }

        .pg-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1.8rem;
        }
        .pg-card-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: #e8f5e1;
          line-height: 1.1;
        }
        .pg-card-sub {
          font-size: 0.82rem;
          color: rgba(180,220,160,0.6);
          margin-top: 0.3rem;
          font-weight: 300;
        }
        .pg-close {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 50%;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgba(200,230,185,0.7);
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .pg-close:hover { background: rgba(255,255,255,0.14); color: #e8f5e1; }

        .pg-field { margin-bottom: 1.1rem; }
        .pg-label {
          display: block;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(168,216,120,0.7);
          margin-bottom: 0.45rem;
        }
        .pg-input {
          width: 100%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(168,216,120,0.2);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          font-size: 0.92rem;
          color: #e8f5e1;
          outline: none;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
          box-sizing: border-box;
        }
        .pg-input::placeholder { color: rgba(180,220,160,0.3); }
        .pg-input:focus {
          border-color: rgba(168,216,120,0.55);
          background: rgba(255,255,255,0.09);
          box-shadow: 0 0 0 3px rgba(168,216,120,0.08);
        }
        .pg-input-wrap { position: relative; }
        .pg-eye {
          position: absolute;
          right: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(168,216,120,0.5);
          display: flex;
          align-items: center;
          padding: 0;
          transition: color 0.2s;
        }
        .pg-eye:hover { color: rgba(168,216,120,0.9); }

        .pg-submit {
          width: 100%;
          background: #a8d878;
          color: #0d2208;
          font-weight: 700;
          font-size: 0.95rem;
          padding: 0.85rem;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          margin-top: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.02em;
        }
        .pg-submit:hover:not(:disabled) { background: #bce890; transform: translateY(-1px); }
        .pg-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        .pg-card-footer {
          margin-top: 1.2rem;
          text-align: center;
          font-size: 0.8rem;
          color: rgba(180,220,160,0.5);
        }
        .pg-card-footer a {
          color: #a8d878;
          font-weight: 600;
          text-decoration: none;
        }
        .pg-card-footer a:hover { text-decoration: underline; }
      `}</style>

      <div className="pg-root">
        <div className="pg-bg" />
        <div className="pg-overlay" />
        <div className="pg-grain" />

        <div className="pg-content">
          {/* Nav */}
          <div style={{ marginBottom: '0' }}>
            <Logo size={38} dark />
          </div>

          {/* Hero */}
          <div style={{ marginTop: 'auto', paddingBottom: '1rem' }}>
            <div className="pg-badge">
              <Sprout size={12} />
              For Zimbabwe's farmers
            </div>
            <h1 className="pg-headline">
              Guard your <em>harvest</em><br />with AI.
            </h1>
            <p className="pg-sub">
              Identify crop pests in seconds. Map outbreaks across Zimbabwe.
              Get treatment advice — all from a single photo.
            </p>

            <button className="pg-cta" onClick={() => setOpen(true)}>
              Sign in to your farm
              <ArrowRight size={18} />
            </button>

            <p className="pg-register-link">
              New to PestGuard?{' '}
              <Link to="/register">Create a free account</Link>
            </p>
          </div>

          {/* Stats */}
          <div className="pg-stats">
            {[['92%','AI accuracy'],['100+','Pest species'],['10','Provinces covered']].map(([v,l]) => (
              <div key={l}>
                <div className="pg-stat-val">{v}</div>
                <div className="pg-stat-label">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      <div className={`pg-backdrop${open ? ' open' : ''}`} onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
        <div className="pg-card">
          <div className="pg-card-header">
            <div>
              <div className="pg-card-title">Welcome back</div>
              <div className="pg-card-sub">Sign in to keep watch over your fields.</div>
            </div>
            <button className="pg-close" onClick={() => setOpen(false)}><X size={16} /></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="pg-field">
              <label className="pg-label">Username or Email</label>
              <input
                type="text"
                autoComplete="username"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="pg-input"
                placeholder="e.g. tadiwanashe"
              />
            </div>

            <div className="pg-field">
              <label className="pg-label">Password</label>
              <div className="pg-input-wrap">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="pg-input"
                  style={{ paddingRight: '2.8rem' }}
                  placeholder="••••••••"
                />
                <button type="button" className="pg-eye" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="pg-submit">
              {submitting
                ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Signing in…</>
                : <>Sign in <ChevronRight size={17} /></>}
            </button>
          </form>

          <div className="pg-card-footer">
            New to PestGuard?{' '}
            <Link to="/register" onClick={() => setOpen(false)}>Create an account</Link>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}