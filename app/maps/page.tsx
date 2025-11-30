"use client";
import { useEffect, useState, useRef } from "react"
import dynamic from "next/dynamic"
import type { LocationSuggestion } from "@/lib/tomtom"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { RouteDetails } from "@/components/maps/route-details"
import { 
  MapPin, 
  Route as RouteIcon, 
  Navigation2, 
  X, 
  Search,
  Locate,
  ArrowRight,
  Clock,
  TrendingUp,
  AlertCircle,
  Navigation,
  Zap,
  Fuel
} from "lucide-react"

const MapView = dynamic(() => import("@/components/ui/map-view"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gradient-to-br from-muted/20 to-muted/5 animate-pulse rounded-xl flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  )
})

type Incident = {
  id?: string;
  title?: string;
  description?: string;
  lat: number;
  lon: number;
  image?: string | null;
};

type RouteData = {
  id: string;
  routeType?: string;
  summary?: {
    lengthInMeters?: number;
    travelTimeInSeconds?: number;
    trafficDelayInSeconds?: number;
  };
  points: Array<[number, number]>;
  guidance?: {
    instructions?: Array<{
      routeOffsetInMeters: number;
      travelTimeInSeconds: number;
      point: { latitude: number; longitude: number };
      instructionType: string;
      street?: string;
      roadNumbers?: string[];
      maneuver: string;
      message: string;
      turnAngleInDecimalDegrees?: number;
    }>;
  };
};

type TomTomRoute = {
  routeType?: string;
  summary?: {
    lengthInMeters?: number;
    travelTimeInSeconds?: number;
    trafficDelayInSeconds?: number;
  };
  legs?: Array<{
    points?: Array<{
      latitude?: number;
      longitude?: number;
    }>;
  }>;
  guidance?: {
    instructions?: Array<{
      routeOffsetInMeters: number;
      travelTimeInSeconds: number;
      point: { latitude: number; longitude: number };
      instructionType: string;
      street?: string;
      roadNumbers?: string[];
      maneuver: string;
      message: string;
      turnAngleInDecimalDegrees?: number;
    }>;
  };
};

type IncidentResponse = {
  id?: string;
  title?: string;
  description?: string;
  lat?: number | string;
  lon?: number | string;
  image?: string | null;
};

