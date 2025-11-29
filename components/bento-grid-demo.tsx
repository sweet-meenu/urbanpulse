"use client";

import { useMemo } from "react";
import { DatePicker } from "@heroui/date-picker";
import { DateValue, getLocalTimeZone, today } from "@internationalized/date";
import {
  IconCalendarEvent,
  IconCloud,
  IconDroplet,
  IconGauge,
  IconLeaf,
  IconRefresh,
  IconWind,
} from "@tabler/icons-react";

import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type WeatherSummary = {
  temperature?: number | null;
  humidity?: number | null;
  windSpeed?: number | null;
  pressure?: number | null;
};

export type AirQualitySummary = {
  aqi?: number | null;
  category?: string;
  pm25?: number | null;
  pm10?: number | null;
};

export type ForecastEntry = {
  iso: string;
  timeLabel: string;
  temperature?: number | null;
  humidity?: number | null;
  windSpeed?: number | null;
  pressure?: number | null;
  aqi?: number | null;
};

interface BentoGridDemoProps {
  weatherSummary: WeatherSummary | null;
  airQualitySummary: AirQualitySummary | null;
  forecast: ForecastEntry[];
  isLoading: boolean;
  selectedDate: DateValue | null;
  onDateChange: (value: DateValue | null) => void;
  onViewPredictions: () => void;
  lastUpdated?: Date | null;
  onRefresh?: () => void;
  className?: string;
}

const formatValue = (value?: number | null, unit?: string, digits = 1) =>
  value === null || value === undefined ? "—" : `${value.toFixed(digits)}${unit ?? ""}`;

const getAqiBadgeColor = (aqi?: number | null) => {
  if (aqi === null || aqi === undefined) return "bg-gray-500/20 text-gray-200";
  if (aqi <= 50) return "bg-emerald-500/10 text-emerald-300";
  if (aqi <= 100) return "bg-yellow-500/10 text-yellow-200";
  if (aqi <= 150) return "bg-orange-500/10 text-orange-200";
  if (aqi <= 200) return "bg-red-500/10 text-red-200";
  return "bg-purple-500/10 text-purple-200";
};

