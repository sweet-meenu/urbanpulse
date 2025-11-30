export interface LocationSuggestion {
  id: string
  name: string
  address?: string
  lat: number
  lon: number
}

// Minimal shim for older imports that referenced `@/lib/tomtom`.
// Prefer using the server action at `app/actions/location-search.ts` for real searches.
export async function searchLocations(query: string): Promise<LocationSuggestion[]> {
  // Simple no-op shim to satisfy imports at build time.
  // Callers should import the server action `searchLocations` instead for real results.
  return []
}

export default {
  searchLocations,
}
