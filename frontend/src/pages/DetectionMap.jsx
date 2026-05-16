import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Filter, Calendar, ChevronDown, Bug, AlertTriangle, RefreshCw, MapPin } from 'lucide-react'
import { reportsApi } from '../lib/api'
import { usePestData } from '../context/PestDataContext.jsx'
import toast from 'react-hot-toast'

const ZIM_CENTER = [-19.0154, 29.1549]
const ZIM_ZOOM = 6

const SEVERITY_COLORS = {
  low:      '#5fa45f',
  medium:   '#cd9347',
  high:     '#df6342',
  critical: '#a83820',
}

function makeIcon(severity, char) {
  const color = SEVERITY_COLORS[severity] || '#3f853f'
  return L.divIcon({
    html: `<div class="custom-marker-pin" style="background:${color}"><span>${char}</span></div>`,
    className: 'pestguard-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}

function FitToMarkers({ markers }) {
  const map = useMap()
  useEffect(() => {
    if (markers.length === 0) return
    const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]))
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 9 })
  }, [markers, map])
  return null
}

export default function DetectionMap() {
  const { lookup } = usePestData()
  const [markers, setMarkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(60)
  const [filter, setFilter] = useState({ severity: '' })

  const load = () => {
    setLoading(true)
    reportsApi.map(days)
      .then(({ markers }) => setMarkers(markers))
      .catch(() => toast.error('Failed to load map'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [days])

  const visible = useMemo(() =>
    markers.filter(m => !filter.severity || m.severity === filter.severity),
    [markers, filter]
  )

  return (
    <div className="space-y-5 animate-fade-up">
      {/* ── Hero header with background image ── */}
      <div className="relative overflow-hidden rounded-3xl">
        {/* Background image — dark green aerial crop field */}
        <img
          src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=1400&q=80"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
          onError={(e) => { e.target.style.display = 'none' }}
        />
        {/* Stronger gradient overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-leaf-950/95 via-leaf-900/85 to-leaf-700/70" />

        {/* Header content */}
        <div className="relative z-10 p-8 lg:p-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-leaf-300 uppercase tracking-[0.2em]">Geo-tracking</p>
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-white mt-1">
              Detection map
            </h1>

            {/* Welcome message card */}
            <div className="mt-4">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 shadow-lg inline-block">
                <p className="text-leaf-100 leading-relaxed text-sm">
                  Live distribution of reported pest outbreaks across Zimbabwe.
                </p>
              </div>
            </div>
          </div>

          <button onClick={load} className="btn-secondary shrink-0 bg-white/15 backdrop-blur border-white/30 text-white hover:bg-white/25">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-leaf-700 font-semibold">
          <Filter size={14} /> Filter
        </div>
        <Dropdown value={days} onChange={(v) => setDays(parseInt(v))}
          icon={<Calendar size={14} />}
          options={[
            { value: 7, label: 'Last 7 days' },
            { value: 30, label: 'Last 30 days' },
            { value: 60, label: 'Last 60 days' },
            { value: 90, label: 'Last 90 days' },
            { value: 365, label: 'Last year' },
          ]} />
        <Dropdown value={filter.severity} onChange={(v) => setFilter({ severity: v })}
          options={[
            { value: '', label: 'Any severity' },
            { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' },
          ]} />
        <div className="ml-auto text-sm text-leaf-600">
          <span className="font-bold text-leaf-900">{visible.length}</span> outbreak{visible.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-5">
        <div className="lg:col-span-3 card overflow-hidden" style={{ height: '70vh', minHeight: '500px' }}>
          <MapContainer center={ZIM_CENTER} zoom={ZIM_ZOOM} style={{ width: '100%', height: '100%' }} scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {visible.length > 0 && <FitToMarkers markers={visible} />}
            {visible.map((m) => {
              const info = lookup(m.pest_class)
              const friendly = info?.friendly_name || m.pest_class
              return (
                <Marker key={m.id} position={[m.lat, m.lng]}
                  icon={makeIcon(m.severity, friendly[0])}>
                  <Popup>
                    <div className="min-w-[200px] font-sans">
                      <strong className="text-leaf-900 block">{friendly}</strong>
                      {info?.scientific_name && <em className="text-xs text-leaf-600">{info.scientific_name}</em>}
                      <div className="mt-2 space-y-1 text-xs">
                        <p><strong>Severity:</strong> <span className="capitalize">{m.severity}</span></p>
                        {m.crop && <p><strong>Crop:</strong> {m.crop}</p>}
                        {m.region && <p><strong>Region:</strong> {m.region}</p>}
                        <p><strong>By:</strong> {m.user_name}</p>
                        <p className="text-leaf-500 mt-1">{new Date(m.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        </div>

        <aside className="space-y-4">
          <div className="card-padded">
            <h3 className="font-display font-bold text-leaf-900 mb-3">Severity legend</h3>
            <div className="space-y-2">
              {Object.entries(SEVERITY_COLORS).map(([sev, color]) => (
                <div key={sev} className="flex items-center gap-2.5 text-sm">
                  <div className="custom-marker-pin scale-75 -my-1" style={{ background: color }}>
                    <span>•</span>
                  </div>
                  <span className="text-leaf-800 capitalize">{sev}</span>
                  <span className="ml-auto text-xs font-mono text-leaf-500">
                    {visible.filter(m => m.severity === sev).length}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card-padded bg-gradient-to-br from-earth-50 to-leaf-50">
            <h3 className="font-display font-bold text-leaf-900 mb-1.5 flex items-center gap-2">
              <AlertTriangle size={16} /> Stay alert
            </h3>
            <p className="text-xs text-leaf-700 leading-relaxed">
              Outbreaks near your region mean similar pests may reach your fields soon. Inspect
              crops daily during outbreak weeks and prepare control measures early.
            </p>
          </div>

          {visible.length > 0 && (
            <div className="card-padded">
              <h3 className="font-display font-bold text-leaf-900 mb-3 flex items-center gap-2">
                <MapPin size={16} /> Latest
              </h3>
              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {visible.slice(0, 8).map(m => {
                  const f = lookup(m.pest_class)?.friendly_name || m.pest_class
                  return (
                    <div key={m.id} className="text-sm">
                      <p className="font-semibold text-leaf-900 truncate">{f}</p>
                      <p className="text-xs text-leaf-500">{m.region || 'Unknown'} · {new Date(m.created_at).toLocaleDateString()}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

function Dropdown({ value, onChange, options, icon }) {
  return (
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-leaf-500">{icon}</span>}
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className={`input appearance-none pr-8 py-2 text-sm cursor-pointer ${icon ? 'pl-9' : ''}`}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-leaf-500" />
    </div>
  )
}