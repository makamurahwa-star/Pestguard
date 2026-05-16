import { useState } from 'react'
import { User as UserIcon, Lock, Tractor, Loader2, Save, Eye, EyeOff, History as HistoryIcon, FileText, Bug } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { authApi } from '../lib/api'
import toast from 'react-hot-toast'

const ZIM_REGIONS = [
  'Harare', 'Bulawayo', 'Manicaland', 'Mashonaland Central',
  'Mashonaland East', 'Mashonaland West', 'Masvingo',
  'Matabeleland North', 'Matabeleland South', 'Midlands',
]

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    region: user?.region || '',
    farm_name: user?.farm_name || '',
    farm_size_hectares: user?.farm_size_hectares ?? '',
  })
  const [pw, setPw] = useState({ current_password: '', new_password: '' })
  const [showPw, setShowPw] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  const saveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const payload = { ...profile }
      if (payload.farm_size_hectares === '') payload.farm_size_hectares = null
      else payload.farm_size_hectares = parseFloat(payload.farm_size_hectares)
      const { user: updated } = await authApi.updateMe(payload)
      updateUser(updated)
      toast.success('Profile saved')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed')
    } finally { setSavingProfile(false) }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setSavingPw(true)
    try {
      await authApi.updateMe(pw)
      toast.success('Password changed')
      setPw({ current_password: '', new_password: '' })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed')
    } finally { setSavingPw(false) }
  }

  return (
    <div className="space-y-6 animate-fade-up max-w-5xl">
      <header>
        <p className="text-xs font-semibold text-leaf-600 uppercase tracking-[0.2em]">Your account</p>
        <h1 className="font-display text-4xl lg:text-5xl font-bold text-leaf-950 mt-1">Profile</h1>
        <p className="text-leaf-700 mt-2">Keep your details up to date.</p>
      </header>

      {/* Profile hero card */}
      <div className="card-padded bg-gradient-to-br from-leaf-50 via-canvas-warm to-earth-50 border-leaf-200">
        <div className="flex flex-wrap items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-leaf-700 text-leaf-50 flex items-center justify-center font-display font-bold text-3xl shadow-soft">
            {user?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-2xl font-bold text-leaf-950">{user?.full_name}</h2>
            <p className="text-sm text-leaf-700">{user?.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="chip-slate">@{user?.username}</span>
              {user?.region && <span className="chip-leaf">{user.region}</span>}
              {user?.farm_name && <span className="chip-earth">{user.farm_name}</span>}
              <span className="chip-slate">
                Member since {new Date(user?.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Profile form */}
        <form onSubmit={saveProfile} className="card-padded space-y-4">
          <h2 className="font-display text-xl font-bold text-leaf-900 flex items-center gap-2">
            <UserIcon size={18} /> Personal details
          </h2>

          <div>
            <label className="label">Full name</label>
            <input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="input" required />
          </div>
          <div>
            <label className="label">Phone</label>
            <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="input" placeholder="+263 77 …" />
          </div>
          <div>
            <label className="label">Region</label>
            <select value={profile.region} onChange={(e) => setProfile({ ...profile, region: e.target.value })} className="input">
              <option value="">Select region</option>
              {ZIM_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <hr className="border-leaf-100" />
          <h3 className="font-display font-bold text-leaf-900 flex items-center gap-2">
            <Tractor size={16} /> Farm details
          </h3>
          <div>
            <label className="label">Farm name</label>
            <input value={profile.farm_name} onChange={(e) => setProfile({ ...profile, farm_name: e.target.value })}
              className="input" placeholder="Greenfields" />
          </div>
          <div>
            <label className="label">Farm size (hectares)</label>
            <input type="number" step="0.1" min="0" value={profile.farm_size_hectares}
              onChange={(e) => setProfile({ ...profile, farm_size_hectares: e.target.value })}
              className="input" placeholder="5.5" />
          </div>

          <button type="submit" disabled={savingProfile} className="btn-primary w-full">
            {savingProfile ? <><Loader2 size={16} className="animate-spin" /> Saving…</> :
              <><Save size={16} /> Save changes</>}
          </button>
        </form>

        {/* Password form */}
        <form onSubmit={changePassword} className="card-padded space-y-4">
          <h2 className="font-display text-xl font-bold text-leaf-900 flex items-center gap-2">
            <Lock size={18} /> Change password
          </h2>
          <p className="text-sm text-leaf-600">At least 6 characters.</p>

          <div>
            <label className="label">Current password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={pw.current_password}
                onChange={(e) => setPw({ ...pw, current_password: e.target.value })}
                className="input pr-12" required />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-leaf-500 hover:text-leaf-700">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">New password</label>
            <input type={showPw ? 'text' : 'password'} value={pw.new_password}
              onChange={(e) => setPw({ ...pw, new_password: e.target.value })}
              className="input" minLength={6} required />
          </div>

          <button type="submit" disabled={savingPw} className="btn-primary w-full">
            {savingPw ? <><Loader2 size={16} className="animate-spin" /> Updating…</> :
              <><Lock size={16} /> Update password</>}
          </button>
        </form>
      </div>
    </div>
  )
}
