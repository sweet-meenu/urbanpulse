"use client"

import { useEffect, useState, useRef } from "react"
import { searchLocationsAction } from "@/app/actions/location-search"
import type { LocationSuggestion } from "@/lib/tomtom"
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
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [isSuggestLoading, setIsSuggestLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounceRef = useRef<number | null>(null)
  const [center, setCenter] = useState<[number, number] | null>(null)
  const [selectedSuggestion, setSelectedSuggestion] = useState<LocationSuggestion | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [routes, setRoutes] = useState<any[]>([])
  const [routesLoading, setRoutesLoading] = useState(false)
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)

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
          type IncidentRaw = {
            id?: string
            title?: string
            description?: string
            lat?: number | string
            lon?: number | string
            image?: string | null
          }

          const list = json.incidents.map((i: IncidentRaw) => ({
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
    // fallback single-result search (keeps original behaviour)
    if (!q || q.trim().length === 0) return
    try {
      const results = await searchLocationsAction(q)
      if (results && results.length > 0) {
        const r = results[0]
        setCenter([r.lat, r.lon])
      }
    } catch (err) {
      // ignore
      console.error("search error", err)
    }
  }

  // debounce suggestions when typing
  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
      debounceRef.current = null
    }

    if (!query || query.trim().length < 2) {
      setSuggestions([])
      setIsSuggestLoading(false)
      setActiveIndex(-1)
      return
    }

    setIsSuggestLoading(true)
    // debounce 250ms
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await searchLocationsAction(query)
        setSuggestions(res)
      } catch (err) {
        console.error("suggestions error", err)
        setSuggestions([])
      } finally {
        setIsSuggestLoading(false)
      }
    }, 250)

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [query])

  const handleSelect = (s: LocationSuggestion) => {
    setQuery(s.name)
    setSuggestions([])
    setActiveIndex(-1)
    setCenter([s.lat, s.lon])
    setSelectedSuggestion(s)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex])
      } else {
        void doSearch(query)
      }
    } else if (e.key === "Escape") {
      setSuggestions([])
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Maps — Incidents</h1>

      {!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN && (
        <div className="mb-4 p-3 rounded border bg-yellow-50 text-yellow-800">Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to enable Mapbox maps and search.</div>
      )}

      <div className="mb-4">
        <div className="relative flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search place or address"
            className="flex-1 px-3 py-2 border rounded"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={suggestions.length > 0}
            aria-controls="maps-suggestions-list"
            aria-activedescendant={activeIndex >= 0 ? `suggest-${activeIndex}` : undefined}
          />
          <button className="px-4 py-2 bg-slate-800 text-white rounded" onClick={() => void doSearch(query)}>Search</button>

          {suggestions.length > 0 && (
            <ul id="maps-suggestions-list" className="absolute left-0 right-0 top-full mt-1 bg-white border rounded shadow z-50 max-h-60 overflow-auto">
              {suggestions.map((s, idx) => (
                <li
                  id={`suggest-${idx}`}
                  key={s.id}
                  className={`px-3 py-2 cursor-pointer hover:bg-slate-100 ${idx === activeIndex ? "bg-slate-100" : ""}`}
                  onMouseDown={(e) => {
                    // prevent blur before click
                    e.preventDefault()
                    handleSelect(s)
                  }}
                >
                  <div className="font-medium">{s.name}</div>
                  {s.address && <div className="text-sm text-slate-600">{s.address}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
        {isSuggestLoading && <div className="text-sm text-slate-500 mt-1">Searching…</div>}
      </div>

      <div className="mb-4">{loading ? <div>Loading incidents…</div> : <div>{incidents.length} incidents</div>}</div>

      {selectedSuggestion && (
        <div className="mb-4 p-3 border rounded bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Selected: {selectedSuggestion.name}</div>
              {selectedSuggestion.address && <div className="text-sm text-slate-600">{selectedSuggestion.address}</div>}
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 bg-slate-800 text-white rounded"
                onClick={async () => {
                  // calculate routes from user's current location (if available) to selectedSuggestion
                  setRoutesLoading(true)
                  try {
                    const getCurrent = () => new Promise<GeolocationPosition | null>((resolve) => {
                      if (!navigator.geolocation) return resolve(null)
                      navigator.geolocation.getCurrentPosition((pos) => resolve(pos), () => resolve(null), { timeout: 5000 })
                    })
                    const pos = await getCurrent()
                    let origLat: number | undefined
                    let origLon: number | undefined
                    if (pos) {
                      origLat = pos.coords.latitude
                      origLon = pos.coords.longitude
                    } else if (center) {
                      origLat = center[0]
                      origLon = center[1]
                    } else if (incidents.length) {
                      origLat = incidents[0].lat
                      origLon = incidents[0].lon
                    }

                    if (!origLat || !origLon) throw new Error("No origin available")

                    const destLat = selectedSuggestion.lat
                    const destLon = selectedSuggestion.lon
                    const url = `/api/tomtom-route?origLat=${origLat}&origLon=${origLon}&destLat=${destLat}&destLon=${destLon}&maxAlternatives=2&routeRepresentation=polyline&computeTravelTimeFor=all`
                    const res = await fetch(url)
                    const json = await res.json()
                    if (!json?.ok) throw new Error(json?.error || "TomTom error")
                    const payload = json.data || {}
                    const tomRoutes = Array.isArray(payload.routes) ? payload.routes : []

                    // flatten legs to points and create ids
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const normalized = tomRoutes.map((r: any, i: number) => {
                      const pts: Array<[number, number]> = []
                      try {
                        for (const leg of (r.legs || [])) {
                          if (Array.isArray(leg.points)) {
                            for (const p of leg.points) {
                              if (p && typeof p.latitude === "number" && typeof p.longitude === "number") pts.push([p.latitude, p.longitude])
                            }
                          }
                        }
                      } catch {
                        // ignore
                      }
                      return {
                        id: `route-${i}`,
                        originalIndex: i,
                        summary: r.summary || {},
                        routeType: r.routeType || undefined,
                        legs: r.legs || [],
                        points: pts,
                        raw: r,
                      }
                    })
                    setRoutes(normalized)
                    setSelectedRouteId(null)
                  } catch (err) {
                    console.error("routes error", err)
                  } finally {
                    setRoutesLoading(false)
                  }
                }}
              >
                View Routes
              </button>
              <button className="px-3 py-1 border rounded" onClick={() => { setSelectedSuggestion(null); setSuggestions([]); setQuery("") }}>Clear</button>
            </div>
          </div>
        </div>
      )}

      <MapView incidents={incidents} center={center} routes={routes} selectedRouteId={selectedRouteId} onSelectRoute={(id) => setSelectedRouteId(id)} />

      {routesLoading && <div className="mt-3">Calculating routes…</div>}

      {routes.length > 0 && (
        <div className="mt-4 bg-white p-3 rounded border shadow-sm">
          <h2 className="font-semibold mb-2">Routes</h2>
          <div className="flex flex-col gap-2">
            {routes.map((r) => (
              <div key={r.id} className="p-2 border rounded flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.routeType ?? "Route"} — {(r.summary?.lengthInMeters ?? 0) / 1000.0 >= 1 ? `${((r.summary?.lengthInMeters ?? 0)/1000).toFixed(1)} km` : `${Math.round(r.summary?.lengthInMeters ?? 0)} m`}</div>
                  <div className="text-sm text-slate-600">ETA: {Math.round((r.summary?.travelTimeInSeconds ?? 0) / 60)} min · Delay: {r.summary?.trafficDelayInSeconds ?? 0}s</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-2 py-1 bg-slate-800 text-white rounded" onClick={() => setSelectedRouteId(r.id)}>Show</button>
                  <button className="px-2 py-1 border rounded" onClick={() => setSelectedRouteId(r.id)}>Zoom</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
