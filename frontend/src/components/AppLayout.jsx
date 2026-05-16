import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import {
  Home, Camera, Map, FileText, BookOpen, LogOut, Menu, X,
  PhoneCall, User, History,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from './Logo.jsx'

const NAV = [
  { to: '/dashboard', label: 'Dashboard',     icon: Home },
  { to: '/check',     label: 'Check Crops',   icon: Camera },
  { to: '/map',       label: 'Detection Map', icon: Map },
  { to: '/reports',   label: 'My Reports',    icon: FileText },
  { to: '/learn',     label: 'Learn',         icon: BookOpen },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Fade-on-scroll behaviour: hide when scrolling down, reveal when scrolling up.
  const [hidden, setHidden] = useState(false)
  const [atTop, setAtTop] = useState(true)
  const lastY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setAtTop(y < 8)
      if (y < 8) {
        setHidden(false)
      } else if (y > lastY.current + 6) {
        setHidden(true)   // scrolling down → hide
      } else if (y < lastY.current - 6) {
        setHidden(false)  // scrolling up   → reveal
      }
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Reset hidden state on route change
  useEffect(() => { setHidden(false); window.scrollTo(0, 0) }, [location.pathname])

  // Mobile menu
  const [mobileOpen, setMobileOpen] = useState(false)
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="min-h-screen pb-12">
      {/* ----- Top nav (fades on scroll) ----- */}
      <header
        className={`
          fixed top-0 inset-x-0 z-40
          transition-all duration-300
          ${hidden ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}
        `}
      >
        <div className={`
          px-4 lg:px-8 py-3
          ${atTop ? 'bg-canvas/70' : 'bg-white/90'}
          backdrop-blur-md border-b border-leaf-100
        `}>
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <NavLink to="/dashboard">
              <Logo size={36} />
            </NavLink>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1 bg-white/60 backdrop-blur border border-leaf-100 rounded-3xl px-1.5 py-1.5 shadow-soft">
              {NAV.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => isActive ? 'top-link-active' : 'top-link'}
                >
                  <Icon size={16} strokeWidth={2.2} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Desktop right actions */}
            <div className="hidden lg:flex items-center gap-2">
              <NavLink to="/emergency"
                className={({ isActive }) => `
                  inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold
                  transition-all
                  ${isActive
                    ? 'bg-ember-600 text-white border border-ember-700 shadow-soft'
                    : 'border border-ember-300 text-ember-700 bg-white hover:bg-ember-50'}
                `}
              >
                <PhoneCall size={15} />
                Emergency
              </NavLink>
              <button onClick={handleLogout} className="btn-primary">
                <LogOut size={15} />
                Logout
              </button>
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(o => !o)}
              className="lg:hidden p-2 rounded-xl hover:bg-leaf-100"
              aria-label="Menu">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* ----- Mobile dropdown menu ----- */}
      <div
        className={`
          fixed inset-x-0 top-[68px] z-30 lg:hidden
          transition-all duration-300
          ${mobileOpen ? 'translate-y-0 opacity-100 pointer-events-auto' : '-translate-y-4 opacity-0 pointer-events-none'}
        `}
      >
        <div className="mx-4 surface p-3 shadow-lifted">
          <nav className="space-y-1">
            {[...NAV,
              { to: '/history',   label: 'Scan History', icon: History },
              { to: '/profile',   label: 'Profile',      icon: User },
              { to: '/emergency', label: 'Emergency',    icon: PhoneCall, danger: true },
            ].map(({ to, label, icon: Icon, danger }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium
                  ${isActive
                    ? 'bg-leaf-100 text-leaf-900 border border-leaf-200'
                    : danger
                      ? 'text-ember-700 hover:bg-ember-50'
                      : 'text-leaf-800 hover:bg-leaf-50'}
                `}
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-leaf-800 hover:bg-leaf-50">
              <LogOut size={18} /> Logout
            </button>
          </nav>
        </div>
      </div>

      {/* Mobile menu backdrop */}
      {mobileOpen && (
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-20 bg-leaf-950/30 backdrop-blur-sm"
          aria-label="Close menu"
        />
      )}

      {/* ----- Content ----- */}
      <main className="pt-24 lg:pt-28 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
