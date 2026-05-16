import { createContext, useContext, useEffect, useState } from 'react'
import { pestdataApi } from '../lib/api'

const PestDataContext = createContext(null)

export function PestDataProvider({ children }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    pestdataApi.all()
      .then(setData)
      .catch(() => setData({}))
      .finally(() => setLoading(false))
  }, [])

  /**
   * Look up a pest by its model class name.
   * Falls back to the `_meta.fallback` entry if not found.
   */
  const lookup = (className) => {
    if (!data || !className) return null
    // direct match
    if (data[className]) return { name: className, ...data[className] }
    // case-insensitive match
    const lower = className.toLowerCase()
    for (const key of Object.keys(data)) {
      if (key.toLowerCase() === lower) return { name: key, ...data[key] }
    }
    // fallback
    if (data._meta?.fallback) return { name: className, ...data._meta.fallback }
    return null
  }

  /** All real pest entries (no _meta) */
  const allPests = () => {
    if (!data) return []
    return Object.entries(data)
      .filter(([k]) => !k.startsWith('_'))
      .map(([k, v]) => ({ name: k, ...v }))
  }

  /**
   * Look up a cached pest image URL (set by the Learn page's PestImage
   * component when it fetches from Wikipedia). Returns null if there's no
   * cached image yet — caller should handle that gracefully.
   */
  const cachedImageUrl = (scientificName) => {
    if (!scientificName) return null
    try {
      const raw = localStorage.getItem(`pest_img:${scientificName}`)
      if (!raw) return null
      let parsed
      try { parsed = JSON.parse(raw) } catch { parsed = { url: raw } }
      if (parsed.url && parsed.url !== '__none__') return parsed.url
    } catch {}
    return null
  }

  return (
    <PestDataContext.Provider value={{ data, loading, lookup, allPests, cachedImageUrl }}>
      {children}
    </PestDataContext.Provider>
  )
}

export function usePestData() {
  const ctx = useContext(PestDataContext)
  if (!ctx) throw new Error('usePestData must be used inside PestDataProvider')
  return ctx
}