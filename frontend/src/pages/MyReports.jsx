import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText, Plus, MapPin, Calendar, Bug, Trash2, CheckCircle2,
  Search, ChevronDown,
} from 'lucide-react'
import { reportsApi, uploadUrl } from '../lib/api'
import { usePestData } from '../context/PestDataContext.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'
import toast from 'react-hot-toast'

const SEV_STYLES = {
  low:      'bg-leaf-100 text-leaf-800',
  medium:   'bg-earth-100 text-earth-800',
  high:     'bg-ember-100 text-ember-700',
  critical: 'bg-ember-600 text-white',
}

export default function MyReports() {
  const { lookup } = usePestData()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState({ severity: '', status: '' })
  const [selected, setSelected] = useState(null)
  const [confirmState, setConfirmState] = useState(null)

  const load = () => {
    setLoading(true)
    reportsApi.list({ mine: 'true' })
      .then(({ reports }) => setReports(reports))
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const visible = reports.filter((r) => {
    if (filter.severity && r.severity !== filter.severity) return false
    if (filter.status && r.status !== filter.status) return false
    if (search) {
      const q = search.toLowerCase()
      const friendly = lookup(r.pest_class)?.friendly_name || ''
      const hay = [r.pest_class, friendly, r.crop_affected, r.region, r.description].filter(Boolean).join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })

  const handleDelete = (id) => {
    setConfirmState({
      title: 'Delete this report?',
      message: 'This outbreak report will be permanently removed from the map and from your records. This cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await reportsApi.delete(id)
          toast.success('Report deleted')
          setSelected(null)
          load()
        } catch { toast.error('Failed to delete') }
      },
    })
  }

  const handleResolve = async (id) => {
    try {
      await reportsApi.update(id, { status: 'resolved' })
      toast.success('Marked as resolved')
      load()
    } catch { toast.error('Failed') }
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ── Hero header with background image ── */}
      <div className="relative overflow-hidden rounded-3xl">
        {/* Background image — farmer in field */}
        <img
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1400&q=80"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-leaf-950/85 via-leaf-900/70 to-earth-800/60" />

        {/* Header content */}
        <div className="relative z-10 p-8 lg:p-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-leaf-300 uppercase tracking-[0.2em]">My contributions</p>
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-white mt-1">My reports</h1>

            {/* Welcome message card */}
            <div className="mt-4">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 shadow-lg inline-block">
                <p className="text-leaf-100 leading-relaxed text-sm">
                  Every outbreak you've logged — track, manage and resolve your field reports.
                </p>
              </div>
            </div>
          </div>

          <Link to="/reports/new" className="btn-primary shrink-0">
            <Plus size={16} /> New report
          </Link>
        </div>
      </div>

      <section className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-leaf-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="input pl-9" placeholder="Search pest, crop or region…" />
        </div>
        <Dropdown value={filter.severity} onChange={(v) => setFilter({ ...filter, severity: v })}
          options={[
            { value: '', label: 'Any severity' },
            { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' },
          ]} />
        <Dropdown value={filter.status} onChange={(v) => setFilter({ ...filter, status: v })}
          options={[
            { value: '', label: 'Any status' },
            { value: 'active', label: 'Active' }, { value: 'resolved', label: 'Resolved' },
          ]} />
      </section>

      {loading ? (
        <div className="text-center py-12 text-leaf-500 font-display text-xl">Loading…</div>
      ) : visible.length === 0 ? (
        <div className="card-padded text-center py-16">
          <div className="w-20 h-20 rounded-3xl bg-leaf-100 mx-auto flex items-center justify-center mb-4">
            <FileText size={32} className="text-leaf-500" />
          </div>
          <h3 className="font-display text-2xl font-bold text-leaf-900">No reports yet</h3>
          <p className="text-leaf-600 mt-2 max-w-md mx-auto">
            Log your first pest outbreak to help build the community map.
          </p>
          <Link to="/reports/new" className="btn-primary mt-6 inline-flex"><Plus size={16} /> Create your first report</Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {visible.map((r) => {
            const info = lookup(r.pest_class)
            return (
              <button key={r.id} onClick={() => setSelected(r)}
                className="card p-4 flex items-center gap-4 text-left hover:shadow-lifted hover:-translate-y-0.5 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-leaf-100 flex items-center justify-center flex-shrink-0">
                  <Bug size={24} className="text-leaf-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-bold text-leaf-900 truncate">
                      {info?.friendly_name || r.pest_class}
                    </h3>
                    <span className={`chip capitalize ${SEV_STYLES[r.severity]}`}>{r.severity}</span>
                    {r.status === 'resolved' && <span className="chip-slate"><CheckCircle2 size={11} /> resolved</span>}
                  </div>
                  <p className="text-sm text-leaf-600 mt-0.5 truncate">
                    {r.crop_affected && <>on <strong>{r.crop_affected}</strong>{' · '}</>}
                    {r.estimated_area_hectares && <>{r.estimated_area_hectares} ha{' · '}</>}
                    <span className="inline-flex items-center gap-1"><MapPin size={11} />{r.region || 'Unknown'}</span>
                  </p>
                  <p className="text-xs text-leaf-500 mt-1 flex items-center gap-1">
                    <Calendar size={11} /> {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {selected && (
        <DetailModal report={selected} info={lookup(selected.pest_class)}
          onClose={() => setSelected(null)}
          onDelete={() => handleDelete(selected.id)}
          onResolve={() => handleResolve(selected.id)} />
      )}

      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  )
}

function Dropdown({ value, onChange, options }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="input appearance-none pr-8 py-2 text-sm cursor-pointer">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-leaf-500" />
    </div>
  )
}

function DetailModal({ report, info, onClose, onDelete, onResolve }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-leaf-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lifted" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-leaf-100 flex justify-between items-start">
          <div>
            <h2 className="font-display text-2xl font-bold text-leaf-950">{info?.friendly_name || report.pest_class}</h2>
            {info?.scientific_name && <p className="text-sm italic text-leaf-600">{info.scientific_name}</p>}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`chip capitalize ${SEV_STYLES[report.severity]}`}>{report.severity}</span>
              <span className="chip-slate capitalize">{report.status}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-leaf-500 hover:text-leaf-900 text-2xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-5">
          {report.image_path && (
            <img src={uploadUrl(report.image_path)} alt="Outbreak" className="w-full rounded-2xl max-h-72 object-cover" />
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <Row label="Crop" value={report.crop_affected || '—'} />
            <Row label="Area" value={report.estimated_area_hectares ? `${report.estimated_area_hectares} ha` : '—'} />
            <Row label="Region" value={report.region || '—'} />
            <Row label="Date" value={new Date(report.created_at).toLocaleString()} />
            <Row label="Coordinates" value={`${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`} mono />
          </div>

          {report.description && (
            <div>
              <p className="label">Description</p>
              <p className="text-sm text-leaf-800 bg-leaf-50 p-3 rounded-2xl leading-relaxed">{report.description}</p>
            </div>
          )}

          <div className="border-t border-leaf-100 pt-5 flex gap-2 justify-end flex-wrap">
            {report.status === 'active' && (
              <button onClick={onResolve} className="btn-secondary">
                <CheckCircle2 size={14} /> Mark resolved
              </button>
            )}
            <button onClick={onDelete} className="btn-danger">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, mono }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-leaf-500">{label}</p>
      <p className={`text-leaf-900 mt-0.5 ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
    </div>
  )
}