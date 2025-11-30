# Urban Pulse - Maps Feature Implementation Guide

## Overview
This guide provides a complete implementation of TomTom routing features with a modern shadcn UI for the Urban Pulse application.

## Features Implemented
1. **Location Search** - Autocomplete search with TomTom API
2. **Route Calculation** - Multiple route options (fastest, eco, shortest)
3. **Route Visualization** - Interactive route display on map
4. **Turn-by-Turn Navigation** - Detailed directions panel
5. **Traffic Information** - Real-time traffic delays and incidents
6. **Modern UI** - Using shadcn components throughout

## File Structure

```
components/maps/
├── location-search.tsx      # Search bar with autocomplete
├── route-panel.tsx          # Route options display
└── route-details.tsx        # Turn-by-turn directions

app/maps/
└── page.tsx                 # Main maps page

app/api/tomtom-route/
└── route.ts                 # TomTom API proxy (already exists)
```

## Implementation Steps

### 1. Create Location Search Component
File: `components/maps/location-search.tsx`

Key features:
- Autocomplete search using TomTom API
- Keyboard navigation (Arrow keys, Enter, Escape)
- Current location button
- Clean shadcn UI with Input, Button, Card components

### 2. Create Route Panel Component
File: `components/maps/route-panel.tsx`

Key features:
- Display multiple route options
- Show route stats (distance, time, traffic)
- Highlight selected route
- Start navigation button
- Consumption data (fuel/battery)
- Color-coded route types

### 3. Create Route Details Component
File: `components/maps/route-details.tsx`

Key features:
- Turn-by-turn instructions
- Maneuver icons
- Street names and road numbers
- Distance markers
- Scrollable list
- Visual timeline

### 4. Update Main Maps Page
File: `app/maps/page.tsx`

Key features:
- Three-tab interface (Search, Routes, Directions)
- Origin/Destination selection
- Route calculation
- Integration with existing MapView component
- Responsive grid layout

## API Integration

### Calculate Route Endpoint
```typescript
GET /api/tomtom-route?origLat={lat}&origLon={lon}&destLat={lat}&destLon={lon}
  &maxAlternatives=2
  &routeRepresentation=polyline
  &computeTravelTimeFor=all
  &instructionsType=text
  &sectionType=traffic
```

### Response Structure
```typescript
{
  ok: boolean,
  data: {
    routes: [{
      summary: {
        lengthInMeters: number,
        travelTimeInSeconds: number,
        trafficDelayInSeconds: number,
        departureTime: string,
        arrivalTime: string
      },
      legs: [{ points: [{ latitude, longitude }] }],
      guidance: {
        instructions: [{
          message: string,
          maneuver: string,
          street: string,
          roadNumbers: string[],
          routeOffsetInMeters: number
        }]
      }
    }]
  }
}
```

## UI Components Used

### From shadcn/ui:
- Card, CardHeader, CardTitle, CardContent
- Button (with variants: default, outline, ghost)
- Input
- Badge (with variants: default, secondary, destructive, outline)
- Tabs, TabsContent, TabsList, TabsTrigger
- Alert, AlertDescription
- ScrollArea
- Separator

### From lucide-react:
- MapPinIcon, RouteIcon, Navigation, Clock
- TurnLeft, TurnRight, MoveVertical
- Zap, Fuel, Car, AlertTriangle
- Search, X, CircleDot

## Styling

### Color Scheme:
- Fastest route: Blue (`bg-blue-500`)
- Eco route: Green (`bg-green-500`)
- Shortest route: Purple (`bg-purple-500`)
- Selected: Primary color with ring
- Traffic delay: Orange (`bg-orange-50`, `text-orange-700`)

### Layout:
- Desktop: 3-column grid (1/3 sidebar, 2/3 map)
- Mobile: Stacked layout
- Map height: `600px` on mobile, `calc(100vh-200px)` on desktop

## State Management

```typescript
// Location state
const [query, setQuery] = useState("")
const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
const [center, setCenter] = useState<[number, number] | null>(null)
const [origin, setOrigin] = useState<{lat, lon, name} | null>(null)
const [destination, setDestination] = useState<LocationSuggestion | null>(null)

// Route state
const [routes, setRoutes] = useState<RouteData[]>([])
const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
const [routesLoading, setRoutesLoading] = useState(false)

// UI state
const [activeTab, setActiveTab] = useState("search")
const [showRouteDetails, setShowRouteDetails] = useState(false)
```

