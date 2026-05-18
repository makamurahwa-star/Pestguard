import { useState, useEffect } from 'react'
import { Crosshair, Loader2, CheckCircle2, MapPin, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { PROVINCES, getTowns, getCoords } from '../lib/zimbabweLocations'

/**
 * Cascading location picker for Zimbabwe.
 *
 * The user selects:
 *   1. Province (required)
 *   2. Town within that province (optional but recommended)
 *
 * Behind the scenes we map (province, town) → approximate lat/lng so the
 * outbreak map and the rest of the backend keep working unchanged.
 *
 * "Use GPS" is still available for users who want pinpoint accuracy.
 *
 * Props:
 *   - latitude, longitude, region  (current form values)
 *   - onChange({ latitude, longitude, region })  called whenever location changes
 */
export default function LocationPicker({ latitude, longitude, region, onChange }) {
  const [locating, setLocating] = useState(false)
  const [usingGps, setUsingGps] = useState(false)
  const [province, setProvince] = useState('')
  const [town, setTown] = useState('')

  /**
   * On mount, try to reconstruct the province/town from the `region` field if it
   * looks like one of our known provinces. This way, if the user has the form
   * pre-filled (e.g. from their profile region), the dropdown reflects that.
   */
  useEffect(() => {
    if (region && PROVINCES.includes(region) && !province) {
      setProvince(region)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleProvinceChange = (newProvince) => {
    setProvince(newProvince)
    setTown('')                       // reset town when province changes
    setUsingGps(false)
    if (!newProvince) {
      onChange({ latitude: '', longitude: '', region: '' })
      return
    }
    // Set coords to the province centre — user can refine by picking a town
    const coords = getCoords(newProvince, null)
    onChange({
      latitude: coords.lat.toFixed(6),
      longitude: coords.lng.toFixed(6),
      region: newProvince,
    })
  }

  const handleTownChange = (newTown) => {
    setTown(newTown)
    setUsingGps(false)
    if (!province) return
    const coords = getCoords(province, newTown)
    onChange({
      latitude: coords.lat.toFixed(6),
      longitude: coords.lng.toFixed(6),
      region: province,             // keep `region` as the province name
    })
  }

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not available on this device')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
          region: region || province || '',
        })
        setUsingGps(true)
        toast.success('Current location captured')
        setLocating(false)
      },
      (err) => {
        toast.error('Could not get location: ' + err.message)
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const towns = getTowns(province)
  const hasLocation = latitude && longitude

  return (
    <div className="space-y-4">
      {/* ── Province ── */}
      <div>
        <label className="label">Province *</label>
        <div className="relative">
          <select
            required
            value={province}
            onChange={(e) => handleProvinceChange(e.target.value)}
            className="input appearance-none pr-9 cursor-pointer"
          >
            <option value="">Select a province</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-leaf-500 pointer-events-none" />
        </div>
      </div>

      {/* ── Town (only shows once province is picked) ── */}
      {province && (
        <div className="animate-fade-in">
          <label className="label">Town / area</label>
          <div className="relative">
            <select
              value={town}
              onChange={(e) => handleTownChange(e.target.value)}
              className="input appearance-none pr-9 cursor-pointer"
            >
              <option value="">— Whole province —</option>
              {towns.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-leaf-500 pointer-events-none" />
          </div>
          <p className="text-[11px] text-leaf-500 mt-1">
            Don't see your town? Pick the closest one or use GPS below.
          </p>
        </div>
      )}

      {/* ── Optional GPS for users who want pinpoint accuracy ── */}
      <div className="pt-2 border-t border-leaf-100">
        <p className="text-xs text-leaf-500 mb-2">Want to be more precise?</p>
        <button
          type="button"
          onClick={detectLocation}
          disabled={locating}
          className="btn-secondary w-full"
        >
          {locating ? (
            <><Loader2 size={16} className="animate-spin" /> Locating…</>
          ) : (
            <><Crosshair size={16} /> Use my current location (GPS)</>
          )}
        </button>
      </div>

      {/* ── Confirmation chip ── */}
      {hasLocation && (
        <div className="p-3 rounded-2xl bg-leaf-50 border border-leaf-200 text-xs text-leaf-800 flex items-start gap-2">
          <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0 text-leaf-600" />
          <div className="min-w-0">
            <p className="font-semibold">
              {usingGps ? 'Using GPS location' : (
                town ? `${town}, ${province}` : province || 'Location pinned'
              )}
            </p>
            <p className="font-mono text-[10px] text-leaf-600 mt-0.5">
              {parseFloat(latitude).toFixed(4)}, {parseFloat(longitude).toFixed(4)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
