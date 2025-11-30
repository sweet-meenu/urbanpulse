"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */

import { useAuth } from "@/context/AuthContext"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef, useMemo, useCallback } from "react"
import { motion } from "framer-motion"
import {
  IconHome,
  IconTerminal2,
  IconNewSection,
  IconUser,
  IconLogout,
  IconMap,
  IconMapPin,
  IconNavigation,
  IconAlertCircle,
  IconLoader,
} from "@tabler/icons-react"
import type { LocationSuggestion } from "@/lib/tomtom"

// UI Components
import CardNav from "@/components/ui/card-nav"
import { FloatingDock } from "@/components/ui/floating-dock"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addToast } from "@heroui/toast"
import { type DateValue, getLocalTimeZone, today } from "@internationalized/date"
import BentoGridDemo, {
  type AirQualitySummary,
  type ForecastEntry,
  type WeatherSummary,
} from "@/components/bento-grid-demo"
import { getLlmInsights, type Insight } from "@/lib/genai"

// Dummy Logo - Matches Theme Text Color
const urbanPulseLogo = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 50' fill='none'%3E%3Ctext x='10' y='35' fontFamily='Arial' fontWeight='bold' fontSize='24' fill='currentColor'%3EUrban%3Ctspan fill='%2300E676'%3EPulse%3C/tspan%3E%3C/text%3E%3C/svg%3E`

const describeAqiCategory = (aqi?: number | null) => {
  if (aqi === null || aqi === undefined) return "Unknown"
  if (aqi <= 50) return "Good"
  if (aqi <= 100) return "Moderate"
  if (aqi <= 150) return "Sensitive"
  if (aqi <= 200) return "Unhealthy"
  if (aqi <= 300) return "Very Unhealthy"
  return "Hazardous"
}

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

type ForecastPoint = ForecastEntry & { date: Date }

