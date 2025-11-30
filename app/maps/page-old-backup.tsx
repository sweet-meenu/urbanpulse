"use client";
import { useEffect, useState, useRef } from "react"
import dynamic from "next/dynamic"
import type { LocationSuggestion } from "@/lib/tomtom"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  MapPin, 
  Route as RouteIcon, 
  Navigation, 
  X, 
  Search,
  MapPinned,
  Locate,
  ArrowRight,
  Clock,
  TrendingUp,
  AlertCircle,
  MapPinIcon
} from "lucide-react"
import { LocationSearch } from "@/components/maps/location-search";
import { RoutePanel } from "@/components/maps/route-panel";

// Dynamically import MapView with SSR disabled
const MapView = dynamic(() => import("@/components/ui/map-view"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted/20 animate-pulse rounded-lg flex items-center justify-center">
    <div className="text-muted-foreground">Loading map...</div>
  </div>
})

type Incident = {
  id?: string;
  title?: string;
  description?: string;
  lat: number;
  lon: number;
  image?: string | null;
};

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

type RouteData = {
  id: string;
  routeType?: string;
  summary?: {
    lengthInMeters?: number;
    travelTimeInSeconds?: number;
    trafficDelayInSeconds?: number;
    trafficLengthInMeters?: number;
    departureTime?: string;
    arrivalTime?: string;
  };
  guidance?: {
    instructions?: Instruction[];
  };
  points: Array<[number, number]>;
  raw?: unknown;
};