## Key Functions

### handleSelectLocation
```typescript
const handleSelectLocation = (location: LocationSuggestion) => {
  setQuery(location.name)
  setSuggestions([])
  setCenter([location.lat, location.lon])
  setDestination(location)
}
```

### calculateRoutes
```typescript
const calculateRoutes = async () => {
  // 1. Get origin (current location, center, or first incident)
  // 2. Fetch routes from TomTom API
  // 3. Process and normalize route data
  // 4. Extract points from legs
  // 5. Set routes and select first one
}
```

### handleStartNavigation
```typescript
const handleStartNavigation = (routeId: string) => {
  const route = routes.find(r => r.id === routeId)
  if (route?.guidance?.instructions?.length > 0) {
    setShowRouteDetails(true)
    setActiveTab("directions")
  }
}
```

## MapView Integration

The existing `MapView` component supports:
- `routes`: Array of route objects with `points` and `id`
- `selectedRouteId`: Highlights selected route
- `onSelectRoute`: Callback when route is clicked
- Auto-fitting bounds when route is selected
- Color-coded route polylines

## Responsive Design

```css
/* Desktop (lg+) */
.lg\:col-span-1  /* Sidebar: 1/3 width */
.lg\:col-span-2  /* Map: 2/3 width */
.lg\:h-[calc(100vh-200px)]  /* Full viewport height minus padding */

/* Mobile */
.grid-cols-1  /* Stacked layout */
.h-[600px]    /* Fixed height */
```

## Error Handling

- No origin: Alert user to enable location or set origin
- No destination: Alert to select destination
- API errors: Show error message and log to console
- No route found: Display friendly message
- No instructions: Inform user that turn-by-turn not available

## Performance Optimizations

- Debounced search (250ms)
- Memoized route calculations
- Lazy loading of route details
- Efficient re-renders with proper dependencies
- ScrollArea for long lists

## Accessibility

- ARIA labels for all interactive elements
- Keyboard navigation support
- Focus management
- Screen reader friendly
- High contrast colors
- Touch-friendly tap targets (minimum 44px)

## Future Enhancements

1. **Route Preferences**
   - Avoid tolls, highways, ferries
   - Vehicle parameters (truck, bicycle, pedestrian)
   - Time-based routing (depart at/arrive by)

2. **Advanced Features**
   - Waypoints support
   - Multi-stop routes
   - Route comparison
   - Save favorite routes

3. **Real-time Updates**
   - Live traffic updates
   - Rerouting on traffic changes
   - ETA updates during navigation

4. **Voice Navigation**
   - Text-to-speech for instructions
   - Audio alerts for turns
   - Phonetic street names

5. **Offline Support**
   - Cache routes
   - Offline maps
   - Route export/import

## Testing Checklist

- [ ] Search autocomplete works
- [ ] Current location button functions
- [ ] Routes calculate correctly
- [ ] Multiple routes displayed
- [ ] Route selection highlights correctly
- [ ] Turn-by-turn shows when available
- [ ] Traffic info displays
- [ ] Map integration works
- [ ] Responsive on mobile
- [ ] Keyboard navigation
- [ ] Error states handled

## Dependencies

Already installed:
- lucide-react: ^0.454.0
- leaflet: ^1.9.4
- All shadcn components

## Environment Variables

```env
NEXT_PUBLIC_TOMTOM_API_KEY=your_key_here
TOMTOM_API_KEY=your_key_here
```

## Deployment Notes

1. Ensure TomTom API key is set
2. Check CORS settings for API routes
3. Test on various screen sizes
4. Verify map tiles load correctly
5. Monitor API usage and rate limits

---

## Quick Start

1. Copy the three component files to `components/maps/`
2. Copy the maps page to `app/maps/page.tsx`
3. Ensure all dependencies are installed
4. Set environment variables
5. Run `npm run dev`
6. Navigate to `/maps`

That's it! You now have a fully functional routing and navigation system with a modern, beautiful UI.
