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
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            className="pl-10 pr-10 h-12 bg-background/50 border-muted-foreground/20 focus:border-primary transition-colors"
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
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
              onClick={() => {
                onChange("")
                setIsFocused(false)
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          {showCurrentLocation && (
            <Button 
              variant="outline" 
              onClick={onCurrentLocation}
              title="Use current location"
              className="h-12 px-4 border-muted-foreground/20 hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all"
            >
              <Navigation2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline text-sm">My Location</span>
            </Button>
          )}
        </div>
      </div>

      {loading && (
        <div className="absolute top-full left-0 right-0 mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span>Searching...</span>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 p-0 shadow-2xl border-muted/50 backdrop-blur-sm bg-card/95">
          <ScrollArea className="max-h-[400px]">
            <ul 
              id="location-suggestions-list" 
              className="p-2"
              role="listbox"
            >
              {suggestions.map((suggestion, idx) => (
                <li
                  key={suggestion.id}
                  id={`suggestion-${idx}`}
                  role="option"
                  aria-selected={idx === activeIndex}
                  className={`
                    flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all
                    ${idx === activeIndex 
                      ? "bg-primary/15 border-primary/50 shadow-md scale-[1.02]" 
                      : "hover:bg-accent/50 border-transparent"
                    }
                    border
                  `}
                  onClick={() => handleSelect(suggestion)}
                  onMouseEnter={() => setActiveIndex(idx)}
                >
                  <div className={`mt-0.5 p-2 rounded-lg ${idx === activeIndex ? 'bg-primary/20' : 'bg-muted/50'}`}>
                    <MapPin className={`h-4 w-4 ${idx === activeIndex ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm leading-tight">{suggestion.name}</div>
                    {suggestion.address && (
                      <div className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                        {suggestion.address}
                      </div>
                    )}
                  </div>
                  {idx === 0 && (
                    <Badge variant="default" className="text-xs shrink-0 bg-primary/20 text-primary border-primary/30">
                      Top
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
