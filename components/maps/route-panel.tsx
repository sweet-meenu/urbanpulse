"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Navigation, 
  Clock, 
  Route as RouteIcon, 
  TrendingUp, 
  Zap, 
  AlertTriangle,
  Car,
  Fuel
} from "lucide-react"

type RouteData = {
  id: string
  routeType?: string
  summary?: {
    lengthInMeters?: number
    travelTimeInSeconds?: number
    trafficDelayInSeconds?: number
    trafficLengthInMeters?: number
    departureTime?: string
    arrivalTime?: string
    fuelConsumptionInLiters?: number
    batteryConsumptionInkWh?: number
  }
  points: Array<[number, number]>
}

type RoutePanelProps = {
  routes: RouteData[]
  selectedRouteId: string | null
  onSelectRoute: (id: string) => void
  onStartNavigation?: (id: string) => void
  loading?: boolean
}

export function RoutePanel({ 
  routes, 
  selectedRouteId, 
  onSelectRoute, 
  onStartNavigation,
  loading = false 
}: RoutePanelProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RouteIcon className="h-5 w-5" />
            Calculating Routes...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (routes.length === 0) {
    return null
  }

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`
    }
    return `${Math.round(meters)} m`
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes} min`
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return "N/A"
    try {
      return new Date(timeString).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } catch {
      return "N/A"
    }
  }

  const getRouteTypeColor = (routeType?: string) => {
    const type = (routeType || "").toLowerCase()
    if (type.includes("fastest")) return "bg-blue-500"
    if (type.includes("eco")) return "bg-green-500"
    if (type.includes("short")) return "bg-purple-500"
    return "bg-gray-500"
  }

  const getRouteTypeIcon = (routeType?: string) => {
    const type = (routeType || "").toLowerCase()
    if (type.includes("fastest")) return <Zap className="h-4 w-4" />
    if (type.includes("eco")) return <Fuel className="h-4 w-4" />
    if (type.includes("short")) return <TrendingUp className="h-4 w-4" />
    return <RouteIcon className="h-4 w-4" />
  }

  return (
    <Card className="border-muted/50 shadow-lg bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <RouteIcon className="h-4 w-4 text-primary" />
          </div>
          Available Routes
          <Badge variant="secondary" className="ml-auto">{routes.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {routes.map((route, index) => {
              const isSelected = selectedRouteId === route.id
              const summary = route.summary || {}
              
              return (
                <Card 
                  key={route.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'ring-2 ring-primary shadow-xl scale-[1.02] bg-primary/5' 
                      : 'hover:shadow-lg hover:scale-[1.01] bg-card/80'
                  }`}
                  onClick={() => onSelectRoute(route.id)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3.5">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${getRouteTypeColor(route.routeType)} shadow-md`}>
                            <div className="text-white">
                              {getRouteTypeIcon(route.routeType)}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-bold text-base">
                              {route.routeType || `Route ${index + 1}`}
                            </h3>
                            {index === 0 && (
                              <Badge variant="secondary" className="text-[10px] mt-1 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300">
                                ⭐ Recommended
                              </Badge>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <Badge className="bg-primary text-primary-foreground shadow-sm">Selected</Badge>
                        )}
                      </div>

                      <Separator className="opacity-50" />

                      {/* Main Stats - Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/50">
                          <div className="p-1.5 rounded-md bg-background/80 mt-0.5">
                            <Clock className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Duration</p>
                            <p className="font-bold text-base mt-0.5">
                              {formatDuration(summary.travelTimeInSeconds || 0)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/50">
                          <div className="p-1.5 rounded-md bg-background/80 mt-0.5">
                            <Navigation className="h-3.5 w-3.5 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Distance</p>
                            <p className="font-bold text-base mt-0.5">
                              {formatDistance(summary.lengthInMeters || 0)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Traffic Info */}
                      {(summary.trafficDelayInSeconds || 0) > 0 && (
                        <div className="flex items-center gap-2.5 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-900">
                          <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">Traffic Delay</p>
                            <p className="text-sm font-bold text-orange-700 dark:text-orange-300">
                              +{formatDuration(summary.trafficDelayInSeconds || 0)}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Times */}
                      {(summary.departureTime || summary.arrivalTime) && (
                        <div className="flex items-center justify-between text-xs p-2 rounded-md bg-muted/30">
                          {summary.departureTime && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                              <span className="text-muted-foreground">Depart</span>
                              <span className="font-semibold">
                                {formatTime(summary.departureTime)}
                              </span>
                            </div>
                          )}
                          {summary.arrivalTime && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                              <span className="text-muted-foreground">Arrive</span>
                              <span className="font-semibold">
                                {formatTime(summary.arrivalTime)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Button */}
                      {isSelected && (
                        <Button 
                          size="sm" 
                          className="w-full h-10 shadow-md hover:shadow-lg transition-all"
                          onClick={(e) => {
                            e.stopPropagation()
                            onStartNavigation?.(route.id)
                          }}
                        >
                          <Car className="h-4 w-4 mr-2" />
                          Start Navigation
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
