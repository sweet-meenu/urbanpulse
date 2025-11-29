"use server"

export async function fetchAddressFromCoords(lat: number, lon: number) {
  const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY

  if (!apiKey) {
    throw new Error("TomTom API key not configured")
  }

  const url = `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json?key=${apiKey}&radius=100`

  try {
    const res = await fetch(url)

    if (!res.ok) {
      const text = await res.text()
      console.error("[geocode] TomTom non-OK response:", res.status, text)
      throw new Error(`TomTom API error: ${res.status}`)
    }

    const data = await res.json()

    if (data.addresses && data.addresses.length > 0) {
      return data.addresses[0].address
    } else {
      console.warn("[geocode] TomTom returned no addresses", data)
      throw new Error("No address data returned from TomTom.")
    }
  } catch (err) {
    console.error("[geocode] Error:", err)
    throw err
  }
}
