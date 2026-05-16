import axios from 'axios'

// In production, point at the deployed Render backend.
// In development, leave it empty so Vite's dev proxy handles /api → localhost:5000.
const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api'
const UPLOAD_BASE = (import.meta.env.VITE_API_URL || '')

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pestguard_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('pestguard_token')
      localStorage.removeItem('pestguard_user')
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export function uploadUrl(rel) {
  if (!rel) return null
  if (rel.startsWith('http')) return rel
  return `${UPLOAD_BASE}/uploads/${rel}`
}

export const authApi = {
  login:    (data) => api.post('/auth/login', data).then(r => r.data),
  register: (data) => api.post('/auth/register', data).then(r => r.data),
  me:       () => api.get('/auth/me').then(r => r.data),
  updateMe: (data) => api.put('/auth/me', data).then(r => r.data),
}

export const scansApi = {
  scan:   (file) => {
    const fd = new FormData()
    fd.append('image', file)
    return api.post('/scans', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
  },
  list:   () => api.get('/scans').then(r => r.data),
  get:    (id) => api.get(`/scans/${id}`).then(r => r.data),
  delete: (id) => api.delete(`/scans/${id}`).then(r => r.data),
}

export const reportsApi = {
  create: (data, imageFile) => {
    if (imageFile) {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== '') fd.append(k, v)
      })
      fd.append('image', imageFile)
      return api.post('/reports', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
    }
    return api.post('/reports', data).then(r => r.data)
  },
  list:   (params) => api.get('/reports', { params }).then(r => r.data),
  get:    (id) => api.get(`/reports/${id}`).then(r => r.data),
  update: (id, data) => api.put(`/reports/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/reports/${id}`).then(r => r.data),
  map:    (days) => api.get('/reports/map', { params: { days } }).then(r => r.data),
  stats:  (days) => api.get('/reports/stats', { params: { days } }).then(r => r.data),
}

export const contactsApi = {
  list:   () => api.get('/contacts').then(r => r.data),
  create: (data) => api.post('/contacts', data).then(r => r.data),
  update: (id, data) => api.put(`/contacts/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/contacts/${id}`).then(r => r.data),
}

export const pestdataApi = {
  all: () => api.get('/pestdata').then(r => r.data),
  one: (name) => api.get(`/pestdata/${encodeURIComponent(name)}`).then(r => r.data),
}

export const systemApi = {
  config: () => api.get('/config').then(r => r.data),
  health: () => api.get('/health').then(r => r.data),
}
