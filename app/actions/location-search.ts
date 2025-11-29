"use server"

export interface LocationSuggestion {
  id: string
  name: string
  address?: string
  lat: number
  lon: number
}

const TOMTOM_API_KEY = process.env.NEXT_PUBLIC_TOMTOM_API_KEY
const TOMTOM_BASE_URL = "https://api.tomtom.com/search/2"

export async function searchLocationsAction(query: string): Promise<LocationSuggestion[]> {
  if (!query.trim() || query.length < 2) {
    return []
  }

  try {
    const params = new URLSearchParams({
      key: TOMTOM_API_KEY || "",
      query,
      limit: "10",
      language: "en-US",
    })

    const response = await fetch(`${TOMTOM_BASE_URL}/search/${query}.json?${params}`)

    if (!response.ok) {
      console.error("TomTom API error:", response.statusText)
      return []
    }

    const data = await response.json()

    return (data.results || []).map((result: any) => ({
      id: result.id,
      name: result.address?.freeformAddress || result.poi?.name || "Unknown",
      address: result.address?.freeformAddress,
      lat: result.position.lat,
      lon: result.position.lon,
    }))
  } catch (error) {
    console.error("Location search error:", error)
    return []
  }
}

export const searchLocations = searchLocationsAction