const BentoGridDemo = ({
  weatherSummary,
  airQualitySummary,
  forecast,
  isLoading,
  selectedDate,
  onDateChange,
  onViewPredictions,
  lastUpdated,
  onRefresh,
  className,
}: BentoGridDemoProps) => {
  const { minValue, maxValue } = useMemo(() => {
    const zone = getLocalTimeZone();
    const start = today(zone);
    return { minValue: start, maxValue: start.add({ days: 6 }) };
  }, []);

  const preview = forecast.slice(0, 4);
  const updatedAtLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "waiting for GPS";

  return (
    <div className={cn("space-y-8", className)}>
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
          Urban Pulse Insights
        </p>
        <h3 className="text-3xl font-semibold text-[hsl(var(--foreground))]">
          Live climate & air-quality intelligence
        </h3>
        <p className="text-[hsl(var(--muted-foreground))]">
          Powered by Open-Meteo & HeroUI components tailored for your current GPS location.
        </p>
      </div>

  <BentoGrid className="grid-cols-1 gap-6 md:grid-cols-3">
        <BentoCard
          name="Live Climate Snapshot"
          description="Auto-refreshes every time we lock your location."
          Icon={IconCloud}
          className="md:col-span-2"
          hideHeader
          hideCta
          background={
            <div className="relative flex h-full flex-col gap-6 rounded-[28px] bg-gradient-to-br from-emerald-500/20 via-slate-900/40 to-sky-600/10 p-6 text-left text-white">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">Live status</p>
                  <h4 className="text-2xl font-semibold">Live Climate Snapshot</h4>
                </div>
                <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80">
                  {weatherSummary ? "Stream connected" : "Awaiting GPS"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[{ label: "Temperature", value: formatValue(weatherSummary?.temperature, "°C") },
                  { label: "Humidity", value: formatValue(weatherSummary?.humidity, "%") },
                  { label: "Wind", value: formatValue(weatherSummary?.windSpeed, " km/h") },
                  { label: "Pressure", value: formatValue(weatherSummary?.pressure, " hPa") }].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                  >
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">{stat.label}</p>
                    <p className="text-4xl font-semibold">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/80">
                <p>{weatherSummary ? "Open-Meteo feed synced with your last location." : "Enable location to unlock live stats."}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-white/10 px-3 py-1">Updated {updatedAtLabel}</span>
                  {onRefresh && (
                    <button
                      type="button"
                      onClick={onRefresh}
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <IconRefresh className="h-4 w-4" />
                      Refresh
                    </button>
                  )}
                </div>
              </div>

              {isLoading && (
                <div className="absolute inset-0 rounded-[28px] bg-black/40 backdrop-blur-sm flex items-center justify-center text-sm font-medium">
                  Syncing latest data…
                </div>
              )}
            </div>
          }
        />

        <BentoCard
          name="Air Quality"
          description="US AQI feed with particulate breakdown."
          Icon={IconLeaf}
          className="md:col-span-1"
          hideHeader
          hideCta
          background={
            <div className="flex h-full flex-col gap-5 rounded-[28px] bg-gradient-to-b from-emerald-500/20 via-lime-500/10 to-slate-900/40 p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">US AQI</p>
                  <h4 className="text-3xl font-bold">Air Quality</h4>
                </div>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    getAqiBadgeColor(airQualitySummary?.aqi)
                  )}
                >
                  {airQualitySummary?.category ?? "No category"}
                </span>
              </div>

              <div>
                <p className="text-6xl font-black leading-none">
                  {airQualitySummary?.aqi ?? "—"}
                  <span className="ml-2 text-base font-medium text-white/70">/ 500</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm text-white/80">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">PM2.5</p>
                  <p className="text-2xl font-semibold">
                    {formatValue(airQualitySummary?.pm25, " μg/m³", 0)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">PM10</p>
                  <p className="text-2xl font-semibold">
                    {formatValue(airQualitySummary?.pm10, " μg/m³", 0)}
                  </p>
                </div>
              </div>
            </div>
          }
        />

        <BentoCard
          name="Forecast Planner"
          description="Pick a day to stage your commute."
          Icon={IconCalendarEvent}
          className="md:col-span-2"
          allowOverflow
          hideHeader
          hideCta
          background={
            <div className="grid h-full grid-cols-1 gap-6 rounded-[28px] bg-slate-900/50 p-6 text-white md:grid-cols-[1.05fr,0.95fr]">
              <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">Planner</p>
                  <h4 className="text-xl font-semibold">Forecast date</h4>
                </div>
                <DatePicker
                  variant="bordered"
                  color="primary"
                  classNames={{
                    label: "hidden",
                    inputWrapper: "bg-black/40 border-white/20 text-white",
                    innerWrapper: "text-white",
                    base: "w-full",
                  }}
                  popoverProps={{
                    offset: 12,
                    placement: "bottom-start",
                    shouldFlip: false,
                    classNames: {
                      base: "bg-slate-900/95 border border-white/10 backdrop-blur-2xl text-white rounded-3xl shadow-2xl",
                    },
                  }}
                  value={selectedDate ?? minValue}
                  minValue={minValue}
                  maxValue={maxValue}
                  onChange={onDateChange}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={onViewPredictions}
                >
                  View Data & Predictions
                </Button>
              </div>
              <div className="flex flex-col gap-3 overflow-auto rounded-3xl border border-white/10 bg-white/5 p-4 min-h-[220px]">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Selected day snapshot
                </p>
                {preview.length === 0 ? (
                  <p className="text-white/70 text-sm">
                    No Open-Meteo forecast for this date yet. Try another day.
                  </p>
                ) : (
                  preview.map((entry) => (
                    <div
                      key={entry.iso}
                      className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/30 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{entry.timeLabel}</p>
                        <p className="text-xs text-white/60">
                          {formatValue(entry.humidity, "%", 0)} humidity • {formatValue(entry.windSpeed, " km/h")} wind
                        </p>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {formatValue(entry.temperature, "°C")}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          }
        />

        <BentoCard
          name="Micro-insights"
          description="Quick heuristics to steer behavior."
          Icon={IconGauge}
          className="md:col-span-1"
          hideHeader
          hideCta
          background={
            <div className="flex h-full flex-col gap-4 rounded-[28px] bg-gradient-to-br from-indigo-500/20 via-slate-900/60 to-purple-700/20 p-6 text-white">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">Key takeaways</p>
                <h4 className="text-2xl font-semibold">Micro-insights</h4>
              </div>
              <ul className="space-y-4 text-sm text-white/80">
                <li className="flex items-start gap-2">
                  <IconCloud className="mt-0.5 h-4 w-4 text-sky-300" />
                  <span>Expect smoother traffic around the lowest wind windows highlighted above.</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconDroplet className="mt-0.5 h-4 w-4 text-emerald-300" />
                  <span>Humidity spikes above 80% trigger pedestrian safety notifications.</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconWind className="mt-0.5 h-4 w-4 text-cyan-300" />
                  <span>Schedule drone deliveries under 20 km/h gusts only.</span>
                </li>
              </ul>
            </div>
          }
        />
      </BentoGrid>
    </div>
  );
};

export default BentoGridDemo;
