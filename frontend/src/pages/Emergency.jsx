import { useEffect, useState } from 'react'
import {
  PhoneCall, MessageCircle, Plus, AlertTriangle, Shield, MapPin,
  Trash2, Loader2, X, Edit2, User, Building2, Clock,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { contactsApi } from '../lib/api'
import ConfirmModal from '../components/ConfirmModal.jsx'

// Background image for the emergency section header
const BG_IMAGE = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=70'

// Official emergency hotlines / agricultural support contacts (Zimbabwe)
const OFFICIAL_CONTACTS = [
  {
    name: 'Plant Protection Office',
    role: 'Department of Research & Specialist Services',
    phone: '+26324123456',
    description: 'For confirmed major pest outbreaks (locusts, armyworms in plague numbers, fall armyworm).',
    whatsapp: true,
  },
  {
    name: 'Agritex Extension Service',
    role: 'Local agricultural advice',
    phone: '+263771234567',
    description: 'Agricultural extension officers offer field advice and pest control recommendations.',
    whatsapp: true,
  },
  {
    name: 'National Pest Hotline',
    role: '24/7 Emergency Line',
    phone: '08001234',
    description: 'Toll-free national line for emergency pest situations after hours.',
    whatsapp: false,
  },
]

// Strip non-digits for tel/whatsapp links
function cleanNumber(num) {
  return (num || '').replace(/[^\d+]/g, '')
}
function waNumber(num) {
  // wa.me expects digits only, no leading + or 00
  return (num || '').replace(/[^\d]/g, '')
}

export default function Emergency() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null | 'new' | contact object
  const [confirmState, setConfirmState] = useState(null)

  const load = () => {
    setLoading(true)
    contactsApi.list()
      .then(({ contacts }) => setContacts(contacts))
      .catch(() => toast.error('Failed to load your contacts'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleDelete = (id) => {
    setConfirmState({
      title: 'Remove this contact?',
      message: 'This emergency contact will be removed from your list.',
      confirmLabel: 'Remove',
      onConfirm: async () => {
        try { await contactsApi.delete(id); toast.success('Contact removed'); load() }
        catch { toast.error('Failed to remove') }
      },
    })
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero banner with background image */}
      <section className="relative overflow-hidden rounded-3xl border border-ember-200 shadow-lifted">
        <div className="absolute inset-0">
          <img src={BG_IMAGE} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-ember-700/90 via-ember-600/80 to-earth-700/60" />
        </div>
        <div className="relative p-8 lg:p-10 text-white">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
              <Shield size={28} />
            </div>
            <div>
              <h1 className="font-display text-4xl lg:text-5xl font-bold leading-tight">
                Emergency & Assistance
              </h1>
              <p className="text-white/90 mt-2 text-lg max-w-2xl">
                Immediate support for large-scale pest outbreaks in Zimbabwe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Alert banner */}
      <div className="card p-4 bg-ember-50 border-ember-200 flex items-start gap-3">
        <AlertTriangle size={18} className="text-ember-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-ember-900">
          In a pest emergency, <strong>act within 24 hours</strong>. Early reporting and
          coordinated action save neighbouring farms.
        </p>
      </div>

      {/* Official contacts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-leaf-900 flex items-center gap-2">
              <PhoneCall size={20} className="text-ember-600" />
              Emergency Contacts
            </h2>
            <p className="text-sm text-leaf-600 mt-0.5">Tap to call or send a WhatsApp message</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {OFFICIAL_CONTACTS.map((c) => (
            <div key={c.name} className="card-padded">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-ember-100 text-ember-700 flex items-center justify-center flex-shrink-0">
                  <Building2 size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-leaf-900">{c.name}</h3>
                  <p className="text-xs uppercase tracking-wider text-leaf-500 font-semibold mt-0.5">{c.role}</p>
                  <p className="text-sm text-leaf-700 mt-2 leading-relaxed">{c.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <a href={`tel:${cleanNumber(c.phone)}`} className="btn-primary">
                  <PhoneCall size={14} /> {c.phone}
                </a>
                {c.whatsapp && (
                  <a href={`https://wa.me/${waNumber(c.phone)}`} target="_blank" rel="noopener noreferrer"
                    className="btn-whatsapp">
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Nearest Agritex office card */}
      <section>
        <div className="card-padded">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-leaf-100 text-leaf-700 flex items-center justify-center flex-shrink-0">
              <MapPin size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-xl font-bold text-leaf-900">Nearest Agritex Office</h3>
              <p className="text-sm text-leaf-600">Walk-in support available</p>
              <div className="mt-3 grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="label">Physical Address</p>
                  <p className="text-leaf-800">123 Agricultural Avenue, Harare</p>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Agritex+Harare"
                    target="_blank" rel="noopener noreferrer"
                    className="text-leaf-700 text-xs font-semibold hover:underline mt-1 inline-block">
                    Open in Google Maps →
                  </a>
                </div>
                <div>
                  <p className="label flex items-center gap-1"><Clock size={11} /> Office Hours</p>
                  <p className="text-leaf-800">Monday – Friday<br />8:00 AM – 4:30 PM</p>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-2xl bg-earth-50 border border-earth-100 text-xs text-earth-900">
                <strong>After hours?</strong> Call the National Pest Hotline — available 24/7 for emergencies.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* My contacts */}
      <section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="font-display text-2xl font-bold text-leaf-900 flex items-center gap-2">
              <User size={20} className="text-leaf-600" />
              My Contacts
            </h2>
            <p className="text-sm text-leaf-600 mt-0.5">
              Your trusted neighbours, local agronomists or agro-vets.
            </p>
          </div>
          <button onClick={() => setEditing('new')} className="btn-primary">
            <Plus size={14} /> Add contact
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-leaf-500 font-display text-xl">Loading…</div>
        ) : contacts.length === 0 ? (
          <div className="card-padded text-center py-12">
            <User size={36} className="mx-auto text-leaf-300 mb-3" />
            <p className="font-display text-lg text-leaf-700">No personal contacts yet</p>
            <p className="text-sm text-leaf-500 mt-1">Add someone you trust for quick access in an emergency.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {contacts.map(c => (
              <div key={c.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-leaf-100 text-leaf-700 flex items-center justify-center flex-shrink-0 font-display font-bold">
                    {c.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-leaf-900 truncate">{c.name}</p>
                    {c.role && <p className="text-xs text-leaf-500 truncate">{c.role}</p>}
                    {c.notes && <p className="text-xs text-leaf-600 mt-1 line-clamp-2">{c.notes}</p>}
                  </div>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <a href={`tel:${cleanNumber(c.phone)}`} className="btn-primary !px-3 !py-1.5 text-xs">
                    <PhoneCall size={12} /> Call
                  </a>
                  <a href={`https://wa.me/${waNumber(c.phone)}`} target="_blank" rel="noopener noreferrer"
                    className="btn-whatsapp !px-3 !py-1.5 text-xs">
                    <MessageCircle size={12} /> WhatsApp
                  </a>
                  <button onClick={() => setEditing(c)} className="btn-ghost !px-2 !py-1.5 text-xs">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => handleDelete(c.id)}
                    className="btn-ghost !px-2 !py-1.5 text-xs text-ember-600 hover:bg-ember-50">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {editing && (
        <ContactForm
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}

      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  )
}

function ContactForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    role: initial?.role || '',
    phone: initial?.phone || '',
    notes: initial?.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const isEdit = !!initial

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) { toast.error('Name and phone required'); return }
    setSaving(true)
    try {
      if (isEdit) await contactsApi.update(initial.id, form)
      else await contactsApi.create(form)
      toast.success(isEdit ? 'Contact updated' : 'Contact added')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-leaf-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-md w-full shadow-lifted" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-leaf-100 flex justify-between items-center">
          <h2 className="font-display text-2xl font-bold text-leaf-950">
            {isEdit ? 'Edit contact' : 'New contact'}
          </h2>
          <button onClick={onClose} className="text-leaf-500"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input" placeholder="e.g. James Moyo" />
          </div>
          <div>
            <label className="label">Role / Relationship</label>
            <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="input" placeholder="e.g. Neighbour, Agronomist" />
          </div>
          <div>
            <label className="label">Phone *</label>
            <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input" placeholder="+263 77 …" />
            <p className="text-xs text-leaf-500 mt-1">Include country code (e.g. +263) for WhatsApp to work.</p>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea rows="2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input resize-none" placeholder="Anything to remember?" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full py-3 text-base">
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> :
              <>{isEdit ? 'Update contact' : 'Add contact'}</>}
          </button>
        </form>
      </div>
    </div>
  )
}
