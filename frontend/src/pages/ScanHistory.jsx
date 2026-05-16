import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  History as HistoryIcon, Camera, Calendar, Trash2, X, ArrowRight, Bug,
} from 'lucide-react'
import { scansApi, uploadUrl } from '../lib/api'
import { usePestData } from '../context/PestDataContext.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'
import toast from 'react-hot-toast'

export default function ScanHistory() {
  const { lookup } = usePestData()
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [confirmState, setConfirmState] = useState(null)

  const load = () => {
    setLoading(true)
    scansApi.list()
      .then(({ scans }) => setScans(scans))
      .catch(() => toast.error('Failed to load scans'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleDelete = (id) => {
    setConfirmState({
      title: 'Delete this scan?',
      message: 'This scan and its image will be permanently removed. This cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await scansApi.delete(id)
          toast.success('Scan deleted')
          setSelected(null)
          load()
        } catch { toast.error('Failed to delete') }
      },
    })
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <p className="text-xs font-semibold text-leaf-600 uppercase tracking-[0.2em]">Past activity</p>
        <h1 className="font-display text-4xl lg:text-5xl font-bold text-leaf-950 mt-1">Scan history</h1>
        <p className="text-leaf-700 mt-2 max-w-2xl">
          Every pest identification you've run, with the AI's confidence level.
        </p>
      </header>

      {loading ? (
        <div className="text-center py-12 text-leaf-500 font-display text-xl">Loading…</div>
      ) : scans.length === 0 ? (
        <div className="card-padded text-center py-16">
          <div className="w-20 h-20 rounded-3xl bg-leaf-100 mx-auto flex items-center justify-center mb-4">
            <HistoryIcon size={32} className="text-leaf-500" />
          </div>
          <h3 className="font-display text-2xl font-bold text-leaf-900">No scans yet</h3>
          <p className="text-leaf-600 mt-2 max-w-md mx-auto">
            Identify your first pest and it'll show up here.
          </p>
          <Link to="/check" className="btn-primary mt-6 inline-flex">
            <Camera size={16} /> Check a pest <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {scans.map((scan) => {
            const info = lookup(scan.predicted_class)
            const conf = (scan.confidence * 100).toFixed(0)
            return (
              <button key={scan.id} onClick={() => setSelected({ scan, info })}
                className="card overflow-hidden hover:shadow-lifted hover:-translate-y-0.5 transition-all text-left group">
                <div className="aspect-square bg-leaf-100 relative overflow-hidden">
                  <img src={uploadUrl(scan.image_path)} alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className="absolute top-2 right-2 px-2 py-1 rounded-full bg-white/95 text-[10px] font-mono font-bold text-leaf-900 shadow">
                    {conf}%
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="font-display font-bold text-leaf-900 truncate">
                    {info?.friendly_name || scan.predicted_class}
                  </h3>
                  <p className="text-xs text-leaf-500 mt-1 flex items-center gap-1">
                    <Calendar size={11} /> {new Date(scan.created_at).toLocaleDateString()}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {selected && <DetailModal {...selected}
        onClose={() => setSelected(null)}
        onDelete={() => handleDelete(selected.scan.id)} />}

      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  )
}

function DetailModal({ scan, info, onClose, onDelete }) {
  const conf = (scan.confidence * 100).toFixed(1)
  const sorted = Object.entries(scan.all_predictions || {}).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-leaf-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lifted" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-leaf-100 flex justify-between items-start">
          <div>
            <h2 className="font-display text-2xl font-bold text-leaf-950">
              {info?.friendly_name || scan.predicted_class}
            </h2>
            {info?.scientific_name && <p className="text-sm italic text-leaf-600">{info.scientific_name}</p>}
            <p className="text-xs text-leaf-500 mt-1">{new Date(scan.created_at).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="text-leaf-500 hover:text-leaf-900"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          <img src={uploadUrl(scan.image_path)} alt="" className="w-full max-h-96 object-contain rounded-2xl bg-leaf-100" />

          <div>
            <p className="label">Confidence</p>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-4xl font-bold text-leaf-900">{conf}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-leaf-100 overflow-hidden">
              <div className="h-full rounded-full bg-leaf-700" style={{ width: `${conf}%` }} />
            </div>
          </div>

          {info?.description && (
            <div>
              <p className="label">About</p>
              <p className="text-sm text-leaf-800 leading-relaxed">{info.description}</p>
            </div>
          )}

          <div>
            <p className="label">Top predictions</p>
            <div className="space-y-2">
              {sorted.map(([name, p], i) => (
                <div key={name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={i === 0 ? 'font-bold' : ''}>{i + 1}. {name}</span>
                    <span className="font-mono text-leaf-600">{(p * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-leaf-100">
                    <div className="h-full rounded-full bg-leaf-600" style={{ width: `${p * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-leaf-100 pt-4 flex justify-end">
            <button onClick={onDelete} className="btn-danger">
              <Trash2 size={14} /> Delete scan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
