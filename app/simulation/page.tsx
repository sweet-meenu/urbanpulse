"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
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
import { getLlmInsights, type Insight } from "@/lib/genai"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import TrafficChart from "@/components/ui/traffic-chart"

const SimulationPage = () => {
  const searchParams = useSearchParams()
  const simulationName = searchParams.get("simulationName") || "Unknown Simulation"
  const location = searchParams.get("location") || "Unknown Location"
  const lat = searchParams.get("lat") ? Number.parseFloat(searchParams.get("lat")!) : null
  const lon = searchParams.get("lon") ? Number.parseFloat(searchParams.get("lon")!) : null

  const [weatherData, setWeatherData] = useState<LocationWeatherData | null>(null)
  type TomTomFlow = {
    currentSpeed?: number | string
    freeFlowSpeed?: number | string
    confidence?: number | string
  }

  const [tomtomFlow, setTomtomFlow] = useState<TomTomFlow | null>(null)
  const [tomtomIncidents, setTomtomIncidents] = useState<unknown[] | null>(null)
  const [trafficInsights, setTrafficInsights] = useState<Insight[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const TOMTOM_KEY = process.env.NEXT_PUBLIC_TOMTOM_API_KEY || null
  const fetchWeatherData = useCallback(async () => {
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
  }, [lat, lon])

  const fetchTomTomDataCb = useCallback(async (wData?: LocationWeatherData) => {
    if (!lat || !lon) return
    if (!TOMTOM_KEY) return

    try {
      // Flow Segment Data (closest road segment)
      const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${TOMTOM_KEY}&point=${lat},${lon}&unit=kmph&thickness=10`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`TomTom Flow error: ${res.status}`)
      const json = await res.json()
      setTomtomFlow(json.flowSegmentData ?? json)

      // build a prompt for the LLM summarizer using weather + flow
      const promptParts: string[] = []
      promptParts.push(`Location: ${location} (${lat},${lon})`)
      if (wData?.current) {
        promptParts.push(`Temperature: ${wData.current.temperature}`)
        promptParts.push(`Humidity: ${wData.current.humidity}`)
      }
      if (json?.flowSegmentData) {
        const f = json.flowSegmentData
        promptParts.push(`CurrentSpeed: ${f.currentSpeed ?? 'unknown'}`)
        promptParts.push(`FreeFlowSpeed: ${f.freeFlowSpeed ?? 'unknown'}`)
        promptParts.push(`Confidence: ${f.confidence ?? 'unknown'}`)
      }

      try {
        const aiPrompt = promptParts.join('\n') + '\n\nProvide up to 3 short, actionable traffic insights in JSON array format with keys: icon,title,suggestion,color.'
        const llm = await getLlmInsights(aiPrompt)
        setTrafficInsights(Array.isArray(llm) ? llm : null)
      } catch (e) {
        console.warn('[Simulation] LLM traffic insights failed', e)
        setTrafficInsights(null)
      }
    } catch (err) {
      console.warn('TomTom flow fetch failed', err)
      setTomtomFlow(null)
    }
  }, [lat, lon, TOMTOM_KEY, location])

  const fetchTomTomIncidentsCb = useCallback(async () => {
    if (!lat || !lon) return
    if (!TOMTOM_KEY) return

    try {
      // small bbox around point ~ ~1km (approx 0.01 deg)
      const delta = 0.01
      const minLat = lat - delta
      const maxLat = lat + delta
      const minLon = lon - delta
      const maxLon = lon + delta
      const bbox = `${minLon},${minLat},${maxLon},${maxLat}`
      const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${TOMTOM_KEY}&bbox=${bbox}&language=en-GB&timeValidityFilter=present`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`TomTom Incidents error: ${res.status}`)
      const json = await res.json()
      setTomtomIncidents(json.incidents ?? [])
    } catch (err) {
      console.warn('TomTom incidents fetch failed', err)
      setTomtomIncidents(null)
    }
  }, [lat, lon, TOMTOM_KEY])

  useEffect(() => {
    if (!lat || !lon) {
      setError("Location coordinates not provided")
      setLoading(false)
      return
    }

    setError("")
    // fetch initial data when coordinates are present
    void fetchWeatherData()
    void fetchTomTomIncidentsCb()
    void fetchTomTomDataCb()
  }, [lat, lon, fetchWeatherData, fetchTomTomIncidentsCb, fetchTomTomDataCb])

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true)
      await fetchWeatherData()
      await fetchTomTomDataCb(weatherData ?? undefined)
      await fetchTomTomIncidentsCb()
    } finally {
      setIsRefreshing(false)
    }
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6 sm:py-8 md:py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <Link href="/simulations" className="inline-flex items-center gap-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors mb-6 sm:mb-8">
          <IconArrowLeft size={20} />
          Back to Simulations
        </Link>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold font-space mb-3 sm:mb-4">Digital Twin <span className="text-[hsl(var(--secondary))]">Simulation</span></h1>
            <p className="text-base sm:text-lg md:text-xl text-[hsl(var(--muted-foreground))] max-w-3xl">Real-time analysis with data from Open-Meteo, TomTom, and environmental monitoring systems.</p>
          </div>

          <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" className="flex items-center gap-2 whitespace-nowrap bg-transparent text-sm sm:text-base">
            {isRefreshing ? <IconLoader size={20} className="animate-spin" /> : <IconRefresh size={20} />} Refresh Latest
          </Button>
        </div>

        {error && <div className="p-3 sm:p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm mb-6 sm:mb-8">{error}</div>}

        {!TOMTOM_KEY && <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 text-xs sm:text-sm mb-6 sm:mb-8">TomTom API key not configured — traffic insights are disabled. Set NEXT_PUBLIC_TOMTOM_API_KEY in your environment to enable.</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-12">
          <Card className="p-4 sm:p-6 md:p-8 space-y-3 sm:space-y-4">
            <IconTarget size={24} className="text-[hsl(var(--primary))] sm:w-8 sm:h-8" />
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Target Zone</h3>
            <p className="text-sm sm:text-base text-[hsl(var(--muted-foreground))]">{location}</p>
            {lat && lon && <p className="text-xs text-[hsl(var(--muted-foreground))]">📍 {lat.toFixed(4)}, {lon.toFixed(4)}</p>}
            <span className="inline-block px-2 sm:px-3 py-1 text-xs font-medium rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">Active</span>
          </Card>

          <Card className="p-4 sm:p-6 md:p-8 space-y-3 sm:space-y-4">
            <IconMap2 size={24} className="text-[hsl(var(--secondary))] sm:w-8 sm:h-8" />
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Simulation Model</h3>
            <p className="text-sm sm:text-base text-[hsl(var(--muted-foreground))]">{simulationName}</p>
            <span className="inline-block px-2 sm:px-3 py-1 text-xs font-medium rounded-full bg-[hsl(var(--secondary))]/10 text-[hsl(var(--secondary))]">Version 3.1</span>
          </Card>

          <Card className="p-4 sm:p-6 md:p-8 space-y-3 sm:space-y-4">
            <IconChartHistogram size={24} className="text-purple-400 sm:w-8 sm:h-8" />
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Status</h3>
            <p className="text-sm sm:text-base text-[hsl(var(--muted-foreground))]">Running analysis...</p>
            <span className="inline-block px-2 sm:px-3 py-1 text-xs font-medium rounded-full bg-purple-500/10 text-purple-400">Processing</span>
          </Card>
        </div>

        {loading ? (
          <Card className="p-8 sm:p-12 text-center"><IconLoader size={36} className="animate-spin mx-auto mb-4 text-[hsl(var(--primary))] sm:w-12 sm:h-12" /><p className="text-base sm:text-lg text-[hsl(var(--muted-foreground))]">Loading data...</p></Card>
        ) : tomtomFlow ? (
          <div className="space-y-6">
            <div className="rounded-2xl p-4 sm:p-6 bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-start">
                <div className="flex-1 w-full">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start sm:items-center">
                    <div>
                      <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">Current Speed</p>
                      <div className="text-3xl sm:text-4xl md:text-5xl font-bold">{Number((((tomtomFlow as unknown) as Record<string, unknown>)['currentSpeed'] as number) ?? 0) || 0}<span className="text-sm sm:text-base md:text-lg font-normal"> km/h</span></div>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">Free Flow</p>
                      <div className="text-3xl sm:text-4xl md:text-5xl font-bold">{Number((((tomtomFlow as unknown) as Record<string, unknown>)['freeFlowSpeed'] as number) ?? 0) || 0}<span className="text-sm sm:text-base md:text-lg font-normal"> km/h</span></div>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-6">
                    {/* simple congestion bar */}
                    {(() => {
                      const cur = Number((((tomtomFlow as unknown) as Record<string, unknown>)['currentSpeed'] as number) ?? 0) || 0
                      const free = Number((((tomtomFlow as unknown) as Record<string, unknown>)['freeFlowSpeed'] as number) ?? 0) || 1
                      const ratio = free > 0 ? cur / free : 1
                      const pct = Math.max(0, Math.min(1, ratio)) * 100
                      return (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">{ratio >= 0.95 ? 'Smooth Flow' : ratio >= 0.7 ? 'Moderate' : 'Congested'}</div>
                            <div className="text-xs sm:text-sm font-medium">{pct.toFixed(0)}%</div>
                          </div>
                          <div className="w-full bg-[hsl(var(--border))] h-2 sm:h-3 rounded-full overflow-hidden"><div className="h-2 sm:h-3 rounded-full bg-green-500" style={{ width: `${pct}%` }} /></div>
                        </div>
                      )
                    })()}
                  </div>

                  <div className="mt-4 sm:mt-6">
                    <TrafficChart data={(() => {
                      const cur = Number((((tomtomFlow as unknown) as Record<string, unknown>)['currentSpeed'] as number) ?? 0) || 0
                      const free = Number((((tomtomFlow as unknown) as Record<string, unknown>)['freeFlowSpeed'] as number) ?? 0) || 0
                      return [0,1,2,3,4].map(i => ({ time: `${i}`, current: Math.max(0, cur - i * (cur * 0.02)), freeflow: free }))
                    })()} height={180} />
                  </div>
                </div>

                <div className="w-full lg:w-48">
                  <div className="rounded-xl p-4 bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center">
                    <div className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">Nearby Incidents</div>
                    <div className="text-xl sm:text-2xl font-bold mt-2">{(tomtomIncidents?.length ?? 0)}</div>
                  </div>
                  {trafficInsights && trafficInsights[0] && (
                    <div className="mt-4 sm:mt-6 rounded-lg bg-emerald-600 text-white p-3 sm:p-4">
                      <div className="bg-white text-black rounded-md p-2 sm:p-3">
                        <p className="text-xs sm:text-sm italic">{trafficInsights[0].suggestion}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Analytics Estimation Section */}
            <Card className="p-6 space-y-4 mt-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <IconChartHistogram size={24} />
                Impact Analytics Estimation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Projected CO2 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Proj. CO₂</span>
                    <span className="text-2xl font-bold">390 ppm</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-red-500 font-medium">+70</span>
                    <span className="text-muted-foreground">vs baseline</span>
                  </div>
                </div>

                {/* Projected Noise */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Proj. Noise</span>
                    <span className="text-2xl font-bold">77 dB</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-red-500 font-medium">High</span>
                    <span className="text-muted-foreground">noise level</span>
                  </div>
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-6 pt-4 border-t">
                {/* Traffic Density Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Traffic Density</span>
                    <span className="text-sm font-bold text-green-600">80%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-green-600" style={{width: '80%'}}></div>
                  </div>
                </div>

                {/* EV Adoption Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">EV Adoption</span>
                    <span className="text-sm font-bold text-blue-600">15%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600" style={{width: '15%'}}></div>
                  </div>
                </div>

                {/* Public Transport Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Public Transport</span>
                    <span className="text-sm font-bold text-purple-600">40%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600" style={{width: '40%'}}></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : weatherData ? (
          <div className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card className="p-4 sm:p-6 space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">Temperature</p>
                  <span className="text-xl sm:text-2xl">{getWeatherIcon(weatherData.current.weatherCode)}</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{weatherData.current.temperature}°C</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Feels like {weatherData.current.apparentTemperature}°C</p>
              </Card>

              <Card className="p-4 sm:p-6 space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">Humidity</p>
                  <IconDroplets size={16} className="text-blue-400 sm:w-5 sm:h-5" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{weatherData.current.humidity}%</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Current moisture level</p>
              </Card>

              <Card className="p-4 sm:p-6 space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">Wind Speed</p>
                  <IconWind size={16} className="text-cyan-400 sm:w-5 sm:h-5" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{weatherData.current.windSpeed} m/s</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Current wind conditions</p>
              </Card>

              <Card className="p-4 sm:p-6 space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">UV Index</p>
                  <IconCloud size={16} className="text-yellow-400 sm:w-5 sm:h-5" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{Math.round(weatherData.current.uvIndex)}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">UV radiation level</p>
              </Card>
            </div>

            <Card className="p-4 sm:p-6 md:p-8">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2"><IconCalendar size={20} className="sm:w-6 sm:h-6" />5-Day Forecast</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
                {weatherData.daily.temperature2mMax.slice(0, 5).map((maxTemp, idx) => (
                  <div key={idx} className="p-3 sm:p-4 rounded-lg bg-[hsl(var(--card))]/50 border border-[hsl(var(--border))] text-center space-y-2">
                    <p className="text-xs sm:text-sm font-medium">{new Date(Date.now() + idx * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                    <div className="text-xl sm:text-2xl">{getWeatherIcon(weatherData.daily.weatherCode[idx])}</div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold">{Math.round(maxTemp)}°C</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{Math.round(weatherData.daily.temperature2mMin[idx])}°C</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <div />
        )}

        {/* Placeholder for running simulation visualization */}
        <div className="mt-10 sm:mt-12 md:mt-16 h-[300px] sm:h-[400px] md:h-[500px] w-full bg-[hsl(var(--card))]/50 border border-[hsl(var(--border))] rounded-2xl sm:rounded-3xl flex items-center justify-center">
          <p className="text-lg sm:text-xl md:text-2xl font-semibold text-[hsl(var(--muted-foreground))] text-center px-4">
            Running Digital Twin Visualization...
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default SimulationPage
