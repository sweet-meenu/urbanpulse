"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import ReactDOM from "react-dom/client"

type Incident = {
  id?: string
  title?: string
  description?: string
  lat: number
  lon: number
  image?: string | null
  createdAt?: string | number
}

type MapViewProps = {
  incidents?: Incident[]
  className?: string
  center?: [number, number] | null
  routes?: Array<{
    id: string
    routeType?: string
    summary?: { lengthInMeters?: number; travelTimeInSeconds?: number }
    points: Array<[number, number]> // [lat, lon]
  }>
  selectedRouteId?: string | null
  onSelectRoute?: (id: string) => void
  origin?: { lat: number; lon: number; name: string } | null
  destination?: { lat: number; lon: number; name: string } | null
}

// Custom SVG icon for current location (blue pulsing dot)
const createOriginIcon = () => {
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 bg-blue-500 rounded-full opacity-25 animate-ping"></div>
        <div class="relative w-6 h-6 bg-blue-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="white">
            <circle cx="12" cy="12" r="8"/>
          </svg>
        </div>
      </div>
    `,
    className: 'custom-origin-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

// Custom SVG icon for destination (red map pin)
const createDestinationIcon = () => {
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48" class="drop-shadow-lg">
          <path d="M20 0C8.954 0 0 8.954 0 20c0 14 20 28 20 28s20-14 20-28C40 8.954 31.046 0 20 0z" fill="#EF4444"/>
          <circle cx="20" cy="20" r="8" fill="white"/>
          <circle cx="20" cy="20" r="5" fill="#DC2626"/>
        </svg>
      </div>
    `,
    className: 'custom-destination-marker',
    iconSize: [40, 48],
    iconAnchor: [20, 48],
  })
}

