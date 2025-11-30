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
}

export default function MapView({ incidents = [], className = "h-[600px] w-full", center = null, routes = [], selectedRouteId = null, onSelectRoute, }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Layer[]>([])
  const routesRef = useRef<L.Polyline[]>([])

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

      const marker = L.circleMarker([inc.lat, inc.lon], { radius: 6, color: "#ef4444", weight: 2, fillColor: "#ef4444" })
      marker.addTo(map)

      // create popup container and render a small React component into it
      const popupContainer = document.createElement("div")
      popupContainer.className = "max-w-xs"

      const popupContent = (
        <div className="p-2">
          <div className="font-semibold mb-1">{inc.title ?? "Incident"}</div>
          <div className="text-sm text-slate-600 mb-2">{inc.description ?? "No details"}</div>
          {inc.image && <img src={inc.image} alt="incident" className="w-full rounded-md" />}
          <div className="mt-2 flex justify-end">
            <a href={`/incidents/${inc.id ?? ""}`} className="text-sm px-2 py-1 bg-slate-800 text-white rounded">Open</a>
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

      marker.bindPopup(popupContainer)
      markersRef.current.push(marker)
    })
  }, [incidents])

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