export default function MapsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Origin state
  const [originQuery, setOriginQuery] = useState("");
  const [originSuggestions, setOriginSuggestions] = useState<LocationSuggestion[]>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const originDebounceRef = useRef<number | null>(null);
  
  // Destination state
  const [destQuery, setDestQuery] = useState("");
  const [destSuggestions, setDestSuggestions] = useState<LocationSuggestion[]>([]);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const destDebounceRef = useRef<number | null>(null);
  
  const [origin, setOrigin] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [showNavigation, setShowNavigation] = useState(false);

  // Fetch incidents
  useEffect(() => {
    let mounted = true;
    const fetchInc = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/incidents");
        const json = await res.json();
        if (!mounted) return;
        if (json?.ok && Array.isArray(json.incidents)) {
          const list = json.incidents.map((i: IncidentResponse) => ({
            id: i.id,
            title: i.title,
            description: i.description,
            lat: Number(i.lat) || 0,
            lon: Number(i.lon) || 0,
            image: i.image ?? null,
          }));
          setIncidents(list);
        }
      } catch (e) {
        console.error("fetch incidents error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchInc();
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-detect user location and center map
  useEffect(() => {
    if (!navigator.geolocation) return;
    
    // Always set center first for map viewport
    if (!center) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCenter([latitude, longitude]);
          
          // Only set origin if not already set
          if (!origin) {
            setOrigin({
              lat: latitude,
              lon: longitude,
              name: "Current Location"
            });
            setOriginQuery("Current Location");
          }
        },
        (error) => {
          console.log("Geolocation error:", error.message);
          // Fallback to default location (Mumbai)
          setCenter([19.0760, 72.8777]);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
    }
  }, [center, origin]);

  // Origin search handler
  const handleOriginSearch = async (q: string) => {
    setOriginQuery(q)
    if (q.length < 2) {
      setOriginSuggestions([])
      setShowOriginSuggestions(false)
      return
    }
    try {
      const response = await fetch(`/api/location-search?query=${encodeURIComponent(q)}`)
      const res = await response.json()
      setOriginSuggestions(Array.isArray(res) ? res : [])
      setShowOriginSuggestions(true)
    } catch (err) {
      console.error("origin suggestions error", err)
      setOriginSuggestions([])
    }
  }

  // Destination search handler
  const handleDestSearch = async (q: string) => {
    setDestQuery(q)
    if (q.length < 2) {
      setDestSuggestions([])
      setShowDestSuggestions(false)
      return
    }
    try {
      const response = await fetch(`/api/location-search?query=${encodeURIComponent(q)}`)
      const res = await response.json()
      setDestSuggestions(Array.isArray(res) ? res : [])
      setShowDestSuggestions(true)
    } catch (err) {
      console.error("dest suggestions error", err)
      setDestSuggestions([])
    }
  }

  const handleSelectOrigin = (location: LocationSuggestion) => {
    setOrigin({
      lat: location.lat,
      lon: location.lon,
      name: location.name
    });
    setOriginQuery(location.name);
    setOriginSuggestions([]);
    setShowOriginSuggestions(false);
    setCenter([location.lat, location.lon]);
  };

  const handleSelectDestination = (location: LocationSuggestion) => {
    setDestination({
      lat: location.lat,
      lon: location.lon,
      name: location.name
    });
    setDestQuery(location.name);
    setDestSuggestions([]);
    setShowDestSuggestions(false);
    if (!center) {
      setCenter([location.lat, location.lon]);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setOrigin({
          lat: latitude,
          lon: longitude,
          name: "Current Location"
        });
        setOriginQuery("Current Location");
        setCenter([latitude, longitude]);
      },
      (error) => {
        alert(`Location error: ${error.message}`);
      }
    );
  };

  const calculateRoutes = async () => {
    if (!origin || !destination) {
      alert("Please select both origin and destination");
      return;
    }

    setRoutesLoading(true);
    try {
      const url = `/api/tomtom-route?origLat=${origin.lat}&origLon=${origin.lon}&destLat=${destination.lat}&destLon=${destination.lon}&maxAlternatives=2&routeRepresentation=polyline&computeTravelTimeFor=all&instructionsType=text`;
      
      const res = await fetch(url);
      const json = await res.json();

      if (!json?.ok) throw new Error(json?.error || "Route calculation failed");

      const payload = json.data || {};
      const tomRoutes = Array.isArray(payload.routes) ? payload.routes : [];

      const normalized: RouteData[] = tomRoutes.map((r: TomTomRoute, i: number) => {
        const pts: Array<[number, number]> = [];
        try {
          for (const leg of r.legs || []) {
            if (Array.isArray(leg.points)) {
              for (const p of leg.points) {
                if (p && typeof p.latitude === "number" && typeof p.longitude === "number") {
                  pts.push([p.latitude, p.longitude]);
                }
              }
            }
          }
        } catch {}

        return {
          id: `route-${i}`,
          routeType: r.routeType || (i === 0 ? "Fastest" : `Alternative ${i}`),
          summary: r.summary || {},
          points: pts,
          guidance: r.guidance || { instructions: [] },
        };
      });

      setRoutes(normalized);
      if (normalized.length > 0) {
        setSelectedRouteId(normalized[0].id);
      }
    } catch (err) {
      console.error("routes error", err);
      alert("Failed to calculate routes");
    } finally {
      setRoutesLoading(false);
    }
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.round(meters)} m`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} min`;
  };

  const getRouteIcon = (type?: string) => {
    const t = (type || "").toLowerCase();
    if (t.includes("fastest")) return <Zap className="h-4 w-4" />;
    if (t.includes("eco")) return <Fuel className="h-4 w-4" />;
    if (t.includes("short")) return <TrendingUp className="h-4 w-4" />;
    return <RouteIcon className="h-4 w-4" />;
  };

  const getRouteColor = (type?: string) => {
    const t = (type || "").toLowerCase();
    if (t.includes("fastest")) return "from-blue-500 to-blue-600";
    if (t.includes("eco")) return "from-green-500 to-green-600";
    if (t.includes("short")) return "from-purple-500 to-purple-600";
    return "from-gray-500 to-gray-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-cyan-900/20">
      <div className="container mx-auto p-4 lg:p-6 max-w-[1800px]">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 shadow-lg shadow-blue-500/50">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
                Smart Navigation
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Plan your route with real-time traffic updates
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 lg:h-[calc(100vh-180px)]">
          {/* Control Panel */}
          <div className="space-y-4 lg:overflow-y-auto lg:max-h-full lg:pr-2">
            {/* Origin & Destination Card */}
            {/* Origin & Destination Card */}
            <Card className="shadow-2xl border-2 border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/30 dark:from-gray-800 dark:via-blue-900/10 dark:to-cyan-900/10">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                    <Navigation2 className="h-4 w-4 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    Route Planning
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Origin Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    Origin
                  </label>
                  <Input
                    value={originQuery}
                    onChange={(e) => handleOriginSearch(e.target.value)}
                    placeholder="Search starting point..."
                    className="border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  {originSuggestions.length > 0 && (
                    <div className="mt-2 border-2 border-blue-200 rounded-lg p-2 max-h-40 overflow-auto bg-white dark:bg-gray-800 shadow-lg">
                      {originSuggestions.map((s, i) => (
                        <button
                          key={i}
                          className="block w-full text-left p-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 text-sm rounded-lg transition-all"
                          onClick={() => {
                            setOrigin({ name: s.name, lat: s.lat, lon: s.lon })
                            setOriginQuery(s.name)
                            setOriginSuggestions([])
                            setShowOriginSuggestions(false)
                            setCenter([s.lat, s.lon])
                          }}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {origin && (
                    <div className="mt-2 text-sm p-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-700 dark:text-green-400 rounded-lg border border-green-300 dark:border-green-700 flex items-center justify-between">
                      <span>✓ Selected: {origin.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setOrigin(null)
                          setOriginQuery("")
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleUseCurrentLocation}
                    className="w-full mt-2"
                  >
                    <Locate className="h-4 w-4 mr-2" />
                    Use My Current Location
                  </Button>
                </div>

                <Separator />

                {/* Destination Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-red-500" />
                    Destination
                  </label>
                  <Input
                    value={destQuery}
                    onChange={(e) => handleDestSearch(e.target.value)}
                    placeholder="Search destination..."
                    className="border-2 border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  />
                  {destSuggestions.length > 0 && (
                    <div className="mt-2 border-2 border-red-200 rounded-lg p-2 max-h-40 overflow-auto bg-white dark:bg-gray-800 shadow-lg">
                      {destSuggestions.map((s, i) => (
                        <button
                          key={i}
                          className="block w-full text-left p-2 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/20 dark:hover:to-pink-900/20 text-sm rounded-lg transition-all"
                          onClick={() => {
                            setDestination({ name: s.name, lat: s.lat, lon: s.lon })
                            setDestQuery(s.name)
                            setDestSuggestions([])
                            setShowDestSuggestions(false)
                          }}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {destination && (
                    <div className="mt-2 text-sm p-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-700 dark:text-green-400 rounded-lg border border-green-300 dark:border-green-700 flex items-center justify-between">
                      <span>✓ Selected: {destination.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setDestination(null)
                          setDestQuery("")
                          setRoutes([])
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Calculate Routes Button */}
                <Button
                  onClick={calculateRoutes}
                  disabled={!origin || !destination || routesLoading}
                  className="w-full h-12 text-base shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-700 hover:via-cyan-700 hover:to-teal-700 text-white border-0 lg:sticky lg:bottom-0 lg:z-10"
                >
                  {routesLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Calculating...
                    </>
                  ) : (
                    <>
                      <RouteIcon className="h-4 w-4 mr-2" />
                      Find Routes
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Routes Card */}
            {routes.length > 0 && (
              <Card className="shadow-xl border-2 border-green-200/50 bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 dark:from-gray-800 dark:via-green-900/10 dark:to-emerald-900/10">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/50">
                        <RouteIcon className="h-4 w-4 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        Available Routes
                      </span>
                    </div>
                    <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 dark:from-green-900 dark:to-emerald-900 dark:text-green-300 border-green-300">
                      {routes.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[400px] pr-2">
                    <div className="space-y-3">
                      {routes.map((route, index) => {
                        const isSelected = selectedRouteId === route.id;
                        const summary = route.summary || {};
                        
                        return (
                          <button
                            key={route.id}
                            onClick={() => setSelectedRouteId(route.id)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                              isSelected
                                ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 shadow-lg scale-[1.02] shadow-green-500/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-green-400 hover:bg-gradient-to-br hover:from-white hover:to-green-50/50 dark:hover:to-green-900/20'
                            }`}
                          >
                            <div className="space-y-3">
                              {/* Route Header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`p-2 rounded-lg bg-gradient-to-br ${getRouteColor(route.routeType)} text-white shadow-md`}>
                                    {getRouteIcon(route.routeType)}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                      {route.routeType || `Route ${index + 1}`}
                                    </div>
                                    {index === 0 && (
                                      <div className="text-xs font-medium bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                        ⭐ Recommended
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {isSelected && (
                                  <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0">
                                    Selected
                                  </Badge>
                                )}
                              </div>

                              {/* Route Stats */}
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200/50 dark:border-blue-700/30">
                                  <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                  <div>
                                    <div className="text-xs text-blue-600/70 dark:text-blue-400/70">Duration</div>
                                    <div className="font-bold text-sm text-blue-700 dark:text-blue-300">
                                      {formatDuration(summary.travelTimeInSeconds || 0)}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200/50 dark:border-purple-700/30">
                                  <Navigation className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                  <div>
                                    <div className="text-xs text-purple-600/70 dark:text-purple-400/70">Distance</div>
                                    <div className="font-bold text-sm text-purple-700 dark:text-purple-300">
                                      {formatDistance(summary.lengthInMeters || 0)}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Traffic Warning */}
                              {(summary.trafficDelayInSeconds || 0) > 0 && (
                                <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-lg border border-orange-300/50 dark:border-orange-700/30">
                                  <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                                  <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                                    +{formatDuration(summary.trafficDelayInSeconds || 0)} traffic delay
                                  </span>
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                  
                  {/* Navigate Button */}
                  {selectedRouteId && origin && destination && (
                    <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                      <Button
                        onClick={() => setShowNavigation(true)}
                        className="w-full h-12 text-base shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white border-0"
                      >
                        <Navigation2 className="h-5 w-5 mr-2" />
                        Start Navigation
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Incidents Card */}
            <Card className="shadow-xl border-2 border-orange-200/50 bg-gradient-to-br from-white via-orange-50/30 to-red-50/30 dark:from-gray-800 dark:via-orange-900/10 dark:to-red-900/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/50">
                      <AlertCircle className="h-4 w-4 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                      Active Incidents
                    </span>
                  </div>
                  <Badge variant="secondary" className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 dark:from-orange-900 dark:to-red-900 dark:text-orange-300 border-orange-300">
                    {incidents.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-4">
                    <div className="h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className={`text-sm font-medium p-3 rounded-lg ${
                    incidents.length === 0 
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 dark:from-green-900/20 dark:to-emerald-900/20 dark:text-green-400"
                      : "bg-gradient-to-r from-orange-50 to-red-50 text-orange-700 dark:from-orange-900/20 dark:to-red-900/20 dark:text-orange-400"
                  }`}>
                    {incidents.length === 0 
                      ? "✓ No incidents in this area" 
                      : `⚠️ ${incidents.length} incident${incidents.length !== 1 ? 's' : ''} displayed on map`
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Map Section */}
          <div className="space-y-4">
            <Card className="shadow-2xl border-2 border-blue-200/50 overflow-hidden bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-900/10 dark:to-cyan-900/10">
              <MapView
                incidents={incidents}
                center={center}
                routes={routes}
                selectedRouteId={selectedRouteId}
                onSelectRoute={setSelectedRouteId}
                origin={origin}
                destination={destination}
                className="h-[500px] lg:h-[600px] w-full rounded-lg"
              />
            </Card>

            {/* Turn-by-Turn Navigation Card */}
            {showNavigation && selectedRouteId && (
              <Card className="shadow-2xl border-2 border-green-200/50 bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 dark:from-gray-800 dark:via-green-900/10 dark:to-emerald-900/10">
                <RouteDetails
                  route={routes.find(r => r.id === selectedRouteId) || null}
                  onClose={() => setShowNavigation(false)}
                />
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
