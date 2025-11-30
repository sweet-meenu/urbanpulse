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
  MapPin,
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RouteIcon className="h-5 w-5" />
          Available Routes ({routes.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {routes.map((route, index) => {
              const isSelected = selectedRouteId === route.id
              const summary = route.summary || {}
              
              return (
                <Card 
                  key={route.id}
                  className={`cursor-pointer transition-all ${
                    isSelected 
                      ? 'ring-2 ring-primary shadow-lg' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => onSelectRoute(route.id)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-full ${getRouteTypeColor(route.routeType)}`}>
                            <div className="text-white">
                              {getRouteTypeIcon(route.routeType)}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold">
                              {route.routeType || `Route ${index + 1}`}
                            </h3>
                            {index === 0 && (
                              <Badge variant="secondary" className="text-xs">
                                Recommended
                              </Badge>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <Badge variant="default">Selected</Badge>
                        )}
                      </div>

                      <Separator />

                      {/* Main Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Duration</p>
                            <p className="font-semibold">
                              {formatDuration(summary.travelTimeInSeconds || 0)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Navigation className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Distance</p>
                            <p className="font-semibold">
                              {formatDistance(summary.lengthInMeters || 0)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Traffic Info */}
                      {(summary.trafficDelayInSeconds || 0) > 0 && (
                        <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Traffic Delay</p>
                            <p className="text-sm font-medium text-orange-700">
                              +{formatDuration(summary.trafficDelayInSeconds || 0)}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Times */}
                      {(summary.departureTime || summary.arrivalTime) && (
                        <div className="flex items-center justify-between text-xs">
                          {summary.departureTime && (
                            <div>
                              <span className="text-muted-foreground">Depart: </span>
                              <span className="font-medium">
                                {formatTime(summary.departureTime)}
                              </span>
                            </div>
                          )}
                          {summary.arrivalTime && (
                            <div>
                              <span className="text-muted-foreground">Arrive: </span>
                              <span className="font-medium">
                                {formatTime(summary.arrivalTime)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Consumption */}
                      {(summary.fuelConsumptionInLiters || summary.batteryConsumptionInkWh) && (
                        <div className="flex items-center gap-2 text-xs">
                          <Fuel className="h-3 w-3 text-muted-foreground" />
                          {summary.fuelConsumptionInLiters && (
                            <span>
                              {summary.fuelConsumptionInLiters.toFixed(1)} L
                            </span>
                          )}
                          {summary.batteryConsumptionInkWh && (
                            <span>
                              {summary.batteryConsumptionInkWh.toFixed(1)} kWh
                            </span>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      {isSelected && (
                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              onStartNavigation?.(route.id)
                            }}
                          >
                            <Car className="h-4 w-4 mr-2" />
                            Start Navigation
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Zoom to route bounds - handled by map
                            }}
                          >
                            <MapPin className="h-4 w-4" />
                          </Button>
                        </div>
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