export default function DashboardPage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  // client-side lottie player ref/mount state (used for inline loader)
  const playerRef = useRef<any | null>(null)
  const [playerMounted, setPlayerMounted] = useState(false)
  const localTimeZone = useMemo(() => getLocalTimeZone(), [])

  // Default location (Mumbai, India) - used as fallback
  const DEFAULT_COORDS = { lat: 19.0760, lon: 72.8777 }

  // --- LOCATION & GEOCODING STATE ---
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [addressData, setAddressData] = useState<any | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)


  // --- WEATHER & AIR-QUALITY STATE ---
  const [weatherSummary, setWeatherSummary] = useState<WeatherSummary | null>(null)
  const [airQualitySummary, setAirQualitySummary] = useState<AirQualitySummary | null>(null)
  const [hourlyForecast, setHourlyForecast] = useState<ForecastPoint[]>([])
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherUpdatedAt, setWeatherUpdatedAt] = useState<Date | null>(null)
  const [selectedDate, setSelectedDate] = useState<DateValue | null>(() => today(localTimeZone))

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [insights, setInsights] = useState<Insight[] | null>(null)
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [simulationName, setSimulationName] = useState("")
  const [simulationLocation, setSimulationLocation] = useState("")
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lon: number } | null>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const avatarSrc =
    (user as any)?.photoURL ||
    (user as any)?.photoUrl ||
    `https://i.pravatar.cc/150?u=${encodeURIComponent(user?.email ?? (user as any)?.uid ?? "anon")}`

  // local control for image fallback -> render initials when remote image fails
  const [avatarError, setAvatarError] = useState(false)
  const initials =
    (user?.displayName
      ? user.displayName
          .split(" ")
          .map((p) => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : user?.email?.charAt(0).toUpperCase()) || "U"

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // dynamically register lottie-player for inline loader
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        await import("@lottiefiles/lottie-player")
        if (mounted) setPlayerMounted(true)
      } catch (e) {
        console.error("[Dashboard] failed to load lottie-player", e)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // --- TOMTOM API LOGIC ---
  // ...existing code...
  // --- TOMTOM API LOGIC ---
  const fetchTomTomAddress = async (lat: number, lon: number) => {
    try {
      console.debug("[Dashboard] TomTomAddress request starting", { lat, lon })
      const start = performance.now()

      const response = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`)
      if (!response.ok) {
        const errorData = await response.json()
        console.warn("[Dashboard] Geocoding failed:", errorData)
        // Set a default address with coordinates when geocoding fails
        setAddressData({ 
          freeformAddress: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
          countryCode: 'Unknown'
        })
        return
      }
      const addressData = await response.json()
      const duration = Math.round(performance.now() - start)
      console.debug("[Dashboard] TomTom response received, duration_ms:", duration)

      setAddressData(addressData)
    } catch (err) {
      console.error("TomTom API Error:", err)
      // Set a fallback address when error occurs
      setAddressData({ 
        freeformAddress: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        countryCode: 'Unknown'
      })
      setLocationError(err instanceof Error ? err.message : "Error contacting TomTom API.")
    } finally {
      setIsLocating(false)
    }
  }

  const fetchWeatherInsights = useCallback(
    async (lat: number, lon: number) => {
      const timezone = localTimeZone
      setWeatherLoading(true)
      try {
        const weatherParams = new URLSearchParams({
          latitude: String(lat),
          longitude: String(lon),
          current: "temperature_2m,relative_humidity_2m,wind_speed_10m,pressure_msl",
          hourly: "temperature_2m,relative_humidity_2m,wind_speed_10m,pressure_msl",
          timezone,
        })
        const airParams = new URLSearchParams({
          latitude: String(lat),
          longitude: String(lon),
          hourly: "us_aqi,pm2_5,pm10",
          timezone,
        })

        const [weatherRes, airRes] = await Promise.all([
          fetch(`https://api.open-meteo.com/v1/forecast?${weatherParams.toString()}`),
          fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${airParams.toString()}`),
        ])

        if (!weatherRes.ok) {
          throw new Error(`Open-Meteo weather error: ${weatherRes.status}`)
        }

        const weatherJson = await weatherRes.json()
        const airJson = airRes.ok ? await airRes.json() : null

        setWeatherSummary({
          temperature: weatherJson?.current?.temperature_2m ?? null,
          humidity: weatherJson?.current?.relative_humidity_2m ?? null,
          windSpeed: weatherJson?.current?.wind_speed_10m ?? null,
          pressure: weatherJson?.current?.pressure_msl ?? null,
        })

        const latestAqi = airJson?.hourly?.us_aqi?.[0] ?? null
        setAirQualitySummary({
          aqi: latestAqi,
          category: describeAqiCategory(latestAqi),
          pm25: airJson?.hourly?.pm2_5?.[0] ?? null,
          pm10: airJson?.hourly?.pm10?.[0] ?? null,
        })

        const hourlyPoints: ForecastPoint[] = (weatherJson?.hourly?.time ?? []).map((iso: string, idx: number) => {
          const entryDate = new Date(iso)
          return {
            iso,
            date: entryDate,
            timeLabel: entryDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            temperature: weatherJson?.hourly?.temperature_2m?.[idx] ?? null,
            humidity: weatherJson?.hourly?.relative_humidity_2m?.[idx] ?? null,
            windSpeed: weatherJson?.hourly?.wind_speed_10m?.[idx] ?? null,
            pressure: weatherJson?.hourly?.pressure_msl?.[idx] ?? null,
            aqi: airJson?.hourly?.us_aqi?.[idx] ?? null,
          }
        })

        setHourlyForecast(hourlyPoints)
        const timestamp = new Date()
        setWeatherUpdatedAt(timestamp)
        // generate LLM insights based on the freshly fetched weather + AQI
        try {
          const promptParts: string[] = []
          promptParts.push(`Location: ${lat},${lon}`)
          promptParts.push(`Temperature: ${weatherJson?.current?.temperature_2m ?? 'unknown'}`)
          promptParts.push(`Humidity: ${weatherJson?.current?.relative_humidity_2m ?? 'unknown'}`)
          promptParts.push(`Wind: ${weatherJson?.current?.wind_speed_10m ?? 'unknown'}`)
          const latestAqi = airJson?.hourly?.us_aqi?.[0] ?? 'unknown'
          promptParts.push(`AQI: ${latestAqi}`)
          promptParts.push(`PM2_5: ${airJson?.hourly?.pm2_5?.[0] ?? 'unknown'}`)

          const aiPrompt = promptParts.join('\n') + '\n\nProvide up to 4 short actionable insight objects in JSON array format.'
          const llm = await getLlmInsights(aiPrompt)
          setInsights(Array.isArray(llm) ? llm : null)
        } catch (e) {
          console.warn('[Dashboard] LLM insights failed', e)
          setInsights(null)
        }
        addToast({
          title: "Weather synced",
          description: `Open-Meteo updated ${timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
          color: "success",
          timeout: 4000,
        })
      } catch (err) {
        console.error("[Dashboard] Open-Meteo error", err)
        addToast({
          title: "Live data unavailable",
          description: err instanceof Error ? err.message : "Something went wrong while contacting Open-Meteo.",
          color: "danger",
          timeout: 5000,
        })
      } finally {
        setWeatherLoading(false)
      }
    },
    [localTimeZone],
  )

  // helper to inspect permissions (shows browser permission state)
  const inspectGeolocationPermission = async () => {
    try {
      if (!("permissions" in navigator)) {
        console.debug("[Dashboard] navigator.permissions not available in this browser")
        return
      }
      // types in TS may require casting
      const status = await (navigator as any).permissions.query({ name: "geolocation" })
      console.debug("[Dashboard] Geolocation permission state:", status.state)
      status.onchange = () => console.debug("[Dashboard] Geolocation permission changed:", status.state)
    } catch (err) {
      console.debug("[Dashboard] Error reading navigator.permissions:", err)
    }
  }

  const handleEnableLocation = () => {
    console.debug("[Dashboard] handleEnableLocation called")
    setIsLocating(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      console.error("[Dashboard] Geolocation not supported")
      setLocationError("Geolocation is not supported by your browser")
      setIsLocating(false)
      return
    }

    // inspect permissions state for debugging
    inspectGeolocationPermission()

    const geoOptions: PositionOptions = {
      enableHighAccuracy: false, // Changed to false for faster response
      timeout: 30000, // Increased to 30 seconds
      maximumAge: 10000, // Allow cached position up to 10 seconds old
    }
    console.debug("[Dashboard] Calling getCurrentPosition with options:", geoOptions)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        console.debug("[Dashboard] Geolocation success", {
          latitude,
          longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        })
        setCoords({ lat: latitude, lon: longitude })
        fetchTomTomAddress(latitude, longitude)
      },
      (error) => {
        // error is GeolocationPositionError
        console.groupCollapsed("[Dashboard] Geolocation error callback:")
        console.error("error.code:", error.code, "error.message:", error.message, error)
        // Some browsers provide additional info on message; log the full object
        try {
          console.debug("full error object:", JSON.stringify(error))
        } catch (e) {
          console.debug("Could not stringify error object", e)
        }
        console.groupEnd()

        setIsLocating(false)

        // Detailed messaging depending on code
        if (error.code === (error as any).PERMISSION_DENIED || error.code === 1) {
          setLocationError("Permission denied. Please allow location access (check browser/site permissions).")
        } else if (error.code === (error as any).POSITION_UNAVAILABLE || error.code === 2) {
          setLocationError(
            "Position unavailable. Check device location services, try again, or use a different network (Wi‑Fi/mobile).",
          )
          // extra hint for debugging
          console.warn(
            "[Dashboard] POSITION_UNAVAILABLE: possible causes - no GPS fix, network/location services off, or blocked by system settings.",
          )
        } else if (error.code === (error as any).TIMEOUT || error.code === 3) {
          setLocationError("Location request timed out. Please ensure location services are enabled and try again.")
          console.warn("[Dashboard] TIMEOUT: The request took too long. Try disabling high accuracy or check if location services are enabled.")
        } else {
          setLocationError(`Unable to retrieve your location. (${error.message || "unknown error"})`)
        }

        // Suggest next steps in console for developer & QA
        console.info(
          "[Dashboard] Debug suggestions: check browser site permissions (F12 → Application/Privacy), ensure device location services are enabled, try different browser or network, and inspect network tab for TomTom call if coordinates were obtained.",
        )
      },
      geoOptions,
    )
  }

  // Auto-fetch location on mount if permission already granted, or load default weather data
  useEffect(() => {
    // Only run on initial mount
    if (coords || isLocating || !navigator.geolocation) return
    
    // Check if we already have permission
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          console.debug('[Dashboard] Auto-fetching location (permission already granted)')
          // Directly call getCurrentPosition instead of handleEnableLocation to avoid dependency
          const geoOptions: PositionOptions = {
            enableHighAccuracy: false,
            timeout: 30000,
            maximumAge: 10000,
          }
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords
              console.debug('[Dashboard] Auto-location success', { latitude, longitude })
              setCoords({ lat: latitude, lon: longitude })
              fetchTomTomAddress(latitude, longitude)
            },
            (error) => {
              console.debug('[Dashboard] Auto-location failed:', error.message)
              // Load default location weather data
              setCoords(DEFAULT_COORDS)
              setAddressData({ freeformAddress: 'Mumbai, India (Default Location)' })
            },
            geoOptions
          )
        } else {
          console.debug('[Dashboard] Location permission not granted, loading default weather data')
          // Load default location weather data
          setCoords(DEFAULT_COORDS)
          setAddressData({ freeformAddress: 'Mumbai, India (Default Location)' })
        }
      }).catch((err) => {
        console.debug('[Dashboard] Could not query location permission:', err)
        // Load default location weather data as fallback
        setCoords(DEFAULT_COORDS)
        setAddressData({ freeformAddress: 'Mumbai, India (Default Location)' })
      })
    } else {
      // Browser doesn't support permissions API, load default data
      console.debug('[Dashboard] Permissions API not supported, loading default weather data')
      setCoords(DEFAULT_COORDS)
      setAddressData({ freeformAddress: 'Mumbai, India (Default Location)' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run once on mount
  
  useEffect(() => {
    if (!coords) return
    fetchWeatherInsights(coords.lat, coords.lon)
  }, [coords, fetchWeatherInsights])

  const filterForecastByDate = useCallback(
    (value: DateValue | null) => {
      if (!value) return [] as ForecastPoint[]
      const targetDate = value.toDate(localTimeZone)
      return hourlyForecast.filter((point) => isSameDay(point.date, targetDate)).slice(0, 6)
    },
    [hourlyForecast, localTimeZone],
  )

  const forecastForSelectedDate = useMemo(
    () => filterForecastByDate(selectedDate),
    [filterForecastByDate, selectedDate],
  )

  const handleDateChange = (value: DateValue | null) => {
    setSelectedDate(value)
    if (!value) return
    const preview = filterForecastByDate(value)
    if (!preview.length) {
      addToast({
        title: "Forecast unavailable",
        description: "Open-Meteo hasn't published data for that day yet.",
        color: "warning",
        timeout: 4000,
      })
      return
    }

    const temps = preview.map((entry) => entry.temperature).filter((temp): temp is number => typeof temp === "number")
    if (temps.length) {
      const hi = Math.max(...temps)
      const lo = Math.min(...temps)
      addToast({
        title: `Forecast for ${value.toString()}`,
        description: `Range ${lo.toFixed(1)}°C – ${hi.toFixed(1)}°C across ${preview.length} hours`,
        color: "primary",
        timeout: 4500,
      })
    }
  }

  const handlePredictionToast = () => {
    if (!forecastForSelectedDate.length) {
      addToast({
        title: "No forecast",
        description: "Choose another date or refresh data to see predictions.",
        color: "warning",
      })
      return
    }

    const temps = forecastForSelectedDate
      .map((entry) => entry.temperature)
      .filter((temp): temp is number => typeof temp === "number")
    const humidities = forecastForSelectedDate
      .map((entry) => entry.humidity)
      .filter((value): value is number => typeof value === "number")

    const hi = temps.length ? Math.max(...temps) : null
    const lo = temps.length ? Math.min(...temps) : null
    const avgHumidity = humidities.length ? humidities.reduce((sum, value) => sum + value, 0) / humidities.length : null

    addToast({
      title: `Predictions for ${selectedDate?.toString() ?? "selected day"}`,
      description: `Low ${lo?.toFixed(1) ?? "--"}°C / High ${hi?.toFixed(1) ?? "--"}°C • Avg humidity ${
        avgHumidity?.toFixed(0) ?? "--"
      }%`,
      color: "success",
      timeout: 5000,
    })
  }

  const handleRefreshWeather = () => {
    if (coords) {
      fetchWeatherInsights(coords.lat, coords.lon)
    } else {
      handleEnableLocation()
    }
  }

  // Sign-out helper (used by header and dock)
  const handleSignOut = async () => {
    try {
      console.debug("[Dashboard] handleSignOut called")
      await logout()
      console.debug("[Dashboard] signed out, redirecting to /login")
      router.push("/login")
    } catch (err) {
      console.error("[Dashboard] sign out failed", err)
    }
  }

  const handleLocationSearch = async (value: string) => {
    setSimulationLocation(value)
    if (value.length >= 2) {
      setIsLoadingSuggestions(true)
      try {
        const response = await fetch(`/api/location-search?query=${encodeURIComponent(value)}`)
        const suggestions = await response.json()
        setLocationSuggestions(suggestions)
      } catch (error) {
        console.error('Location search error:', error)
        setLocationSuggestions([])
      }
      setIsLoadingSuggestions(false)
    } else {
      setLocationSuggestions([])
    }
  }

  const handleSelectLocation = (suggestion: LocationSuggestion) => {
    setSimulationLocation(suggestion.name)
    setSelectedCoordinates({ lat: suggestion.lat, lon: suggestion.lon })
    setLocationSuggestions([])
  }

  const handleStartSimulation = () => {
    if (!selectedCity || !simulationName || !simulationLocation) {
      addToast({
        title: "Please fill all fields",
        description: "Select a city, enter simulation name, and location",
        color: "warning",
        timeout: 3000,
      })
      return
    }

    addToast({
      title: "Simulation started!",
      description: `Running "${simulationName}" in ${simulationLocation}`,
      color: "success",
      timeout: 3000,
    })

    const params = new URLSearchParams({
      simulationName,
      location: simulationLocation,
      lat: selectedCoordinates?.lat?.toString() || "",
      lon: selectedCoordinates?.lon?.toString() || "",
      city: selectedCity,
    })

    setSimulationName("")
    setSimulationLocation("")
    setSelectedCity(null)
    setSelectedCoordinates(null)
    setIsDialogOpen(false)

    router.push(`/simulation?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 p-6 rounded-xl bg-white/5 backdrop-blur-md mx-4 sm:mx-0">
          <div className="relative">
            <div className="absolute inset-0 blur-3xl bg-[radial-gradient(circle,_rgba(0,230,118,0.35),_transparent_60%)] animate-pulse" />
            <div className="relative w-32 h-32 sm:w-40 sm:h-40">
              {playerMounted ? (
                // @ts-expect-error custom element
                <lottie-player
                  ref={playerRef}
                  src="/loading.json"
                  background="transparent"
                  speed={1}
                  loop
                  autoplay
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div
            role="status"
            aria-live="polite"
            className="text-[hsl(var(--foreground))] text-base sm:text-2xl font-semibold text-center"
          >
            Opening Your Dashboard ...
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">calibrating sensors · verifying gps</p>
        </div>

        {/* LLM-generated micro-insights */}
        {insights && insights.length > 0 && (
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {insights.map((ins, idx) => (
              <div key={idx} className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-4 rounded-xl shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[hsl(var(--secondary))]/10 flex items-center justify-center text-[hsl(var(--secondary))]">{/* icon placeholder */}
                    <span className="text-sm">{ins.icon}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{ins.title}</div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{ins.suggestion}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
  if (!user) return null

  // --- NAV ITEMS CONFIG (Themed) ---
  const navItems = [
    {
      label: "Map View",
      bgColor: "hsl(var(--surface-1))",
      textColor: "hsl(var(--foreground))",
      links: [
        { label: "Live Traffic", href: "#", ariaLabel: "Live Traffic" },
        { label: "Heatmaps", href: "#", ariaLabel: "Heatmaps" },
      ],
    },
    {
      label: "Analytics",
      bgColor: "hsl(var(--card))",
      textColor: "hsl(var(--foreground))",
      links: [
        { label: "CO2 Emissions", href: "#", ariaLabel: "CO2" },
        { label: "AQI Trends", href: "#", ariaLabel: "AQI" },
      ],
    },
    {
      label: "Profile",
      bgColor: "hsl(var(--surface-2))",
      textColor: "hsl(var(--foreground))",
      links: [
        { label: "Settings", href: "#", ariaLabel: "Settings" },
        { label: "Sign Out", href: "#", ariaLabel: "Logout" },
      ],
    },
  ]

  const dockItems = [
    { title: "Home", icon: <IconHome className="h-full w-full text-neutral-500 dark:text-neutral-300" />, href: "/" },
  { title: "Map", icon: <IconMap className="h-full w-full text-neutral-500 dark:text-neutral-300" />, href: "/maps" },
    {
      title: "Simulations",
      icon: <IconTerminal2 className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: "/simulations",
    },
    {
      title: "Community",
      icon: <IconNewSection className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: "/community",
    },
    {
      title: "Profile",
      icon: <IconUser className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: "/profile",
    },
    { title: "Logout", icon: <IconLogout className="h-full w-full text-red-500" />, href: "#", onClick: handleSignOut },
  ]

  const cityImages = [
    "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&q=80&w=3000",
    "https://images.unsplash.com/photo-1449824913935-67f85cf4f1df?auto=format&fit=crop&q=80&w=3000",
    "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&q=80&w=3000",
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=3000",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-purple-900/20 text-[hsl(var(--foreground))] font-sans selection:bg-[hsl(var(--primary))]/30 overflow-x-hidden relative transition-colors duration-500">
      {/* loading overlay moved to app/loading.tsx */}

      {/* 1. TOP NAV: CardNav with Theming */}
      <div className="fixed top-0 inset-x-0 z-40 text-[hsl(var(--foreground))]">
        <CardNav
          logo={urbanPulseLogo}
          items={navItems}
          baseColor="hsl(var(--background))"
          menuColor="hsl(var(--foreground))"
          buttonBgColor="hsl(var(--primary))"
          buttonTextColor="hsl(var(--primary-foreground))"
        />
      </div>

      <div className="pt-32 pb-40 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-end gap-6"
        >
          <div className="flex items-center gap-6">
            {!avatarError ? (
              <img
                src={avatarSrc || "/placeholder.svg"}
                alt={user?.displayName || user?.email || "User avatar"}
                onError={() => setAvatarError(true)}
                className="w-16 h-16 rounded-xl object-cover border-4 border-indigo-200 dark:border-indigo-800 shadow-lg shadow-indigo-500/50 ring-4 ring-indigo-100 dark:ring-indigo-900/50"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white border-4 border-indigo-200 dark:border-indigo-800 shadow-lg shadow-indigo-500/50 ring-4 ring-indigo-100 dark:ring-indigo-900/50 font-bold text-xl">
                {initials}
              </div>
            )}

            <div>
              <h2 className="text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Good Evening,</h2>
              <h1 className="text-4xl md:text-5xl font-bold font-space bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {user.displayName?.split(" ")[0] || "User"}
              </h1>
            </div>
            <button
              onClick={handleSignOut}
              className="ml-3 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 text-white text-sm hover:from-red-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
            >
              Sign out
            </button>
          </div>

          <div className="flex gap-4">
            <div className="bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 border-2 border-indigo-300 dark:border-indigo-700 px-4 py-2 rounded-xl text-center shadow-lg">
              <p className="text-xs text-indigo-700 dark:text-indigo-300 uppercase font-bold">Level</p>
              <p className="text-xl font-mono bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold">5</p>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-300 dark:border-purple-700 px-4 py-2 rounded-xl text-center shadow-lg">
              <p className="text-xs text-purple-700 dark:text-purple-300 uppercase font-bold">$PULSE</p>
              <p className="text-xl font-mono bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">1,240</p>
            </div>
          </div>
        </motion.div>

        {/* DIGITAL TWIN SIMULATION CARD */}
        <div className="bg-[hsl(var(--card))]/50 border border-[hsl(var(--border))] rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-sm shadow-xl">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-[hsl(var(--foreground))]">Digital Twin Simulation</h3>
            <p className="text-[hsl(var(--muted-foreground))] max-w-md">
              Run a new predictive model for traffic congestion and AQI impact.
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold px-8 py-4 rounded-full hover:scale-105 transition-transform shadow-lg">
                Launch New Simulation
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-[hsl(var(--card))] border-[hsl(var(--border))]">
              <DialogHeader>
                <DialogTitle className="text-2xl text-[hsl(var(--foreground))]">Select Target Zone</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* City Selection */}
                <div>
                  <Label className="text-[hsl(var(--foreground))] font-semibold mb-3 block">Select City</Label>
                  <div className="flex flex-wrap justify-center gap-3">
                    {cityImages.map((image, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedCity(image)}
                        className={`relative overflow-hidden rounded-xl transition-all duration-200 ${
                          selectedCity === image
                            ? "ring-2 ring-[hsl(var(--primary))] scale-110"
                            : "hover:scale-105 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`city-${idx}`}
                          className="h-24 w-24 md:h-32 md:w-32 object-cover rounded-xl"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulation Name */}
                <div>
                  <Label htmlFor="sim-name" className="text-[hsl(var(--foreground))] font-semibold">
                    Simulation Name
                  </Label>
                  <Input
                    id="sim-name"
                    placeholder="e.g., Peak Hour Traffic"
                    value={simulationName}
                    onChange={(e) => setSimulationName(e.target.value)}
                    className="mt-2 bg-[hsl(var(--background))] border-[hsl(var(--border))] text-[hsl(var(--foreground))]"
                  />
                </div>

                <div className="relative">
                  <Label htmlFor="location" className="text-[hsl(var(--foreground))] font-semibold">
                    Location
                  </Label>
                  <Input
                    id="location"
                    placeholder="Search for a location (e.g., downtown, street address)"
                    value={simulationLocation}
                    onChange={(e) => handleLocationSearch(e.target.value)}
                    className="mt-2 bg-[hsl(var(--background))] border-[hsl(var(--border))] text-[hsl(var(--foreground))]"
                  />

                  {locationSuggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="absolute top-full left-0 right-0 mt-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
                    >
                      {isLoadingSuggestions ? (
                        <div className="p-3 text-center text-[hsl(var(--muted-foreground))]">Searching...</div>
                      ) : (
                        locationSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            onClick={() => handleSelectLocation(suggestion)}
                            className="w-full px-4 py-3 text-left hover:bg-[hsl(var(--primary))]/10 border-b border-[hsl(var(--border))] last:border-b-0 transition-colors"
                          >
                            <div className="font-medium text-[hsl(var(--foreground))]">{suggestion.name}</div>
                            {suggestion.address && (
                              <div className="text-sm text-[hsl(var(--muted-foreground))]">{suggestion.address}</div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {selectedCoordinates && (
                  <div className="p-3 bg-[hsl(var(--primary))]/10 rounded-lg border border-[hsl(var(--primary))]/30">
                    <p className="text-sm text-[hsl(var(--primary))] font-medium">
                      ✓ Location selected: {simulationLocation}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                      Coordinates: {selectedCoordinates.lat.toFixed(4)}, {selectedCoordinates.lon.toFixed(4)}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 pt-4">
                <button
                  onClick={() => {
                    setIsDialogOpen(false)
                    setSimulationName("")
                    setSimulationLocation("")
                    setSelectedCity(null)
                    setSelectedCoordinates(null)
                    setLocationSuggestions([])
                  }}
                  className="px-6 py-2 bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rounded-lg hover:bg-[hsl(var(--muted))]/80 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartSimulation}
                  className="px-6 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg font-semibold hover:opacity-90 transition"
                >
                  Start Simulation
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* --- GRID LAYOUT --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* --- LOCATION CARD --- */}
          <div className="bg-[hsl(var(--card))]/50 border border-[hsl(var(--border))] p-4 sm:p-6 rounded-2xl sm:rounded-3xl md:col-span-2 relative overflow-hidden group shadow-lg">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
                <IconMapPin size={18} className="text-[hsl(var(--primary))] sm:w-5 sm:h-5" />
                Current Location
              </h3>
              {addressData && (
                <span className="text-xs bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] px-2 py-1 rounded-full border border-[hsl(var(--primary))]/20">
                  GPS Active
                </span>
              )}
            </div>

            <div className="h-40 sm:h-48 w-full bg-[hsl(var(--background))]/50 rounded-lg sm:rounded-xl border border-[hsl(var(--border))] flex flex-col items-center justify-center relative overflow-hidden">
              {!coords && !isLocating && (
                <div className="text-center z-10 p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] mb-3 sm:mb-4">
                    Enable location to see real-time congestion and address data.
                  </p>
                  <button
                    onClick={handleEnableLocation}
                    className="group/btn flex items-center gap-2 bg-[hsl(var(--foreground))] text-[hsl(var(--background))] px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base font-bold hover:bg-[hsl(var(--primary))] transition-all mx-auto shadow-md"
                  >
                    <IconNavigation size={16} className="group-hover/btn:rotate-45 transition-transform sm:w-[18px] sm:h-[18px]" />
                    Enable Location
                  </button>
                  {locationError && (
                    <p className="text-red-400 text-xs mt-2 sm:mt-3 flex items-center justify-center gap-1">
                      <IconAlertCircle size={14} /> {locationError}
                    </p>
                  )}
                </div>
              )}

              {isLocating && (
                <div className="flex flex-col items-center gap-2 sm:gap-3 text-[hsl(var(--primary))]">
                  <IconLoader size={24} className="animate-spin sm:w-8 sm:h-8" />
                  <span className="text-xs sm:text-sm font-mono animate-pulse">Fetching...</span>
                </div>
              )}

              {addressData && (
                <div className="w-full h-full p-4 sm:p-6 text-left flex flex-col justify-between relative z-10">
                  <div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[hsl(var(--foreground))] mb-1">
                      {addressData.municipality || addressData.localName}
                    </h2>
                    <p className="text-sm sm:text-base md:text-lg text-[hsl(var(--muted-foreground))]">
                      {addressData.streetName || "Unidentified Road"} {addressData.streetNumber}
                    </p>
                    <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] mt-1 opacity-70">
                      {addressData.countrySubdivision}, {addressData.country}
                    </p>
                  </div>
                  <div className="flex gap-2 sm:gap-4 mt-3 sm:mt-4">
                    <div className="bg-[hsl(var(--card))] px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-[hsl(var(--border))] shadow-sm">
                      <span className="text-xs text-[hsl(var(--muted-foreground))] block">LAT</span>
                      <span className="font-mono text-xs sm:text-sm text-[hsl(var(--primary))]">{coords?.lat.toFixed(4)}</span>
                    </div>
                    <div className="bg-[hsl(var(--card))] px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-[hsl(var(--border))] shadow-sm">
                      <span className="text-xs text-[hsl(var(--muted-foreground))] block">LON</span>
                      <span className="font-mono text-xs sm:text-sm text-[hsl(var(--primary))]">{coords?.lon.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:16px_16px]" />
              </div>
            </div>
          </div>

          {/* Incidents quick actions */}
          <div className="bg-[hsl(var(--card))]/50 border border-[hsl(var(--border))] p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-lg">
            <h3 className="text-base sm:text-lg font-bold text-[hsl(var(--foreground))] mb-3 sm:mb-4">Incidents & Reports</h3>
            <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] mb-3 sm:mb-4">Report an incident or view reports from the community.</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Link href="/incidents" className="px-3 sm:px-4 py-2 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-semibold text-sm text-center">Report Incident</Link>
              <Link href="/incidents" className="px-3 sm:px-4 py-2 rounded-md border border-[hsl(var(--border))] text-sm text-center">My Reports</Link>
              <Link href="/community" className="px-3 sm:px-4 py-2 rounded-md border border-[hsl(var(--border))] text-sm text-center">Community</Link>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-[hsl(var(--card))]/50 border border-[hsl(var(--border))] p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-lg">
            <h3 className="text-base sm:text-lg font-bold text-[hsl(var(--foreground))] mb-3 sm:mb-4">Notifications</h3>
            <ul className="space-y-3 sm:space-y-4">
              <li className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] flex gap-2 sm:gap-3 items-start">
                <div className="w-2 h-2 mt-1 sm:mt-1.5 bg-[hsl(var(--primary))] rounded-full shrink-0 shadow-[0_0_10px_hsl(var(--primary))]" />
                <span>
                  Reward claimed: <span className="text-[hsl(var(--foreground))] font-medium">Free Coffee</span>
                </span>
              </li>
              <li className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] flex gap-2 sm:gap-3 items-start">
                <div className="w-2 h-2 mt-1 sm:mt-1.5 bg-[hsl(var(--secondary))] rounded-full shrink-0" />
                <span>
                  New Eco-Route available for{" "}
                  <span className="text-[hsl(var(--foreground))] font-medium">Morning Commute</span>
                </span>
              </li>
              <li className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] flex gap-2 sm:gap-3 items-start">
                <div className="w-2 h-2 mt-1 sm:mt-1.5 bg-yellow-500 rounded-full shrink-0 animate-pulse" />
                <span>
                  High AQI alert in <span className="text-[hsl(var(--foreground))] font-medium">Downtown Sector 4</span>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <BentoGridDemo
        className="px-4 md:px-8 max-w-7xl mx-auto mt-12 pb-48"
        weatherSummary={weatherSummary}
        airQualitySummary={airQualitySummary}
        forecast={forecastForSelectedDate}
        isLoading={weatherLoading}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        onViewPredictions={handlePredictionToast}
        lastUpdated={weatherUpdatedAt}
        onRefresh={coords ? handleRefreshWeather : undefined}
      />

      <div className="fixed bottom-8 right-8 md:bottom-8 md:left-0 md:right-0 md:mx-auto flex md:justify-center z-50">
        <FloatingDock
          items={dockItems}
          desktopClassName="bg-[hsl(var(--card))]/90 border border-[hsl(var(--border))] backdrop-blur-md shadow-2xl"
          mobileClassName="bg-[hsl(var(--card))]/90 border border-[hsl(var(--border))] backdrop-blur-md shadow-2xl"
        />
      </div>
    </div>
  )
}
