import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen, Bug, Search, MapPin, Calendar, AlertTriangle,
  Wheat, Shield, Sprout, Pill, AlertCircle, ChevronRight, X,
} from 'lucide-react'
import { reportsApi, pickImageSrc } from '../lib/api'
import { usePestData } from '../context/PestDataContext.jsx'
import toast from 'react-hot-toast'

const SEV_STYLES = {
  low:      'bg-leaf-100 text-leaf-800',
  medium:   'bg-earth-100 text-earth-800',
  high:     'bg-ember-100 text-ember-700',
  critical: 'bg-ember-600 text-white',
}

export default function Learn() {
  const [tab, setTab] = useState('library')

  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <p className="text-xs font-semibold text-leaf-600 uppercase tracking-[0.2em]">Knowledge</p>
        <h1 className="font-display text-4xl lg:text-5xl font-bold text-leaf-950 mt-1">Learn</h1>
        <p className="text-leaf-700 mt-2 max-w-2xl">
          Browse the full pest library and see what other farmers are reporting
          near you so you stay prepared.
        </p>
      </header>

      {/* Tabs */}
      <div className="inline-flex gap-1 p-1 bg-canvas-subtle rounded-2xl border border-leaf-100">
        <TabButton active={tab === 'library'} onClick={() => setTab('library')}
          icon={BookOpen} label="Pest Library" />
        <TabButton active={tab === 'reported'} onClick={() => setTab('reported')}
          icon={AlertTriangle} label="Reported Outbreaks" />
      </div>

      {tab === 'library' ? <PestLibrary /> : <ReportedOutbreaks />}
    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
        ${active ? 'bg-white shadow-soft text-leaf-900' : 'text-leaf-600 hover:text-leaf-900'}`}>
      <Icon size={15} /> {label}
    </button>
  )
}

/* -------- PEST LIBRARY TAB -------- */

function PestLibrary() {
  const { allPests, loading } = usePestData()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const pests = useMemo(() => {
    const all = allPests()
    if (!search) return all
    const q = search.toLowerCase()
    return all.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.friendly_name?.toLowerCase().includes(q) ||
      p.scientific_name?.toLowerCase().includes(q) ||
      p.affected_crops?.toLowerCase().includes(q)
    )
  }, [search, allPests])

  if (loading) return <div className="text-center py-12 text-leaf-500 font-display text-xl">Loading library…</div>

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-leaf-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          className="input pl-9" placeholder="Search by name or crop…" />
      </div>

      <p className="text-sm text-leaf-600">
        <strong>{pests.length}</strong> pest{pests.length !== 1 ? 's' : ''} in our library
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {pests.map(p => (
          <button key={p.name} onClick={() => setSelected(p)}
            className="card p-3 text-left hover:shadow-lifted hover:-translate-y-0.5 transition-all group flex gap-3">
            <PestImage pest={p} className="w-20 h-20 rounded-2xl flex-shrink-0" />
            <div className="min-w-0 flex-1 flex flex-col">
              <div className="flex items-start justify-between gap-1">
                <h3 className="font-display font-bold text-leaf-900 text-sm leading-tight line-clamp-2">
                  {p.friendly_name}
                </h3>
                <ChevronRight size={14} className="text-leaf-400 flex-shrink-0 mt-0.5 group-hover:text-leaf-700 transition" />
              </div>
              <p className="text-[11px] italic text-leaf-600 truncate mt-0.5">{p.scientific_name}</p>
              <p className="text-[11px] text-leaf-700 mt-1 line-clamp-2 leading-snug">
                {p.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {pests.length === 0 && (
        <div className="card-padded text-center py-12">
          <p className="text-leaf-600">No pests match "{search}"</p>
        </div>
      )}

      {selected && <PestDetailModal pest={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

/**
 * PestImage — shows a thumbnail for a pest, fetched from Wikipedia by scientific
 * name. Results are cached in localStorage so we hit Wikipedia at most once per
 * species. If Wikipedia has no page, we show a coloured fallback with a bug icon.
 *
 * The cached "no image" results expire after 7 days so transient Wikipedia
 * outages don't permanently blank out the cards.
 */
function PestImage({ pest, className = 'aspect-[16/10]' }) {
  const [src, setSrc] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const sci = pest.scientific_name
    if (!sci) { setFailed(true); return }

    const cacheKey = `pest_img:${sci}`
    const NEG_CACHE_MS = 7 * 24 * 60 * 60 * 1000  // 7 days

    // Check cache: a JSON entry {url, ts} or 'legacy plain URL string'
    try {
      const raw = localStorage.getItem(cacheKey)
      if (raw) {
        let parsed
        try { parsed = JSON.parse(raw) } catch { parsed = { url: raw, ts: Date.now() } }
        if (parsed.url === '__none__') {
          // Expired negative cache? retry.
          if (Date.now() - parsed.ts < NEG_CACHE_MS) { setFailed(true); return }
        } else if (parsed.url) {
          setSrc(parsed.url); return
        }
      }
    } catch {}

    // Wikipedia REST API summary endpoint — returns thumbnail when available
    const title = encodeURIComponent(sci.split(' ').slice(0, 2).join(' '))
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled) return
        const thumb = data?.thumbnail?.source || data?.originalimage?.source
        if (thumb) {
          // Upgrade Wikipedia thumb to a slightly larger size for sharper display
          const upgraded = thumb.replace(/\/\d+px-/, '/320px-')
          setSrc(upgraded)
          try { localStorage.setItem(cacheKey, JSON.stringify({ url: upgraded, ts: Date.now() })) } catch {}
        } else {
          setFailed(true)
          try { localStorage.setItem(cacheKey, JSON.stringify({ url: '__none__', ts: Date.now() })) } catch {}
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
          try { localStorage.setItem(cacheKey, JSON.stringify({ url: '__none__', ts: Date.now() })) } catch {}
        }
      })

    return () => { cancelled = true }
  }, [pest.scientific_name])

  // Deterministic accent gradient per pest so fallbacks aren't monotone
  const accent = (() => {
    const colors = [
      'from-leaf-200 to-leaf-400',
      'from-earth-200 to-earth-400',
      'from-leaf-300 to-earth-300',
      'from-earth-300 to-leaf-400',
      'from-leaf-400 to-leaf-200',
      'from-earth-100 to-leaf-300',
    ]
    let hash = 0
    const key = pest.scientific_name || pest.name
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) | 0
    }
    return colors[Math.abs(hash) % colors.length]
  })()

  if (failed || !pest.scientific_name) {
    return (
      <div className={`${className} bg-gradient-to-br ${accent} flex items-center justify-center`}>
        <Bug size={24} className="text-leaf-900/40" strokeWidth={1.5} />
      </div>
    )
  }

  if (!src) {
    return <div className={`${className} bg-gradient-to-br ${accent} animate-pulse`} />
  }

  return (
    <div className={`${className} bg-canvas-subtle overflow-hidden`}>
      <img
        src={src}
        alt={pest.friendly_name}
        loading="lazy"
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  )
}

function PestDetailModal({ pest, onClose }) {
  // Re-use the same image lookup as the card. PestImage component handles
  // its own caching, but we want to read it directly here for the hero background.
  const [heroImg, setHeroImg] = useState(null)

  useEffect(() => {
    const sci = pest.scientific_name
    if (!sci) return
    try {
      const raw = localStorage.getItem(`pest_img:${sci}`)
      if (raw) {
        let parsed
        try { parsed = JSON.parse(raw) } catch { parsed = { url: raw } }
        if (parsed.url && parsed.url !== '__none__') setHeroImg(parsed.url)
      }
    } catch {}
  }, [pest.scientific_name])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-leaf-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-lifted" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          {/* Hero header — uses Wikipedia image as background when available */}
          <div className="relative overflow-hidden rounded-t-3xl">
            {heroImg && (
              <img src={heroImg} alt="" aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className={`absolute inset-0 ${heroImg
              ? 'bg-gradient-to-br from-leaf-950/85 via-leaf-900/75 to-leaf-700/60'
              : 'bg-gradient-to-br from-leaf-700 to-leaf-900'}`} />
            <div className="relative text-leaf-50 p-6 lg:p-8">
              <button onClick={onClose}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-leaf-50 z-10">
                <X size={18} />
              </button>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-leaf-50/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                  <Bug size={24} />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-2xl lg:text-3xl font-bold leading-tight">{pest.friendly_name}</h2>
                  {pest.scientific_name && <p className="text-sm italic text-leaf-200">{pest.scientific_name}</p>}
                </div>
              </div>
              <p className="text-leaf-100/95 leading-relaxed max-w-2xl">{pest.description}</p>
            </div>
          </div>

          <div className="p-6 lg:p-8 grid md:grid-cols-2 gap-4">
            <DetailCard icon={Wheat}       title="Affected crops"     text={pest.affected_crops}   tone="earth" />
            <DetailCard icon={AlertCircle} title="Symptoms"           text={pest.symptoms}         tone="ember" />
            <DetailCard icon={Sprout}      title="Organic control"    text={pest.organic_control}  tone="leaf" />
            <DetailCard icon={Pill}        title="Chemical control"   text={pest.chemical_control} tone="leaf" />
            <DetailCard icon={Shield}      title="Prevention"         text={pest.prevention}       tone="earth" full />
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailCard({ icon: Icon, title, text, tone, full }) {
  const styles = {
    leaf:  'bg-leaf-100 text-leaf-700',
    earth: 'bg-earth-100 text-earth-700',
    ember: 'bg-ember-100 text-ember-700',
  }[tone]
  return (
    <div className={`p-4 rounded-2xl bg-canvas-subtle/40 border border-leaf-100 ${full ? 'md:col-span-2' : ''}`}>
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${styles}`}>
          <Icon size={16} />
        </div>
        <h4 className="font-display font-bold text-leaf-900">{title}</h4>
      </div>
      <p className="text-sm text-leaf-700 leading-relaxed whitespace-pre-line">
        {text || <em className="text-leaf-400">Not available</em>}
      </p>
    </div>
  )
}

