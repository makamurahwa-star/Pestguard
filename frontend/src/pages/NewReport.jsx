import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  ArrowLeft, MapPin, X, Loader2,
  AlertTriangle, Camera, ImageIcon,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { reportsApi, systemApi } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import { usePestData } from '../context/PestDataContext.jsx'
import LocationPicker from '../components/LocationPicker.jsx'

const SEVERITIES = [
  { value: 'low',      label: 'Low',      desc: 'Few pests, isolated',           color: 'bg-leaf-100 text-leaf-800 border-leaf-300' },
  { value: 'medium',   label: 'Medium',   desc: 'Spreading, visible damage',     color: 'bg-earth-100 text-earth-800 border-earth-300' },
  { value: 'high',     label: 'High',     desc: 'Widespread, significant loss',  color: 'bg-ember-100 text-ember-700 border-ember-300' },
  { value: 'critical', label: 'Critical', desc: 'Entire field at risk',          color: 'bg-ember-600 text-white border-ember-700' },
]
const CROPS = ['Maize', 'Tomato', 'Cotton', 'Cabbage', 'Beans', 'Sweet potato', 'Tobacco', 'Onion', 'Pepper', 'Sorghum', 'Wheat', 'Soybean', 'Groundnut', 'Other']

/**
 * Resolve a Wikipedia thumbnail URL for the given scientific name.
 * Tries the cache first; if nothing's there, hits Wikipedia's REST API
 * directly. Returns null if no image can be found.
 */
