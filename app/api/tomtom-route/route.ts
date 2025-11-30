import { NextResponse } from "next/server"

const TOMTOM_KEY = process.env.TOMTOM_API_KEY || process.env.NEXT_PUBLIC_TOMTOM_API_KEY || ""
const BASE = "https://api.tomtom.com/routing/1"

function buildRoutePlanningLocationsFromCoords(origLat: number, origLon: number, destLat: number, destLon: number) {
  return `${origLat},${origLon}:${destLat},${destLon}`
}

function buildQuery(params: Record<string, string | number | boolean | undefined>) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue
    p.set(k, String(v))
  }
  // always include the API key
  p.set("key", TOMTOM_KEY)
  return p.toString()
}

async function proxyTomTom(url: string, options?: RequestInit) {
  const res = await fetch(url, options)
  const text = await res.text()
  if (!res.ok) {
    // try to return the underlying tomtom error if possible
    let parsed: unknown = text
    try { parsed = JSON.parse(text) } catch {}
    throw new Error(`TomTom routing error: ${res.status} ${JSON.stringify(parsed)}`)
  }
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/**
 * GET handler: support simple origin/destination query params and a set of routing options.
 * Example: /api/tomtom-route?origLat=..&origLon=..&destLat=..&destLon=..&routeType=fastest&maxAlternatives=2
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const qp = url.searchParams

    // build routePlanningLocations: prefer explicit 'routePlanningLocations' param, otherwise build from origin/destination
    const routePlanningLocations = qp.get("routePlanningLocations") ?? ((): string | null => {
      const origLat = qp.get("origLat")
      const origLon = qp.get("origLon")
      const destLat = qp.get("destLat")
      const destLon = qp.get("destLon")
      if (!origLat || !origLon || !destLat || !destLon) return null
      return buildRoutePlanningLocationsFromCoords(Number(origLat), Number(origLon), Number(destLat), Number(destLon))
    })()

    if (!routePlanningLocations) {
      return NextResponse.json({ ok: false, error: "Missing routePlanningLocations or origin/destination coordinates" }, { status: 400 })
    }

    // allowed query knobs we pass to TomTom
    const allowed = [
      "routeType",
      "maxAlternatives",
      "alternativeType",
      "minDeviationDistance",
      "minDeviationTime",
      "routeRepresentation",
      "computeTravelTimeFor",
      "traffic",
      "travelMode",
      "sectionType",
      "report",
      "instructionsType",
      "language",
      "departAt",
      "arriveAt",
      "coordinatePrecision",
    ]

    const params: Record<string, string | number | boolean | undefined> = {}
    // sensible defaults
    params.routeRepresentation = qp.get("routeRepresentation") ?? "polyline"
    params.maxAlternatives = qp.get("maxAlternatives") ?? "2"
    params.traffic = qp.get("traffic") ?? "true"
    params.routeType = qp.get("routeType") ?? "fastest"
    params.report = qp.get("report") ?? "effectiveSettings"

    for (const name of allowed) {
      const v = qp.get(name)
      if (v != null) params[name] = v
    }

    const q = buildQuery(params)
    const tomUrl = `${BASE}/calculateRoute/${encodeURIComponent(routePlanningLocations)}/json?${q}`
    const data = await proxyTomTom(tomUrl)

    return NextResponse.json({ ok: true, data })
  } catch (err) {
    console.error("/api/tomtom-route GET error", err)
    return NextResponse.json({ ok: false, error: String((err as Error)?.message || err) }, { status: 500 })
  }
}

/**
 * POST handler: forwards a POST body to TomTom. Useful for legs/supportingPoints/encodedPolyline inputs.
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url)
    const qp = url.searchParams

    const routePlanningLocations = qp.get("routePlanningLocations")
    if (!routePlanningLocations) {
      return NextResponse.json({ ok: false, error: "Missing routePlanningLocations in URL path for POST" }, { status: 400 })
    }

    const params: Record<string, string | number | boolean | undefined> = {}
    params.routeRepresentation = qp.get("routeRepresentation") ?? "polyline"
    params.maxAlternatives = qp.get("maxAlternatives") ?? "2"
    params.traffic = qp.get("traffic") ?? "true"
    params.report = qp.get("report") ?? "effectiveSettings"
    const allowed = [
      "routeType",
      "maxAlternatives",
      "alternativeType",
      "minDeviationDistance",
      "minDeviationTime",
      "routeRepresentation",
      "computeTravelTimeFor",
      "traffic",
      "travelMode",
      "sectionType",
      "report",
      "instructionsType",
      "language",
      "departAt",
      "arriveAt",
      "coordinatePrecision",
    ]
    for (const name of allowed) {
      const v = qp.get(name)
      if (v != null) params[name] = v
    }

    const q = buildQuery(params)
    const tomUrl = `${BASE}/calculateRoute/${encodeURIComponent(routePlanningLocations)}/json?${q}`

    const body = await request.text()
    const tomData = await proxyTomTom(tomUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body })

    return NextResponse.json({ ok: true, data: tomData })
  } catch (err) {
    console.error("/api/tomtom-route POST error", err)
    return NextResponse.json({ ok: false, error: String((err as Error)?.message || err) }, { status: 500 })
  }
}
