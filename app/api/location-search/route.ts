import { NextRequest, NextResponse } from 'next/server'

interface CachedSearchResult {
  results: Array<{
    id: string
    name: string
    address?: string
    lat: number
    lon: number
  }>
  timestamp: number
}

const searchCache = new Map<string, CachedSearchResult>()
const CACHE_TTL = 1800000

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')

  if (!query || query.trim().length < 2) {
    return NextResponse.json([])
  }

  const normalizedQuery = query.trim().toLowerCase()
  
  // Check cache first
  const cached = searchCache.get(normalizedQuery)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.debug('[location-search] Cache hit for', normalizedQuery)
    return NextResponse.json(cached.results)
  }

  const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'TomTom API key not configured' }, { status: 500 })
  }

  try {
    const params = new URLSearchParams({
      key: apiKey,
      query: query.trim(),
      limit: '10',
      language: 'en-US',
    })

    const response = await fetch(
      `https://api.tomtom.com/search/2/search/${encodeURIComponent(query.trim())}.json?${params}`,
      { cache: 'no-store' }
    )

    if (!response.ok) {
      console.error('TomTom API error:', response.statusText)
      return NextResponse.json([])
    }

    const data = await response.json()

    interface TomTomSearchResult {
      id: string
      position: { lat: number; lon: number }
      address?: { freeformAddress?: string }
      poi?: { name?: string }
    }

    const results = (data.results || []).map((result: TomTomSearchResult) => ({
      id: result.id,
      name: result.address?.freeformAddress || result.poi?.name || 'Unknown',
      address: result.address?.freeformAddress,
      lat: result.position.lat,
      lon: result.position.lon,
    }))

    // Store in cache
    searchCache.set(normalizedQuery, {
      results,
      timestamp: Date.now()
    })
    console.debug('[location-search] Cached result for', normalizedQuery)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Location search error:', error)
    return NextResponse.json([])
  }
}
