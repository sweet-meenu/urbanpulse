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
}

export default function MapView({ incidents = [], className = "h-[600px] w-full", center = null }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Layer[]>([])

  useEffect(() => {
    if (!containerRef.current) return

    // initialize map
    const map = L.map(containerRef.current, {
      center: center ?? (incidents.length ? [incidents[0].lat, incidents[0].lon] : [0, 0]),
      zoom: incidents.length || center ? 13 : 2,
    })
    mapRef.current = map

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

  // fly to center when changed
  useEffect(() => {
    const map = mapRef.current
    if (!map || !center) return
    try {
      map.flyTo([center[1], center[0]], 13)
    } catch {
      // ignore
    }
  }, [center])

  return <div ref={containerRef} className={className} />
}
