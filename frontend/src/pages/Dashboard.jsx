import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Camera, Map, FileText, History as HistoryIcon, BookOpen,
  BarChart3, Calendar, Bug, CheckCircle2, Lightbulb, ChevronRight, Sparkles,
} from 'lucide-react'
import { reportsApi } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'

const TIPS = [
  {
    title: 'Early Detection',
    text: 'Regular scouting can reduce pest damage by up to 40%. Check fields twice a week.',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=70',
  },
  {
    title: 'Natural Predators',
    text: 'Ladybugs, lacewings, and praying mantises eat aphids, mites, and small caterpillars.',
    image: 'https://images.unsplash.com/photo-1591385326962-1cefccba0676?auto=format&fit=crop&w=1200&q=70',
  },
  {
    title: 'Crop Rotation',
    text: 'Changing crops each season breaks pest life cycles and improves soil health.',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=70',
  },
  {
    title: 'Neem Oil',
    text: 'Neem oil repels over 200 insect species and is safe for beneficial insects.',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=70',
  },
  {
    title: 'Yellow Sticky Traps',
    text: 'Catch flying pests like whiteflies and thrips before they multiply across the field.',
    image: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=1200&q=70',
  },
]

const QUICK_LINKS = [
  { to: '/check',    icon: Camera,      label: 'Check Crops',   tone: 'leaf',  desc: 'Identify pests from a photo' },
  { to: '/map',      icon: Map,         label: 'Detection Map', tone: 'earth', desc: 'See live outbreaks nearby' },
  { to: '/reports',  icon: FileText,    label: 'My Reports',    tone: 'leaf',  desc: 'Track what you reported' },
  { to: '/history',  icon: HistoryIcon, label: 'Scan History',  tone: 'earth', desc: 'Past AI identifications' },
  { to: '/learn',    icon: BookOpen,    label: 'Learn',         tone: 'leaf',  desc: 'Pest library & outbreaks' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    reportsApi.stats(30).then(setStats).catch(() => setStats(null))
  }, [])

  const firstName = user?.full_name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const my = stats?.my || {}

  return (
    <>
      {/* ---- Blurry field background fixed behind everything ---- */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: -2,
        backgroundImage: "url('https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=1920&q=80')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(7px)',
        transform: 'scale(1.06)',
      }} />
      {/* Soft light wash so cards stay crisp and legible */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        background: 'rgba(242, 249, 240, 0.70)',
      }} />

      <div className="space-y-8 animate-fade-up">
        {/* ---- Hero greeting card — original gradient colours ---- */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-canvas-warm via-canvas to-leaf-50 border border-leaf-100 px-6 lg:px-10 py-8 lg:py-10">
          <div className="absolute -right-12 -top-12 w-72 h-72 bg-leaf-100/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-earth-100/40 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <h1 className="font-display text-3xl lg:text-5xl font-bold text-leaf-950">
              {greeting}, <span className="text-leaf-700">{firstName}</span>
            </h1>
            <p className="text-leaf-700 mt-2 text-base lg:text-lg">
              Welcome to PestGuard — your pest monitoring companion.
            </p>
          </div>
        </section>

        {/* ---- Main two-column layout: summary + tips ---- */}
        <div className="grid lg:grid-cols-5 gap-6">
          <section className="lg:col-span-2 card-padded">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-2xl font-bold text-leaf-900">System Summary</h2>
              <Sparkles size={18} className="text-leaf-500" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SummaryStat icon={BarChart3}    label="Total Reports"  value={my.total_reports ?? 0} />
              <SummaryStat icon={Calendar}     label="Today's Reports" value={my.today_reports ?? 0} />
              <SummaryStat icon={Bug}          label="Top Pest"        value={my.top_pest || '—'} small />
              <SummaryStat icon={CheckCircle2} label="Total Scans"     value={my.total_scans ?? 0} />
            </div>

            <div className="mt-5 p-4 rounded-2xl bg-leaf-50 border border-leaf-100 flex items-start gap-3">
              <Lightbulb size={18} className="text-leaf-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-leaf-800">
                <span className="font-semibold">Tip:</span> Use{' '}
                <Link to="/check" className="text-leaf-700 font-bold hover:underline">Check Crops</Link>
                {' '}to identify pests, and{' '}
                <Link to="/map" className="text-leaf-700 font-bold hover:underline">Detection Map</Link>
                {' '}to see live outbreaks.
              </p>
            </div>
          </section>

          <section className="lg:col-span-3 space-y-3">
            <h2 className="font-display text-2xl font-bold text-leaf-900 flex items-center gap-2">
              <Lightbulb size={20} className="text-earth-500" />
              Pest Management Tips
            </h2>
            <div className="space-y-3">
              {TIPS.map((tip) => (
                <div key={tip.title}
                  className="relative overflow-hidden rounded-3xl border border-leaf-100 shadow-soft group cursor-default h-32 lg:h-36">
                  <img
                    src={tip.image}
                    alt={tip.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-leaf-950/80 via-leaf-950/55 to-leaf-950/30" />
                  <div className="relative h-full flex flex-col justify-center p-5 lg:p-6 max-w-2xl">
                    <h3 className="font-display text-xl lg:text-2xl font-bold text-leaf-50">{tip.title}</h3>
                    <p className="text-leaf-100/95 text-sm lg:text-base mt-1 max-w-md leading-snug">{tip.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ---- Quick links section ---- */}
        <section>
          <h2 className="font-display text-2xl font-bold text-leaf-900 mb-4">Jump in</h2>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {QUICK_LINKS.map(({ to, icon: Icon, label, tone, desc }) => (
              <Link key={to} to={to}
                className="group card p-5 hover:shadow-lifted hover:-translate-y-0.5 transition-all">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3
                  ${tone === 'earth' ? 'bg-earth-100 text-earth-700' : 'bg-leaf-100 text-leaf-700'}
                `}>
                  <Icon size={20} strokeWidth={2.2} />
                </div>
                <h3 className="font-display text-lg font-bold text-leaf-900">{label}</h3>
                <p className="text-xs text-leaf-600 mt-1 leading-snug">{desc}</p>
                <ChevronRight size={16} className="text-leaf-400 mt-3 group-hover:text-leaf-700 transition" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}

function SummaryStat({ icon: Icon, label, value, small }) {
  return (
    <div className="p-4 rounded-2xl bg-canvas-subtle/60 border border-leaf-100">
      <div className="flex justify-between items-start mb-2">
        <p className={`font-display font-bold text-leaf-950 leading-none ${small ? 'text-lg' : 'text-3xl'}`}>
          {value}
        </p>
        <Icon size={16} className="text-leaf-500" />
      </div>
      <p className="text-xs text-leaf-600 font-medium">{label}</p>
    </div>
  )
}