"use client"

import { useEffect, useState } from "react"
import { getAllIncidents, pulseIncident } from "@/lib/firebase-admin"
import { IconHeartbeat } from "@tabler/icons-react"

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180
  const R = 6371 // km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default function CommunityPage() {
  const [incidents, setIncidents] = useState<any[] | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)

  async function fetchAll() {
    try {
      const all = await getAllIncidents()
      setIncidents(all)
    } catch (e) {
      console.warn(e)
    }
  }

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((p) => setCoords({ lat: p.coords.latitude, lon: p.coords.longitude }), () => setCoords(null))
    fetchAll()
  }, [])

  const handlePulse = async (id: string) => {
    try {
      await pulseIncident(id)
      fetchAll()
    } catch (e) {
      console.warn(e)
    }
  }

  const sorted = (incidents || []).map((it) => ({ ...it, distance: coords ? haversine(coords.lat, coords.lon, it.location?.lat ?? 0, it.location?.lon ?? 0) : null }))
    .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999))

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Community Incidents</h1>
      {!incidents ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-4">
          {sorted.map((r: any) => (
            <div key={r.id} className="p-4 border rounded-lg flex gap-4 items-start">
              <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                {r.images?.[0] ? <img src={r.images[0]} alt="thumb" className="w-full h-full object-cover" /> : <div className="text-sm text-muted">No image</div>}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm text-muted">{r.type}</div>
                    <div className="font-medium">{r.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <IconHeartbeat className="w-5 h-5 text-red-500" />
                      <div>{r.pulses ?? 0}</div>
                    </div>
                    <button onClick={() => handlePulse(r.id)} className="mt-2 px-3 py-1 rounded border">Pulse</button>
                  </div>
                </div>
                <div className="text-xs text-[hsl(var(--muted-foreground))] mt-2">{r.location?.name} {r.distance !== null && r.distance !== undefined ? `· ${r.distance.toFixed(1)} km` : ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
