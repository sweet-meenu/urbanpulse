"use client"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconArrowLeft, IconMapPin, IconFileDescription, IconCheck } from "@tabler/icons-react"
import { useAuth } from "@/context/AuthContext"
import { createSimulation } from "@/lib/firebase-admin"
import { getLlmInsights, type Insight } from "@/lib/genai"
import { searchLocations } from "@/app/actions/location-search"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface LocationOption {
  name: string
  lat: number
  lon: number
}

const cityImages = [
  { city: "New York", url: "/new-york-skyline.png" },
  { city: "San Francisco", url: "/san-francisco-cityscape.jpg" },
  { city: "Los Angeles", url: "/los-angeles-downtown.jpg" },
  { city: "Chicago", url: "/chicago-skyline.png" },
  { city: "Boston", url: "/boston-downtown.jpg" },
  { city: "Seattle", url: "/seattle-cityscape.jpg" },
]

export default function NewSimulationPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [step, setStep] = useState<"location" | "config">("location")
  const [simulationName, setSimulationName] = useState("")
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null)
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [locationSearch, setLocationSearch] = useState("")
  const [locationSuggestions, setLocationSuggestions] = useState<LocationOption[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const [includedOptions, setIncludedOptions] = useState({
    weather: true,
    traffic: true,
    emissions: true,
    pollution: true,
  })

  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState("")

  const handleLocationSearch = useCallback(async (query: string) => {
    setLocationSearch(query)
    if (query.length < 2) {
      setLocationSuggestions([])
      return
    }

    setIsSearching(true)
    try {
      const results = await searchLocations(query)
      setLocationSuggestions(
        results.map((result: any) => ({
          name: result.name,
          lat: result.lat,
          lon: result.lon,
        })),
      )
    } catch (err) {
      console.error("Error searching locations:", err)
      setLocationSuggestions([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleSelectLocation = (location: LocationOption) => {
    setSelectedLocation(location)
    setLocationSearch(location.name)
    setLocationSuggestions([])
  }

  const handleSelectCity = (city: string) => {
    setSelectedCity(city)
  }

  const toggleOption = (option: keyof typeof includedOptions) => {
    setIncludedOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }))
  }

  const handleCreateSimulation = async () => {
    if (!simulationName.trim()) {
      setError("Please enter a simulation name")
      return
    }

    if (!selectedLocation && !selectedCity) {
      setError("Please select a location")
      return
    }

    setIsCreating(true)
    setError("")

    try {
      const location = selectedLocation || { name: selectedCity, lat: 0, lon: 0 }
      const cityImage = cityImages.find((c) => c.city === selectedCity)?.url || ""

      // If we have coordinates, fetch current weather & AQI to provide context to the LLM
  let insights: Insight[] = []
      try {
        if (location.lat && location.lon) {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
          const weatherParams = new URLSearchParams({
            latitude: String(location.lat),
            longitude: String(location.lon),
            current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,pressure_msl',
            timezone,
          })
          const airParams = new URLSearchParams({
            latitude: String(location.lat),
            longitude: String(location.lon),
            hourly: 'us_aqi,pm2_5,pm10',
            timezone,
          })

          const [weatherRes, airRes] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?${weatherParams.toString()}`),
            fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${airParams.toString()}`),
          ])

          const weatherJson = weatherRes.ok ? await weatherRes.json() : null
          const airJson = airRes.ok ? await airRes.json() : null

          const temp = weatherJson?.current?.temperature_2m ?? null
          const humidity = weatherJson?.current?.relative_humidity_2m ?? null
          const wind = weatherJson?.current?.wind_speed_10m ?? null
          const aqi = airJson?.hourly?.us_aqi?.[0] ?? null
          const pm25 = airJson?.hourly?.pm2_5?.[0] ?? null

          const aiPrompt = `Simulation: ${simulationName}\nLocation: ${location.name}\nLatitude: ${location.lat}\nLongitude: ${location.lon}\nTemperature: ${temp}\nHumidity: ${humidity}\nWind: ${wind}\nAQI: ${aqi}\nPM2_5: ${pm25}\nIncluded options: ${JSON.stringify(includedOptions)}\n\nProvide up to 4 short insight objects (icon,title,suggestion,color) in JSON array format that are actionable for city operators and residents.`

          try {
            const llmOut = await getLlmInsights(aiPrompt)
            insights = Array.isArray(llmOut) ? llmOut : []
          } catch (e) {
            console.warn('[Simulation] LLM insights generation failed', e)
            insights = []
          }
        }
      } catch (e) {
        console.warn('[Simulation] failed to fetch weather for insights', e)
      }

      const simulationId = await createSimulation({
        name: simulationName,
        location: location.name ?? '',
        latitude: location.lat,
        longitude: location.lon,
        cityImage,
        includedOptions,
        status: "active",
        insights,
      })

      router.push(
        `/simulation?simulationId=${simulationId}&location=${encodeURIComponent(location.name ?? '')}&lat=${location.lat}&lon=${location.lon}&simulationName=${encodeURIComponent(simulationName)}`,
      )
    } catch (err) {
      setError("Failed to create simulation. Please try again.")
      console.error(err)
    } finally {
      setIsCreating(false)
    }
  }

  if (loading) return null
  if (!user) {
    router.push("/login")
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] p-8 pt-24"
    >
      <div className="max-w-4xl mx-auto">
        <Link
          href="/simulations"
          className="inline-flex items-center gap-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors mb-8"
        >
          <IconArrowLeft size={20} />
          Back to Simulations
        </Link>

        <h1 className="text-5xl md:text-6xl font-bold font-space mb-4">
          Create <span className="text-[hsl(var(--secondary))]">Simulation</span>
        </h1>
        <p className="text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mb-16">
          Set up a new digital twin simulation with custom options for your target zone.
        </p>

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-8">{error}</div>
        )}

        {step === "location" ? (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <Card className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="block text-lg font-semibold flex items-center gap-2">
                  <IconFileDescription size={20} className="text-[hsl(var(--primary))]" />
                  Simulation Name
                </label>
                <Input
                  placeholder="e.g., Manhattan Traffic Reduction Study"
                  value={simulationName}
                  onChange={(e) => setSimulationName(e.target.value)}
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-lg font-semibold flex items-center gap-2">
                  <IconMapPin size={20} className="text-[hsl(var(--primary))]" />
                  Select City or Search Location
                </label>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {cityImages.map((city) => (
                    <motion.button
                      key={city.city}
                      onClick={() => handleSelectCity(city.city)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative h-32 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedCity === city.city
                          ? "border-[hsl(var(--primary))] ring-2 ring-[hsl(var(--primary))]/50"
                          : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]"
                      }`}
                    >
                      <img
                        src={city.url || "/placeholder.svg"}
                        alt={city.city}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white font-semibold text-center">{city.city}</span>
                      </div>
                      {selectedCity === city.city && (
                        <div className="absolute top-2 right-2 bg-[hsl(var(--primary))] rounded-full p-1">
                          <IconCheck size={16} className="text-black" />
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>

                <div className="mt-6 space-y-2">
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Or search for any location:</p>
                  <div className="relative">
                    <Input
                      placeholder="Search location..."
                      value={locationSearch}
                      onChange={(e) => handleLocationSearch(e.target.value)}
                      className="text-base"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin h-5 w-5 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full" />
                      </div>
                    )}

                    {/* Suggestions panel should be inside the same relative container so absolute positioning
                        places it directly under the input instead of at the page bottom. */}
                    {locationSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto w-full">
                        {locationSuggestions.map((location, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSelectLocation(location)}
                            className="w-full px-4 py-3 text-left hover:bg-[hsl(var(--primary))]/10 transition-colors border-b border-[hsl(var(--border))] last:border-0"
                          >
                            <p className="font-medium">{location.name}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">
                              {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {selectedLocation && (
                  <div className="p-3 bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 rounded-lg">
                    <p className="text-sm font-medium text-[hsl(var(--primary))]">Selected: {selectedLocation.name}</p>
                  </div>
                )}
              </div>

              <Button
                onClick={() => setStep("config")}
                disabled={!simulationName.trim() || (!selectedLocation && !selectedCity)}
                className="w-full"
              >
                Next: Configure Options
              </Button>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <Card className="p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-6">Simulation Options</h2>
                <p className="text-[hsl(var(--muted-foreground))] mb-6">
                  Select which data sources to include in your simulation.
                </p>

                <div className="space-y-4">
                  {Object.entries(includedOptions).map(([key, value]) => (
                    <motion.button
                      key={key}
                      onClick={() => toggleOption(key as keyof typeof includedOptions)}
                      whileHover={{ scale: 1.01 }}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        value
                          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5"
                          : "border-[hsl(var(--border))] bg-transparent hover:border-[hsl(var(--primary))]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold capitalize">{key}</p>
                          <p className="text-sm text-[hsl(var(--muted-foreground))]">
                            {key === "weather" && "Real-time weather data"}
                            {key === "traffic" && "Traffic patterns and congestion"}
                            {key === "emissions" && "Air quality and emission levels"}
                            {key === "pollution" && "Pollution monitoring data"}
                          </p>
                        </div>
                        <div
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                            value
                              ? "bg-[hsl(var(--primary))] border-[hsl(var(--primary))]"
                              : "border-[hsl(var(--border))]"
                          }`}
                        >
                          {value && <IconCheck size={16} className="text-black" />}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={() => setStep("location")} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button onClick={handleCreateSimulation} disabled={isCreating} className="flex-1">
                  {isCreating ? "Creating..." : "Create Simulation"}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