async function resolvePestImageUrl(scientificName, cachedImageUrl) {
  if (!scientificName) return null
  const cached = cachedImageUrl(scientificName)
  if (cached) return cached
  try {
    const title = encodeURIComponent(scientificName.split(' ').slice(0, 2).join(' '))
    const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`)
    if (!r.ok) return null
    const data = await r.json()
    const thumb = data?.thumbnail?.source || data?.originalimage?.source
    if (!thumb) return null
    const upgraded = thumb.replace(/\/\d+px-/, '/320px-')
    // Cache it so future calls (and the Learn page) don't refetch
    try {
      localStorage.setItem(`pest_img:${scientificName}`,
        JSON.stringify({ url: upgraded, ts: Date.now() }))
    } catch {}
    return upgraded
  } catch {
    return null
  }
}

export default function NewReport() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { lookup, cachedImageUrl } = usePestData()
  const fileRef = useRef(null)
  const cameraRef = useRef(null)

  const prefill = location.state || {}
  const [classes, setClasses] = useState([])

  const [form, setForm] = useState({
    pest_class: prefill.pest_class || '',
    severity: '',
    crop_affected: '',
    estimated_area_hectares: '',
    latitude: '',
    longitude: '',
    region: user?.region || '',
    description: '',
    scan_id: prefill.scan_id || null,
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    systemApi.config().then(c => setClasses(c.class_names || [])).catch(() => {})
  }, [])

  useEffect(() => () => imagePreview && URL.revokeObjectURL(imagePreview), [imagePreview])

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  /**
   * Handler for the LocationPicker — updates the three location fields at once.
   */
  const handleLocationChange = ({ latitude, longitude, region }) => {
    setForm((f) => ({ ...f, latitude, longitude, region }))
  }

  const handleFile = (f) => {
    if (!f || !f.type?.startsWith('image/')) return
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(f)
    setImagePreview(URL.createObjectURL(f))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    if (!form.pest_class || !form.severity || !form.latitude || !form.longitude) {
      toast.error('Pest, severity and location are required')
      return
    }
    setSubmitting(true)
    try {
      // If the user didn't attach their own photo, try to auto-attach a
      // reference image of the pest from Wikipedia. Every report on the
      // Detection Map and Reported Outbreaks tab will get a visual this way,
      // even when the farmer didn't take a photo themselves.
      let imageToSend = imageFile
      if (!imageToSend && pestInfo?.scientific_name) {
        const url = await resolvePestImageUrl(pestInfo.scientific_name, cachedImageUrl)
        if (url) {
          try {
            const r = await fetch(url)
            if (r.ok) {
              const blob = await r.blob()
              const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
              imageToSend = new File([blob], `${pestInfo.scientific_name}.${ext}`, { type: blob.type })
            }
          } catch { /* fall through — submit without an image */ }
        }
      }
      await reportsApi.create(form, imageToSend)
      toast.success('Outbreak reported!')
      navigate('/reports')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  const pestInfo = form.pest_class ? lookup(form.pest_class) : null

  return (
    <div className="space-y-6 animate-fade-up max-w-5xl">
      <Link to="/reports" className="inline-flex items-center gap-1 text-sm text-leaf-600 hover:text-leaf-900">
        <ArrowLeft size={14} /> Back to reports
      </Link>

      <header>
        <p className="text-xs font-semibold text-leaf-600 uppercase tracking-[0.2em]">Reporting</p>
        <h1 className="font-display text-4xl lg:text-5xl font-bold text-leaf-950 mt-1">
          Report an outbreak
        </h1>
        <p className="text-leaf-700 mt-2 max-w-2xl">
          Your report instantly appears on the Detection Map and in the Reported Outbreaks
          tab in Learn, so other farmers nearby get a heads up.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Pest class */}
          <section className="card-padded">
            <h2 className="font-display text-lg font-bold text-leaf-900 mb-3">Which pest?</h2>
            <select required value={form.pest_class} onChange={update('pest_class')} className="input">
              <option value="">Select a pest</option>
              {classes.map(c => {
                const info = lookup(c)
                return (
                  <option key={c} value={c}>
                    {info?.friendly_name || c}{info?.scientific_name ? ` — ${info.scientific_name}` : ''}
                  </option>
                )
              })}
            </select>
            {pestInfo && (
              <p className="mt-3 text-sm text-leaf-700 bg-leaf-50 p-3 rounded-2xl border border-leaf-100">
                <strong>{pestInfo.friendly_name}</strong>
                {pestInfo.scientific_name && <em className="text-leaf-600"> ({pestInfo.scientific_name})</em>}
                {pestInfo.description && <> — {pestInfo.description}</>}
              </p>
            )}
          </section>

          {/* Severity */}
          <section className="card-padded">
            <h2 className="font-display text-lg font-bold text-leaf-900 mb-3">How severe?</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {SEVERITIES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setForm({ ...form, severity: s.value })}
                  className={`p-3 rounded-2xl border-2 transition-all text-left
                    ${form.severity === s.value ? s.color + ' shadow-soft' : 'border-leaf-200 bg-white hover:border-leaf-300'}`}
                >
                  <p className="font-display font-bold">{s.label}</p>
                  <p className="text-[11px] mt-1 leading-snug opacity-80">{s.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Crop & description */}
          <section className="card-padded">
            <h2 className="font-display text-lg font-bold text-leaf-900 mb-3">Field details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Crop affected</label>
                <select value={form.crop_affected} onChange={update('crop_affected')} className="input">
                  <option value="">Select crop</option>
                  {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Area affected (ha)</label>
                <input type="number" step="0.1" min="0" value={form.estimated_area_hectares}
                  onChange={update('estimated_area_hectares')} className="input" placeholder="0.5" />
              </div>
              <div className="col-span-2">
                <label className="label">Description (optional)</label>
                <textarea rows="3" value={form.description} onChange={update('description')}
                  className="input resize-none"
                  placeholder="What are you seeing? When did it start? Any treatments tried?" />
              </div>
            </div>
          </section>

          {/* Photo */}
          <section className="card-padded">
            <h2 className="font-display text-lg font-bold text-leaf-900 mb-3">Photo (optional)</h2>
            {!imagePreview ? (
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => cameraRef.current?.click()}
                  className="p-5 rounded-2xl border-2 border-leaf-200 bg-leaf-50 hover:bg-leaf-100 transition flex flex-col items-center gap-2">
                  <Camera size={28} className="text-leaf-700" />
                  <span className="text-sm font-semibold text-leaf-800">Use Camera</span>
                </button>
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="p-5 rounded-2xl border-2 border-earth-200 bg-earth-50 hover:bg-earth-100 transition flex flex-col items-center gap-2">
                  <ImageIcon size={28} className="text-earth-700" />
                  <span className="text-sm font-semibold text-earth-800">From Gallery</span>
                </button>
              </div>
            ) : (
              <div className="relative">
                <img src={imagePreview} alt="Outbreak" className="w-full max-h-80 object-contain rounded-2xl bg-leaf-950" />
                <button type="button" onClick={() => { URL.revokeObjectURL(imagePreview); setImagePreview(null); setImageFile(null) }}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 shadow flex items-center justify-center text-leaf-700">
                  <X size={18} />
                </button>
              </div>
            )}
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden
              onChange={(e) => handleFile(e.target.files?.[0])} />
            <input ref={fileRef} type="file" accept="image/*" hidden
              onChange={(e) => handleFile(e.target.files?.[0])} />
          </section>
        </div>

        {/* Location & submit */}
        <aside className="lg:col-span-1">
          <div className="card-padded sticky top-24 space-y-4">
            <h2 className="font-display text-lg font-bold text-leaf-900 flex items-center gap-2">
              <MapPin size={18} /> Location
            </h2>

            <LocationPicker
              latitude={form.latitude}
              longitude={form.longitude}
              region={form.region}
              onChange={handleLocationChange}
            />

            <hr className="border-leaf-100" />

            <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-base">
              {submitting ? <><Loader2 size={18} className="animate-spin" /> Submitting…</> :
                <><AlertTriangle size={18} /> Submit report</>}
            </button>
          </div>
        </aside>
      </form>
    </div>
  )
}
