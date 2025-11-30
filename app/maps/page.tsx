"use client"

import { useEffect, useState } from "react"
import MapView from "@/components/ui/map-view"

type Incident = {
  id?: string
  title?: string
  description?: string
  lat: number
  lon: number
  image?: string | null
}

export default function MapsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [center, setCenter] = useState<[number, number] | null>(null)

  useEffect(() => {
    let mounted = true
    const fetchInc = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/incidents")
        const json = await res.json()
        if (!mounted) return
        if (json?.ok && Array.isArray(json.incidents)) {
          // normalize lat/lon
          const list = json.incidents.map((i: any) => ({
            id: i.id,
            title: i.title,
            description: i.description,
            lat: Number(i.lat) || 0,
            lon: Number(i.lon) || 0,
            image: i.image ?? null,
          }))
          setIncidents(list)
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void fetchInc()
    return () => {
      mounted = false
    }
  }, [])

  const doSearch = async (q: string) => {
    if (!q || q.trim().length === 0) return
    const token = process.env.NEXT_PUBLIC_TOMTOM_API_KEY
    if (!token) return
    try {
      // Use TomTom Search API
      const url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(q)}.json?key=${token}&limit=1`
      const res = await fetch(url)
      const j = await res.json()
      if (j?.results && j.results.length > 0) {
        const r = j.results[0]
        const lat = Number(r.position?.lat)
        const lon = Number(r.position?.lon)
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) setCenter([lon, lat])
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Maps — Incidents</h1>

      {!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN && (
        <div className="mb-4 p-3 rounded border bg-yellow-50 text-yellow-800">Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to enable Mapbox maps and search.</div>
      )}

      <div className="mb-4 flex gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search place or address" className="flex-1 px-3 py-2 border rounded" />
        <button className="px-4 py-2 bg-slate-800 text-white rounded" onClick={() => doSearch(query)}>Search</button>
      </div>

      <div className="mb-4">{loading ? <div>Loading incidents…</div> : <div>{incidents.length} incidents</div>}</div>

      <MapView incidents={incidents} center={center} />
    </div>
  )
}