// Custom SVG icon for incidents (orange warning)
const createIncidentIcon = () => {
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" class="drop-shadow-md">
          <circle cx="16" cy="16" r="14" fill="#F97316" stroke="white" stroke-width="2"/>
          <path d="M16 10v8M16 22v2" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </div>
    `,
    className: 'custom-incident-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

export default function MapView({ 
  incidents = [], 
  className = "h-[600px] w-full", 
  center = null, 
  routes = [], 
  selectedRouteId = null, 
  onSelectRoute,
  origin = null,
  destination = null,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Layer[]>([])
  const routesRef = useRef<L.Polyline[]>([])
  const originMarkerRef = useRef<L.Marker | null>(null)
  const destinationMarkerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // initialize map
    const map = L.map(containerRef.current, {
      center: center ?? (incidents.length ? [incidents[0].lat, incidents[0].lon] : [0, 0]),
      zoom: incidents.length || center ? 13 : 2,
    })
  mapRef.current = map

    // expose map for external callers (minimal integration)
    try {
      // @ts-ignore
      ;(window as any).__URBANPULSE_LEAFLET_MAP = map
    } catch {
      // ignore
    }

    // TomTom raster tiles with host cycling via subdomains
    const tomtomKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY || ""
    const tileUrl = `https://{s}.api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${tomtomKey}`
    L.tileLayer(tileUrl, {
      subdomains: ["a", "b", "c", "d"],
      tileSize: 256,
      maxZoom: 22,
      attribution: '© TomTom'
    }).addTo(map)

  // add controls
    L.control.zoom({ position: "topright" }).addTo(map)
    L.control.scale().addTo(map)

    // geolocate: simple control that centers map on the browser location
    const locate = () => {
      map.locate({ setView: true, maxZoom: 14 })
    }

    // add a small custom locate button
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const locateBtn = (L.control as any)({ position: "topright" })
  /* eslint-enable @typescript-eslint/no-explicit-any */
    locateBtn.onAdd = function () {
      const el = L.DomUtil.create("button", "rounded bg-white p-2 shadow border")
      el.innerHTML = "📍"
      el.style.cursor = "pointer"
      el.onclick = () => locate()
      return el
    }
    locateBtn.addTo(map)

    return () => {
      // cleanup
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      routesRef.current.forEach((r) => r.remove())
      routesRef.current = []
      try {
        // @ts-ignore
        delete (window as any).__URBANPULSE_LEAFLET_MAP
      } catch {
        // ignore
      }
      map.remove()
      mapRef.current = null
    }
  }, [center, incidents])

  // update markers when incidents change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // remove existing markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    incidents.forEach((inc) => {
      if (!inc || typeof inc.lat !== "number" || typeof inc.lon !== "number") return

      const marker = L.marker([inc.lat, inc.lon], { icon: createIncidentIcon() })
      marker.addTo(map)

      // create popup container and render a small React component into it
      const popupContainer = document.createElement("div")
      popupContainer.className = "max-w-xs"

      const popupContent = (
        <div className="p-3 space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 mt-1.5 rounded-full bg-orange-500 shrink-0"></div>
            <div className="flex-1">
              <div className="font-semibold text-sm mb-1">{inc.title ?? "Incident"}</div>
              <div className="text-xs text-slate-600">{inc.description ?? "No details"}</div>
            </div>
          </div>
          {inc.image && (
            <div className="rounded-md overflow-hidden">
              <img src={inc.image} alt="incident" className="w-full h-32 object-cover" />
            </div>
          )}
          <div className="flex justify-end pt-1">
            <a 
              href={`/incidents/${inc.id ?? ""}`} 
              className="text-xs px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md transition-colors"
            >
              View Details
            </a>
          </div>
        </div>
      )

      try {
        // render React into popup container
        const root = ReactDOM.createRoot(popupContainer)
        root.render(popupContent)
      } catch {
        // fallback: simple html
        popupContainer.innerHTML = `<div><strong>${inc.title ?? "Incident"}</strong><div>${inc.description ?? ""}</div></div>`
      }

      marker.bindPopup(popupContainer, {
        maxWidth: 300,
        className: 'custom-popup'
      })
      markersRef.current.push(marker)
    })
  }, [incidents])

  // update origin marker
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // remove existing origin marker
    if (originMarkerRef.current) {
      originMarkerRef.current.remove()
      originMarkerRef.current = null
    }

    if (origin) {
      const marker = L.marker([origin.lat, origin.lon], { icon: createOriginIcon() })
      marker.addTo(map)
      marker.bindTooltip(origin.name || "Current Location", {
        permanent: false,
        direction: 'top',
        className: 'custom-tooltip'
      })
      originMarkerRef.current = marker
    }
  }, [origin])

  // update destination marker
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // remove existing destination marker
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove()
      destinationMarkerRef.current = null
    }

    if (destination) {
      const marker = L.marker([destination.lat, destination.lon], { icon: createDestinationIcon() })
      marker.addTo(map)
      marker.bindTooltip(destination.name || "Destination", {
        permanent: false,
        direction: 'top',
        className: 'custom-tooltip'
      })
      destinationMarkerRef.current = marker
    }
  }, [destination])

  // update routes when routes prop changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // remove existing route polylines
    routesRef.current.forEach((r) => r.remove())
    routesRef.current = []

    if (!Array.isArray(routes) || routes.length === 0) return

    // helper to pick color
    const routeColor = (routeType?: string, idx?: number) => {
      const t = (routeType || "").toLowerCase()
      if (t.includes("fastest")) return "#2563EB" // blue
      if (t.includes("eco")) return "#16A34A" // green
      if (t.includes("short")) return "#8B5CF6" // purple
      return idx === 0 ? "#2563EB" : "#9CA3AF"
    }

    routes.forEach((rt, idx) => {
      if (!Array.isArray(rt.points) || rt.points.length === 0) return
      const latlngs = rt.points.map((p) => [p[0], p[1]] as [number, number])
      const color = routeColor(rt.routeType, idx)
      const isSelected = selectedRouteId === rt.id
      const poly = L.polyline(latlngs, { color, weight: isSelected ? 6 : 4, opacity: isSelected ? 0.95 : 0.7 })
      poly.addTo(map)

      poly.on("click", () => {
        if (typeof onSelectRoute === "function") onSelectRoute(rt.id)
        // highlight
        try { poly.bringToFront() } catch {}
      })

      routesRef.current.push(poly)
    })

    // highlight selected route and fit bounds if selected
    if (selectedRouteId) {
      const idx = routes.findIndex((r) => r.id === selectedRouteId)
      if (idx >= 0 && routesRef.current[idx]) {
        const sel = routesRef.current[idx]
        try {
          sel.setStyle({ weight: 6, opacity: 1 })
          map.fitBounds(sel.getBounds(), { padding: [50, 50] })
        } catch {}
      }
    }
  }, [routes, selectedRouteId, onSelectRoute])

  // fly to center when changed
  useEffect(() => {
    const map = mapRef.current
    if (!map || !center) return
    try {
      map.flyTo([center[0], center[1]], 13)
    } catch {
      // ignore
    }
  }, [center])

  return <div ref={containerRef} className={className} />
}
