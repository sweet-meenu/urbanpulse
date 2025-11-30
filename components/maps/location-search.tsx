"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, MapPin, X, Navigation2 } from "lucide-react"
import type { LocationSuggestion } from "@/lib/tomtom"

type LocationSearchProps = {
  value: string
  onChange: (value: string) => void
  onSelect: (location: LocationSuggestion) => void
  onSearch: () => void
  suggestions: LocationSuggestion[]
  loading?: boolean
  placeholder?: string
  showCurrentLocation?: boolean
  onCurrentLocation?: () => void
}

export function LocationSearch({
  value,
  onChange,
  onSelect,
  onSearch,
  suggestions,
  loading = false,
  placeholder = "Search location...",
  showCurrentLocation = true,
  onCurrentLocation
}: LocationSearchProps) {
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isFocused, setIsFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Compute whether to show suggestions based on focus and suggestions length
  const showSuggestions = isFocused && suggestions.length > 0

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault()
        onSearch()
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
        break
      case "ArrowUp":
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
        break
      case "Enter":
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          onSelect(suggestions[activeIndex])
          setIsFocused(false)
        } else {
          onSearch()
        }
        break
      case "Escape":
        e.preventDefault()
        setIsFocused(false)
        break
    }
  }

  const handleSelect = (suggestion: LocationSuggestion) => {
    onSelect(suggestion)
    setIsFocused(false)
    setActiveIndex(-1)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setIsFocused(true)}
            placeholder={placeholder}
            className="pl-10 pr-10"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-controls="location-suggestions-list"
            aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
          />
          {value && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => {
                onChange("")
                setIsFocused(false)
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <Button onClick={onSearch} disabled={!value || loading}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>

        {showCurrentLocation && (
          <Button 
            variant="outline" 
            onClick={onCurrentLocation}
            title="Use current location"
          >
            <Navigation2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {loading && (
        <div className="absolute top-full left-0 right-0 mt-2 text-sm text-muted-foreground">
          Searching...
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 p-0 shadow-lg">
          <ScrollArea className="max-h-[300px]">
            <ul 
              id="location-suggestions-list" 
              className="p-1"
              role="listbox"
            >
              {suggestions.map((suggestion, idx) => (
                <li
                  key={suggestion.id}
                  id={`suggestion-${idx}`}
                  role="option"
                  aria-selected={idx === activeIndex}
                  className={`
                    flex items-start gap-3 p-3 rounded-md cursor-pointer transition-colors
                    ${idx === activeIndex ? "bg-accent" : "hover:bg-accent/50"}
                  `}
                  onClick={() => handleSelect(suggestion)}
                  onMouseEnter={() => setActiveIndex(idx)}
                >
                  <MapPin className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{suggestion.name}</div>
                    {suggestion.address && (
                      <div className="text-sm text-muted-foreground truncate">
                        {suggestion.address}
                      </div>
                    )}
                  </div>
                  {idx === 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Best
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </ScrollArea>
        </Card>
      )}
    </div>
  )
}
