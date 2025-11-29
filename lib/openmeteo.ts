// Open-Meteo API utilities for weather and location data
export interface WeatherData {
  temperature: number
  humidity: number
  windSpeed: number
  weatherCode: number
  condition: string
  uvIndex: number
  apparentTemperature: number
  precipitation: number
}

export interface LocationWeatherData {
  current: WeatherData
  daily: {
    temperature2mMax: number[]
    temperature2mMin: number[]
    weatherCode: number[]
  }
  timezone: string
}

// Get weather data for a location
export async function getWeatherData(latitude: number, longitude: number): Promise<LocationWeatherData> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,uv_index,apparent_temperature,precipitation&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`,
    )

    if (!response.ok) throw new Error("Failed to fetch weather data")

    const data = await response.json()

    const weatherCode = data.current.weather_code
    const condition = getWeatherCondition(weatherCode)

    return {
      current: {
        temperature: Math.round(data.current.temperature_2m),
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m * 10) / 10,
        weatherCode,
        condition,
        uvIndex: data.current.uv_index,
        apparentTemperature: Math.round(data.current.apparent_temperature),
        precipitation: data.current.precipitation,
      },
      daily: {
        temperature2mMax: data.daily.temperature_2m_max,
        temperature2mMin: data.daily.temperature_2m_min,
        weatherCode: data.daily.weather_code,
      },
      timezone: data.timezone,
    }
  } catch (error) {
    console.error("Error fetching weather data:", error)
    throw error
  }
}

// Get reverse geocoding for coordinates
export async function getReverseGeocoding(latitude: number, longitude: number) {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=en`,
    )

    if (!response.ok) throw new Error("Failed to fetch location data")

    const data = await response.json()
    return data.results?.[0] || null
  } catch (error) {
    console.error("Error fetching location data:", error)
    throw error
  }
}

// Convert weather code to human-readable condition
function getWeatherCondition(code: number): string {
  const weatherCodes: { [key: number]: string } = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Foggy with rime",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Thunderstorm with hail",
  }

  return weatherCodes[code] || "Unknown"
}
