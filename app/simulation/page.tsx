"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import {
  IconArrowLeft,
  IconMap2,
  IconChartHistogram,
  IconTarget,
  IconCloud,
  IconWind,
  IconDroplets,
  IconRefresh,
  IconLoader,
  IconCalendar,
} from "@tabler/icons-react"
import { getWeatherData, type LocationWeatherData } from "@/lib/openmeteo"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const SimulationPage = () => {
  const searchParams = useSearchParams()
  const simulationId = searchParams.get("simulationId")
  const simulationName = searchParams.get("simulationName") || "Unknown Simulation"
  const location = searchParams.get("location") || "Unknown Location"
  const lat = searchParams.get("lat") ? Number.parseFloat(searchParams.get("lat")!) : null
  const lon = searchParams.get("lon") ? Number.parseFloat(searchParams.get("lon")!) : null

  const [weatherData, setWeatherData] = useState<LocationWeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (!lat || !lon) {
      setError("Location coordinates not provided")
      setLoading(false)
      return
    }

    fetchWeatherData()
  }, [lat, lon])

  const fetchWeatherData = async () => {
    if (!lat || !lon) return

    try {
      setLoading(true)
      setError("")
      const data = await getWeatherData(lat, lon)
      setWeatherData(data)
    } catch (err) {
      console.error("Error fetching weather data:", err)
      setError("Failed to load weather data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchWeatherData()
    setIsRefreshing(false)
  }

  const getWeatherIcon = (code: number) => {
    if (code === 0) return "☀️"
    if (code === 1 || code === 2) return "🌤️"
    if (code === 3) return "☁️"
    if ([45, 48].includes(code)) return "🌫️"
    if ([51, 53, 55, 61, 63, 65].includes(code)) return "🌧️"
    if ([71, 73, 75, 85, 86].includes(code)) return "❄️"
    if ([80, 81, 82].includes(code)) return "⛈️"
    if ([95, 96, 99].includes(code)) return "⚡"
    return "🌡️"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] p-8 pt-24"
    >
      <div className="max-w-7xl mx-auto">
        <Link
          href="/simulations"
          className="inline-flex items-center gap-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors mb-8"
        >
          <IconArrowLeft size={20} />
          Back to Simulations
        </Link>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-5xl md:text-7xl font-bold font-space mb-4">
              Digital Twin <span className="text-[hsl(var(--secondary))]">Simulation</span>
            </h1>
            <p className="text-xl text-[hsl(var(--muted-foreground))] max-w-3xl">
              Real-time analysis with data from Open-Meteo, TomTom, and environmental monitoring systems.
            </p>
          </div>

          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="flex items-center gap-2 whitespace-nowrap bg-transparent"
          >
            {isRefreshing ? <IconLoader size={20} className="animate-spin" /> : <IconRefresh size={20} />}
            Refresh Latest
          </Button>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-8">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="p-8 space-y-4">
            <IconTarget size={32} className="text-[hsl(var(--primary))]" />
            <h3 className="text-2xl font-bold">Target Zone</h3>
            <p className="text-[hsl(var(--muted-foreground))]">{location}</p>
            {lat && lon && (
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                📍 {lat.toFixed(4)}, {lon.toFixed(4)}
              </p>
            )}
            <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
              Active
            </span>
          </Card>

          <Card className="p-8 space-y-4">
            <IconMap2 size={32} className="text-[hsl(var(--secondary))]" />
            <h3 className="text-2xl font-bold">Simulation Model</h3>
            <p className="text-[hsl(var(--muted-foreground))]">{simulationName}</p>
            <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-[hsl(var(--secondary))]/10 text-[hsl(var(--secondary))]">
              Version 3.1
            </span>
          </Card>

          <Card className="p-8 space-y-4">
            <IconChartHistogram size={32} className="text-purple-400" />
            <h3 className="text-2xl font-bold">Status</h3>
            <p className="text-[hsl(var(--muted-foreground))]">Running analysis...</p>
            <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-purple-500/10 text-purple-400">
              Processing
            </span>
          </Card>
        </div>

        {loading ? (
          <Card className="p-12 text-center">
            <IconLoader size={48} className="animate-spin mx-auto mb-4 text-[hsl(var(--primary))]" />
            <p className="text-lg text-[hsl(var(--muted-foreground))]">Loading weather data...</p>
          </Card>
        ) : weatherData ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Temperature</p>
                  <span className="text-2xl">{getWeatherIcon(weatherData.current.weatherCode)}</span>
                </div>
                <p className="text-3xl font-bold">{weatherData.current.temperature}°C</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Feels like {weatherData.current.apparentTemperature}°C
                </p>
              </Card>

              <Card className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Humidity</p>
                  <IconDroplets size={20} className="text-blue-400" />
                </div>
                <p className="text-3xl font-bold">{weatherData.current.humidity}%</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Current moisture level</p>
              </Card>

              <Card className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Wind Speed</p>
                  <IconWind size={20} className="text-cyan-400" />
                </div>
                <p className="text-3xl font-bold">{weatherData.current.windSpeed} m/s</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Current wind conditions</p>
              </Card>

              <Card className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">UV Index</p>
                  <IconCloud size={20} className="text-yellow-400" />
                </div>
                <p className="text-3xl font-bold">{Math.round(weatherData.current.uvIndex)}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">UV radiation level</p>
              </Card>
            </div>

            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <IconCalendar size={24} />
                5-Day Forecast
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {weatherData.daily.temperature2mMax.slice(0, 5).map((maxTemp, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-[hsl(var(--card))]/50 border border-[hsl(var(--border))] text-center space-y-2"
                  >
                    <p className="text-sm font-medium">
                      {new Date(Date.now() + idx * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </p>
                    <div className="text-2xl">{getWeatherIcon(weatherData.daily.weatherCode[idx])}</div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold">{Math.round(maxTemp)}°C</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {Math.round(weatherData.daily.temperature2mMin[idx])}°C
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : null}

        {/* Placeholder for running simulation visualization */}
        <div className="mt-16 h-[500px] w-full bg-[hsl(var(--card))]/50 border border-[hsl(var(--border))] rounded-3xl flex items-center justify-center">
          <p className="text-2xl font-semibold text-[hsl(var(--muted-foreground))]">
            Running Digital Twin Visualization...
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default SimulationPage
