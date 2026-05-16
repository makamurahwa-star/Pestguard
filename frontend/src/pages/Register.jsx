import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ChevronRight, Loader2, Sprout, X, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from '../components/Logo.jsx'

const BG_IMAGE = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1920&q=90'

const ZIM_REGIONS = [
  'Harare', 'Bulawayo', 'Manicaland', 'Mashonaland Central',
  'Mashonaland East', 'Mashonaland West', 'Masvingo',
  'Matabeleland North', 'Matabeleland South', 'Midlands',
]

export default function Register() {
  const [open, setOpen] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    full_name: '', username: '', email: '', phone: '', password: '',
    region: '', farm_name: '', farm_size_hectares: '',
  })
  const { register } = useAuth()
  const navigate = useNavigate()

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const payload = { ...form }
      if (payload.farm_size_hectares === '') delete payload.farm_size_hectares
      else payload.farm_size_hectares = parseFloat(payload.farm_size_hectares)
      const user = await register(payload)
      toast.success(`Welcome, ${user.full_name.split(' ')[0]}!`)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

        .rg-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          position: relative;
          overflow: hidden;
        }
        .rg-bg {
          position: absolute;
          inset: 0;
          background-image: url('${BG_IMAGE}');
          background-size: cover;
          background-position: center 40%;
        }
        .rg-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            145deg,
            rgba(8,22,8,0.82) 0%,
            rgba(20,50,15,0.58) 55%,
            rgba(40,80,20,0.38) 100%
          );
        }
        .rg-grain {
          position: absolute;
          inset: 0;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size: 200px 200px;
          pointer-events: none;
        }

        .rg-content {
          position: relative;
          z-index: 10;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 2rem 2.5rem;
        }
        @media(min-width:768px){ .rg-content { padding: 3rem 5rem; } }

        .rg-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(255,255,255,0.11);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.16);
          border-radius: 999px;
          padding: 0.35rem 0.9rem;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(210,245,195,0.95);
          width: fit-content;
          margin-bottom: 1.6rem;
        }

        .rg-headline {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(2.6rem, 6.5vw, 5.5rem);
          font-weight: 900;
          line-height: 1.04;
          color: #f0f9ed;
          max-width: 620px;
          margin-bottom: 1.2rem;
        }
        .rg-headline em {
          font-style: italic;
          color: #a8d878;
        }

        .rg-sub {
          font-size: 1rem;
          font-weight: 300;
          color: rgba(215,245,200,0.78);
          max-width: 460px;
          line-height: 1.7;
          margin-bottom: 2.4rem;
        }

        .rg-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          background: #a8d878;
          color: #0d2208;
          font-weight: 700;
          font-size: 1rem;
          padding: 0.95rem 2rem;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 8px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(168,216,120,0.3);
          letter-spacing: 0.01em;
          font-family: 'DM Sans', sans-serif;
        }
        .rg-cta:hover {
          background: #bce890;
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.32), 0 4px 12px rgba(168,216,120,0.4);
        }

        .rg-login-link {
          margin-top: 1.1rem;
          font-size: 0.84rem;
          color: rgba(200,235,180,0.7);
        }
        .rg-login-link a {
          color: #a8d878;
          font-weight: 600;
          text-decoration: none;
          border-bottom: 1px solid rgba(168,216,120,0.35);
        }
        .rg-login-link a:hover { border-color: #a8d878; }

        .rg-features {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
          margin-top: auto;
          padding-top: 3rem;
        }
        .rg-feature-pill {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(168,216,120,0.2);
          border-radius: 999px;
          padding: 0.45rem 1rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: rgba(200,240,180,0.8);
          backdrop-filter: blur(8px);
        }

        /* ---- Modal ---- */
        .rg-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: rgba(4,12,4,0.7);
          backdrop-filter: blur(8px);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.35s ease;
        }
        .rg-backdrop.open {
          opacity: 1;
          pointer-events: all;
        }

        .rg-card {
          width: 100%;
          max-width: 500px;
          max-height: 92vh;
          overflow-y: auto;
          background: rgba(8, 22, 8, 0.92);
          backdrop-filter: blur(28px);
          border: 1px solid rgba(168,216,120,0.18);
          border-radius: 24px;
          padding: 2.2rem 2rem 1.8rem;
          box-shadow: 0 40px 100px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04);
          transform: translateY(28px) scale(0.97);
          transition: transform 0.42s cubic-bezier(0.16,1,0.3,1), opacity 0.35s ease;
          opacity: 0;
          scrollbar-width: thin;
          scrollbar-color: rgba(168,216,120,0.2) transparent;
        }
        .rg-backdrop.open .rg-card {
          transform: translateY(0) scale(1);
          opacity: 1;
        }

        .rg-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1.6rem;
        }
        .rg-card-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.65rem;
          font-weight: 700;
          color: #e8f5e1;
          line-height: 1.1;
        }
        .rg-card-sub {
          font-size: 0.8rem;
          color: rgba(175,220,150,0.55);
          margin-top: 0.28rem;
          font-weight: 300;
        }
        .rg-close {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 50%;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgba(200,230,185,0.65);
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .rg-close:hover { background: rgba(255,255,255,0.13); color: #e8f5e1; }

        .rg-divider {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(168,216,120,0.4);
          display: flex;
          align-items: center;
          gap: 0.7rem;
          margin: 0.9rem 0;
        }
        .rg-divider::before, .rg-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(168,216,120,0.12);
        }

        .rg-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .rg-field { margin-bottom: 0.85rem; }
        .rg-label {
          display: block;
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(168,216,120,0.65);
          margin-bottom: 0.4rem;
        }
        .rg-input, .rg-select {
          width: 100%;
          background: rgba(255,255,255,0.055);
          border: 1px solid rgba(168,216,120,0.18);
          border-radius: 11px;
          padding: 0.7rem 0.9rem;
          font-size: 0.88rem;
          color: #e0f2d8;
          outline: none;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
          box-sizing: border-box;
          -webkit-appearance: none;
        }
        .rg-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23a8d878' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.9rem center; padding-right: 2.2rem; }
        .rg-input::placeholder { color: rgba(160,210,130,0.28); }
        .rg-input:focus, .rg-select:focus {
          border-color: rgba(168,216,120,0.5);
          background: rgba(255,255,255,0.08);
          box-shadow: 0 0 0 3px rgba(168,216,120,0.07);
        }
        .rg-select option { background: #0d2208; color: #e0f2d8; }
        .rg-input-wrap { position: relative; }
        .rg-eye {
          position: absolute;
          right: 0.8rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(168,216,120,0.45);
          display: flex;
          align-items: center;
          padding: 0;
          transition: color 0.2s;
        }
        .rg-eye:hover { color: rgba(168,216,120,0.9); }

        .rg-submit {
          width: 100%;
          background: #a8d878;
          color: #0d2208;
          font-weight: 700;
          font-size: 0.93rem;
          padding: 0.82rem;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          margin-top: 0.6rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .rg-submit:hover:not(:disabled) { background: #bce890; transform: translateY(-1px); }
        .rg-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        .rg-card-footer {
          margin-top: 1rem;
          text-align: center;
          font-size: 0.78rem;
          color: rgba(175,220,150,0.5);
        }
        .rg-card-footer a { color: #a8d878; font-weight: 600; text-decoration: none; }
        .rg-card-footer a:hover { text-decoration: underline; }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="rg-root">
        <div className="rg-bg" />
        <div className="rg-overlay" />
        <div className="rg-grain" />

        <div className="rg-content">
          <Logo size={38} dark />

          <div style={{ marginTop: 'auto', paddingBottom: '1rem' }}>
            <div className="rg-badge">
              <Sprout size={12} />
              Welcome to PestGuard
            </div>
            <h1 className="rg-headline">
              Every field deserves<br />a <em>guardian</em>.
            </h1>
            <p className="rg-sub">
              Join farmers across Zimbabwe using AI to identify pests,
              share outbreaks, and protect their harvest — always free.
            </p>

            <button className="rg-cta" onClick={() => setOpen(true)}>
              Create your farm profile
              <ArrowRight size={18} />
            </button>

            <p className="rg-login-link">
              Already registered?{' '}
              <Link to="/login">Sign in here</Link>
            </p>
          </div>

          <div className="rg-features">
            {['AI Pest ID','Outbreak Mapping','Treatment Advice','92% Accuracy','100+ Species','Always Free'].map(f => (
              <span key={f} className="rg-feature-pill">{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      <div className={`rg-backdrop${open ? ' open' : ''}`} onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
        <div className="rg-card">
          <div className="rg-card-header">
            <div>
              <div className="rg-card-title">Get started</div>
              <div className="rg-card-sub">Create your farmer profile in less than a minute.</div>
            </div>
            <button className="rg-close" onClick={() => setOpen(false)}><X size={16} /></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="rg-field">
              <label className="rg-label">Full Name *</label>
              <input required value={form.full_name} onChange={update('full_name')}
                className="rg-input" placeholder="e.g. Tadiwanashe Murahwa" />
            </div>

            <div className="rg-grid">
              <div className="rg-field">
                <label className="rg-label">Username *</label>
                <input required minLength={3} value={form.username} onChange={update('username')}
                  className="rg-input" placeholder="tadi" />
              </div>
              <div className="rg-field">
                <label className="rg-label">Phone</label>
                <input value={form.phone} onChange={update('phone')}
                  className="rg-input" placeholder="+263 77 …" />
              </div>
            </div>

            <div className="rg-field">
              <label className="rg-label">Email *</label>
              <input type="email" required value={form.email} onChange={update('email')}
                className="rg-input" placeholder="you@farm.com" />
            </div>

            <div className="rg-field">
              <label className="rg-label">Password *</label>
              <div className="rg-input-wrap">
                <input type={showPw ? 'text' : 'password'} required minLength={6}
                  value={form.password} onChange={update('password')}
                  className="rg-input" style={{ paddingRight: '2.6rem' }} placeholder="At least 6 characters" />
                <button type="button" className="rg-eye" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="rg-divider">Farm Details (optional)</div>

            <div className="rg-field">
              <label className="rg-label">Region</label>
              <select value={form.region} onChange={update('region')} className="rg-select">
                <option value="">Select your province</option>
                {ZIM_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="rg-grid">
              <div className="rg-field">
                <label className="rg-label">Farm Name</label>
                <input value={form.farm_name} onChange={update('farm_name')}
                  className="rg-input" placeholder="Greenfields" />
              </div>
              <div className="rg-field">
                <label className="rg-label">Size (ha)</label>
                <input type="number" step="0.1" min="0" value={form.farm_size_hectares}
                  onChange={update('farm_size_hectares')} className="rg-input" placeholder="2.5" />
              </div>
            </div>

            <button type="submit" disabled={submitting} className="rg-submit">
              {submitting
                ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Creating account…</>
                : <>Create account <ChevronRight size={17} /></>}
            </button>
          </form>

          <div className="rg-card-footer">
            Already registered?{' '}
            <Link to="/login" onClick={() => setOpen(false)}>Sign in</Link>
          </div>
        </div>
      </div>
    </>
  )
}