export default function MapsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [origin, setOrigin] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [destination, setDestination] = useState<LocationSuggestion | null>(null);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("search");

  useEffect(() => {
    let mounted = true;
    const fetchInc = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/incidents");
        const json = await res.json();
        if (!mounted) return;
        if (json?.ok && Array.isArray(json.incidents)) {
          type IncidentRaw = {
            id?: string;
            title?: string;
            description?: string;
            lat?: number | string;
            lon?: number | string;
            image?: string | null;
          };

          const list = json.incidents.map((i: IncidentRaw) => ({
            id: i.id,
            title: i.title,
            description: i.description,
            lat: Number(i.lat) || 0,
            lon: Number(i.lon) || 0,
            image: i.image ?? null,
          }));
          setIncidents(list);
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void fetchInc();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsSuggestLoading(false);
      return;
    }

    setIsSuggestLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/location-search?query=${encodeURIComponent(query)}`);
        const res = await response.json();
        setSuggestions(res);
      } catch (err) {
        console.error("suggestions error", err);
        setSuggestions([]);
      } finally {
        setIsSuggestLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelectLocation = (location: LocationSuggestion) => {
    setQuery(location.name);
    setSuggestions([]);
    setCenter([location.lat, location.lon]);
    setDestination(location);
  };

  const handleSearch = async () => {
    if (!query || query.trim().length === 0) return;
    try {
      const response = await fetch(`/api/location-search?query=${encodeURIComponent(query)}`);
      const results = await response.json();
      if (results && results.length > 0) {
        handleSelectLocation(results[0]);
      }
    } catch (err) {
      console.error("search error", err);
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setOrigin({ lat, lon, name: "Current Location" });
        setCenter([lat, lon]);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to get your location");
      }
    );
  };

  const calculateRoutes = async () => {
    if (!destination) {
      alert("Please select a destination");
      return;
    }

    setRoutesLoading(true);
    setActiveTab("routes");

    try {
      let origLat: number;
      let origLon: number;

      if (origin) {
        origLat = origin.lat;
        origLon = origin.lon;
      } else if (center) {
        origLat = center[0];
        origLon = center[1];
      } else if (incidents.length) {
        origLat = incidents[0].lat;
        origLon = incidents[0].lon;
      } else {
        throw new Error("No origin available");
      }

      const destLat = destination.lat;
      const destLon = destination.lon;

      const url = `/api/tomtom-route?origLat=${origLat}&origLon=${origLon}&destLat=${destLat}&destLon=${destLon}&maxAlternatives=2&routeRepresentation=polyline&computeTravelTimeFor=all&instructionsType=text&sectionType=traffic`;

      const res = await fetch(url);
      const json = await res.json();

      if (!json?.ok) throw new Error(json?.error || "TomTom error");

      const payload = json.data || {};
      const tomRoutes = Array.isArray(payload.routes) ? payload.routes : [];

      type TomTomRoute = Record<string, unknown> & {
        routeType?: string;
        summary?: Record<string, unknown>;
        guidance?: Record<string, unknown>;
        legs?: Array<{ points?: Array<{ latitude?: number; longitude?: number }> }>;
      };

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
        } catch {
          // ignore
        }

        return {
          id: `route-${i}`,
          routeType: r.routeType || (i === 0 ? "Fastest" : `Alternative ${i}`),
          summary: r.summary || {},
          guidance: r.guidance || {},
          points: pts,
          raw: r,
        };
      });

      setRoutes(normalized);
      if (normalized.length > 0) {
        setSelectedRouteId(normalized[0].id);
      }
    } catch (err) {
      console.error("routes error", err);
      alert("Failed to calculate routes. Please try again.");
    } finally {
      setRoutesLoading(false);
    }
  };

  const handleStartNavigation = (routeId: string) => {
    const route = routes.find((r) => r.id === routeId);
    if (!route) return;

    if (route.guidance?.instructions && route.guidance.instructions.length > 0) {
      setShowRouteDetails(true);
      setActiveTab("directions");
    } else {
      alert("Turn-by-turn directions not available for this route");
    }
  };

  const selectedRoute = selectedRouteId ? routes.find((r) => r.id === selectedRouteId) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <MapPinIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Urban Pulse Maps
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                Navigate the city with real-time traffic and incident information
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-11 bg-muted/50">
                <TabsTrigger value="search" className="text-xs sm:text-sm data-[state=active]:bg-background">
                  <MapPinIcon className="h-3.5 w-3.5 sm:mr-2" />
                  <span className="hidden sm:inline">Search</span>
                </TabsTrigger>
                <TabsTrigger value="routes" className="text-xs sm:text-sm data-[state=active]:bg-background">
                  <RouteIcon className="h-3.5 w-3.5 sm:mr-2" />
                  <span className="hidden sm:inline">Routes</span>
                </TabsTrigger>
                <TabsTrigger value="directions" className="text-xs sm:text-sm data-[state=active]:bg-background">
                  <RouteIcon className="h-3.5 w-3.5 sm:mr-2" />
                  <span className="hidden sm:inline">Directions</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="space-y-4 mt-4">
                <Card className="border-muted/50 shadow-lg bg-card/50 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <MapPinIcon className="h-4 w-4 text-primary" />
                      </div>
                      Find Destination
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <LocationSearch
                      value={query}
                      onChange={setQuery}
                      onSelect={handleSelectLocation}
                      onSearch={handleSearch}
                      suggestions={suggestions}
                      loading={isSuggestLoading}
                      placeholder="Search for a location..."
                      showCurrentLocation
                      onCurrentLocation={handleCurrentLocation}
                    />

                    {origin && (
                      <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-600 rounded-full shrink-0 animate-pulse"></div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">Origin</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{origin.name}</div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setOrigin(null)} className="h-7 w-7 p-0">
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </Alert>
                    )}

                    {destination && (
                      <div className="space-y-3">
                        <Alert className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
                          <div className="flex items-center gap-2">
                            <MapPinIcon className="h-4 w-4 text-red-600 shrink-0" />
                            <div className="flex-1">
                              <div className="font-semibold text-sm">{destination.name}</div>
                              {destination.address && (
                                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{destination.address}</div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDestination(null);
                                setQuery("");
                                setRoutes([]);
                              }}
                              className="h-7 w-7 p-0"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </Alert>

                        <Button 
                          className="w-full h-11 shadow-md hover:shadow-lg transition-all" 
                          size="lg" 
                          onClick={calculateRoutes} 
                          disabled={routesLoading}
                        >
                          {routesLoading ? (
                            <>
                              <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-sm sm:text-base">Calculating...</span>
                            </>
                          ) : (
                            <>
                              <RouteIcon className="h-4 w-4 mr-2" />
                              <span className="text-sm sm:text-base">Calculate Routes</span>
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-muted/50 shadow-lg bg-card/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-orange-500/10">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-600">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                        </div>
                        <span>Active Incidents</span>
                      </div>
                      <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                        {incidents.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {incidents.length === 0 ? (
                          <div className="text-center py-4">
                            <p className="text-muted-foreground">No active incidents in this area</p>
                          </div>
                        ) : (
                          <p>{incidents.length} active incident{incidents.length !== 1 ? 's' : ''} displayed on the map</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="routes" className="mt-4">
                <RoutePanel
                  routes={routes}
                  selectedRouteId={selectedRouteId}
                  onSelectRoute={setSelectedRouteId}
                  onStartNavigation={handleStartNavigation}
                  loading={routesLoading}
                />
              </TabsContent>

              <TabsContent value="directions" className="mt-4">
                {showRouteDetails && selectedRoute ? (
                  <RouteDetails route={selectedRoute} onClose={() => setShowRouteDetails(false)} />
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <RouteIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-muted-foreground">
                        Select a route and start navigation to see turn-by-turn directions
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Map Section */}
          <div className="lg:col-span-2 order-first lg:order-last">
            <Card className="overflow-hidden border-muted/50 shadow-2xl bg-card/50 backdrop-blur-sm">
              <MapView
                incidents={incidents}
                center={center}
                routes={routes}
                selectedRouteId={selectedRouteId}
                onSelectRoute={setSelectedRouteId}
                origin={origin}
                destination={destination}
                className="h-[400px] sm:h-[500px] md:h-[600px] lg:h-[calc(100vh-200px)] w-full rounded-lg"
              />
            </Card>
          </div>
        </div>
      </div>

      {/* Add custom styles for map markers */}
      <style jsx global>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 0.75rem;
          padding: 0;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        }
        .custom-popup .leaflet-popup-tip {
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        }
        .custom-tooltip {
          background-color: rgba(0, 0, 0, 0.8);
          border: none;
          border-radius: 0.5rem;
          color: white;
          font-size: 0.875rem;
          padding: 0.5rem 0.75rem;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        }
        .custom-tooltip::before {
          border-top-color: rgba(0, 0, 0, 0.8);
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
        }
        .leaflet-control-zoom a {
          border-radius: 0.5rem !important;
          border: none !important;
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
        }
        .leaflet-bar a:first-child {
          border-top-left-radius: 0.5rem !important;
          border-top-right-radius: 0.5rem !important;
        }
        .leaflet-bar a:last-child {
          border-bottom-left-radius: 0.5rem !important;
          border-bottom-right-radius: 0.5rem !important;
        }
      `}</style>
    </div>
  );
}