/* -------- REPORTED OUTBREAKS TAB -------- */

function ReportedOutbreaks() {
  const { lookup } = usePestData()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    reportsApi.list({ status: 'active', days: 90 })
      .then(({ reports }) => setReports(reports))
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false))
  }, [])

  const visible = reports.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    const friendly = lookup(r.pest_class)?.friendly_name || ''
    return [r.pest_class, friendly, r.region, r.crop_affected, r.user_name].filter(Boolean)
      .some(s => s.toLowerCase().includes(q))
  })

  if (loading) return <div className="text-center py-12 text-leaf-500 font-display text-xl">Loading outbreaks…</div>

  return (
    <div className="space-y-4">
      <div className="card p-4 bg-gradient-to-br from-earth-50 to-leaf-50">
        <p className="text-sm text-leaf-800">
          <AlertTriangle size={14} className="inline mr-1.5 text-earth-600" />
          Active outbreaks reported across Zimbabwe in the last 90 days. Pay extra attention if any
          are near your region — they may spread.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-leaf-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          className="input pl-9" placeholder="Search by region, pest or farmer…" />
      </div>

      {visible.length === 0 ? (
        <div className="card-padded text-center py-16">
          <div className="w-20 h-20 rounded-3xl bg-leaf-100 mx-auto flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-leaf-500" />
          </div>
          <h3 className="font-display text-2xl font-bold text-leaf-900">No outbreaks reported</h3>
          <p className="text-leaf-600 mt-2 max-w-md mx-auto">
            {reports.length === 0
              ? 'Once farmers start reporting outbreaks, they\'ll appear here.'
              : `No outbreaks match "${search}"`}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {visible.map(r => {
            const info = lookup(r.pest_class)
            return (
              <div key={r.id} className="card p-4 flex items-start gap-4">
                {r.image_path ? (
                  <img src={pickImageSrc(r)} alt="" className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-leaf-100 flex items-center justify-center flex-shrink-0">
                    <Bug size={28} className="text-leaf-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-bold text-leaf-900">{info?.friendly_name || r.pest_class}</h3>
                    <span className={`chip capitalize ${SEV_STYLES[r.severity]}`}>{r.severity}</span>
                  </div>
                  {info?.scientific_name && <p className="text-xs italic text-leaf-600">{info.scientific_name}</p>}
                  <p className="text-sm text-leaf-700 mt-1">
                    {r.crop_affected && <>on <strong>{r.crop_affected}</strong> · </>}
                    Reported by <strong>{r.user_name}</strong>
                  </p>
                  {r.description && <p className="text-sm text-leaf-600 mt-1 line-clamp-2">{r.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-leaf-500">
                    <span className="inline-flex items-center gap-1"><MapPin size={11} /> {r.region || 'Unknown'}</span>
                    <span className="inline-flex items-center gap-1"><Calendar size={11} /> {new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="text-center pt-4">
        <Link to="/map" className="btn-secondary">View all on map →</Link>
      </div>
    </div>
  )
}
