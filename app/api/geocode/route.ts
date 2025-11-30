import { NextRequest, NextResponse } from 'next/server'

// In-memory cache for geocoding results
// Key: "lat,lon" string, Value: { address: AddressData, timestamp: number }
interface CachedAddress {
  address: Record<string, unknown>
  timestamp: number
}

const geocodeCache = new Map<string, CachedAddress>()
const CACHE_TTL = 3600000 // 1 hour in milliseconds

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Missing lat or lon parameters' }, { status: 400 })
  }

  // Check cache first
  const cacheKey = `${lat},${lon}`
  const cached = geocodeCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.debug('[geocode] Cache hit for', cacheKey)
    return NextResponse.json(cached.address)
  }

  const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'TomTom API key not configured' }, { status: 500 })
  }

  const url = `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json?key=${apiKey}&radius=100`

  try {
    const res = await fetch(url, {
      cache: 'no-store'
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[geocode] TomTom non-OK response:', res.status, text)
      return NextResponse.json({ error: `TomTom API error: ${res.status}` }, { status: res.status })
    }

    const data = await res.json()

    if (data.addresses && data.addresses.length > 0) {
      const addressResult = data.addresses[0].address
      
      // Store in cache
      geocodeCache.set(cacheKey, {
        address: addressResult,
        timestamp: Date.now()
      })
      console.debug('[geocode] Cached result for', cacheKey)
      
      return NextResponse.json(addressResult)
    } else {
      console.warn('[geocode] TomTom returned no addresses', data)
      return NextResponse.json({ error: 'No address data returned from TomTom' }, { status: 404 })
    }
  } catch (err) {
    console.error('[geocode] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
