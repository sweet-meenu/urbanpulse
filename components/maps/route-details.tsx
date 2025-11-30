"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Navigation, 
  ArrowRight, 
  ArrowDownLeft,
  ArrowDownRight,
  MoveVertical,
  CircleDot,
  MapPin,
  X
} from "lucide-react"

type Instruction = {
  routeOffsetInMeters: number
  travelTimeInSeconds: number
  point: { latitude: number; longitude: number }
  instructionType: string
  street?: string
  roadNumbers?: string[]
  maneuver: string
  message: string
  turnAngleInDecimalDegrees?: number
}

type RouteDetailsProps = {
  route: {
    id: string
    routeType?: string
    summary?: {
      lengthInMeters?: number
      travelTimeInSeconds?: number
      trafficDelayInSeconds?: number
    }
    guidance?: {
      instructions?: Instruction[]
    }
  } | null
  onClose: () => void
}

export function RouteDetails({ route, onClose }: RouteDetailsProps) {
  if (!route) return null

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`
    }
    return `${Math.round(meters)} m`
  }

  const getManeuverIcon = (maneuver: string) => {
    const m = maneuver.toUpperCase()
    
    if (m.includes("LEFT")) {
      return <ArrowDownLeft className="h-5 w-5" />
    }
    if (m.includes("RIGHT")) {
      return <ArrowDownRight className="h-5 w-5" />
    }
    if (m.includes("STRAIGHT") || m.includes("FOLLOW")) {
      return <MoveVertical className="h-5 w-5" />
    }
    if (m.includes("ARRIVE")) {
      return <MapPin className="h-5 w-5 text-green-500" />
    }
    if (m.includes("DEPART")) {
      return <CircleDot className="h-5 w-5 text-blue-500" />
    }
    
    return <ArrowRight className="h-5 w-5" />
  }

  const instructions = route.guidance?.instructions || []
  const summary = route.summary || {}

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Turn-by-Turn Directions
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 pt-2">
          <Badge variant="secondary">
            {route.routeType || "Route"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {formatDistance(summary.lengthInMeters || 0)}
          </span>
          {(summary.trafficDelayInSeconds || 0) > 0 && (
            <Badge variant="destructive" className="text-xs">
              +{Math.round((summary.trafficDelayInSeconds || 0) / 60)}m delay
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {instructions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Navigation className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No turn-by-turn instructions available</p>
                <p className="text-sm mt-1">
                  Enable guidance in route options to see detailed directions
                </p>
              </div>
            ) : (
              instructions.map((instruction, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {getManeuverIcon(instruction.maneuver)}
                    </div>
                    {index < instructions.length - 1 && (
                      <div className="w-0.5 h-full bg-border my-1 flex-1" />
                    )}
                  </div>

                  <div className="flex-1 pb-4">
                    <div className="font-medium mb-1">
                      {instruction.message}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {instruction.street && (
                        <span className="font-medium">
                          {instruction.street}
                        </span>
                      )}
                      {instruction.roadNumbers && instruction.roadNumbers.length > 0 && (
                        <div className="flex gap-1">
                          {instruction.roadNumbers.map((num, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {num}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDistance(instruction.routeOffsetInMeters)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
