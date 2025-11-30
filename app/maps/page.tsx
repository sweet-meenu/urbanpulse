"use client";
import { useEffect, useState, useRef } from "react"
import dynamic from "next/dynamic"
import { searchLocationsAction } from "@/app/actions/location-search"
import type { LocationSuggestion } from "@/lib/tomtom"
import { LocationSearch } from "@/components/maps/location-search"
import { RoutePanel } from "@/components/maps/route-panel"
import { RouteDetails } from "@/components/maps/route-details"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Dynamically import MapView with SSR disabled to avoid Leaflet SSR issues
const MapView = dynamic(() => import("@/components/ui/map-view"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse" />
})
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPinIcon, RouteIcon, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
        const res = await searchLocationsAction(query);
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
      const results = await searchLocationsAction(query);
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">Urban Pulse Maps</h1>
          <p className="text-muted-foreground">Navigate the city with real-time traffic and incident information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="search">Search</TabsTrigger>
                <TabsTrigger value="routes">Routes</TabsTrigger>
                <TabsTrigger value="directions">Directions</TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPinIcon className="h-5 w-5" />
                      Destination
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
                      placeholder="Where do you want to go?"
                      showCurrentLocation
                      onCurrentLocation={handleCurrentLocation}
                    />

                    {origin && (
                      <Alert>
                        <MapPinIcon className="h-4 w-4" />
                        <AlertDescription>
                          <div className="flex items-center justify-between">
                            <span>Origin: {origin.name}</span>
                            <Button variant="ghost" size="sm" onClick={() => setOrigin(null)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {destination && (
                      <div className="space-y-3">
                        <Alert className="bg-primary/5">
                          <MapPinIcon className="h-4 w-4" />
                          <AlertDescription>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold">{destination.name}</div>
                                {destination.address && (
                                  <div className="text-xs text-muted-foreground mt-1">{destination.address}</div>
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
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </AlertDescription>
                        </Alert>

                        <Button className="w-full" size="lg" onClick={calculateRoutes} disabled={routesLoading}>
                          <RouteIcon className="h-4 w-4 mr-2" />
                          {routesLoading ? "Calculating..." : "Find Routes"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Incidents</span>
                      <Badge variant="secondary">{incidents.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-4">Loading incidents...</div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {incidents.length} active incidents shown on map
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

          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <MapView
                incidents={incidents}
                center={center}
                routes={routes}
                selectedRouteId={selectedRouteId}
                onSelectRoute={setSelectedRouteId}
                className="h-[600px] lg:h-[calc(100vh-200px)] w-full"
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
