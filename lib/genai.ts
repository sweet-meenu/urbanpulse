// lib/genai.ts

/**
 * Interface for the expected JSON output from the LLM.
 */
export interface Insight {
  icon: string // Tabler icon name (e.g., 'cloud', 'droplet', 'wind', 'sun')
  title: string
  suggestion: string
  color: 'sky' | 'emerald' | 'cyan' | 'yellow' | 'red'
}

/**
 * Call Gemini / Google Generative Language API to generate structured insights.
 * This function accepts the caller-provided prompt verbatim and returns a parsed
 * array of Insight objects when possible, otherwise falls back to a small heuristic.
 *
 * Environment:
 * - GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY (optional)
 * - GEMINI_MODEL (optional, defaults to text-bison-001)
 */
export async function getLlmInsights(prompt: string): Promise<Insight[]> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
  const model = process.env.GEMINI_MODEL || 'text-bison-001'
  console.debug('[LLM] generating insights with model', model)

  if (apiKey) {
    try {
      // Dynamically import the Google GenAI SDK (optional dependency).
      // The import is optional so this module can run even if @google/genai is not installed.
  const { GoogleGenAI } = await import('@google/genai')
      // constructor types may not be available at compile time
      const ai = new GoogleGenAI({})

      const modelId = process.env.GEMINI_MODEL || model
      // Use the prompt provided by the caller directly (do NOT hardcode instructions here).
      // SDK types may not be available at compile time; call generateContent
      const response = await ai.models.generateContent({ model: modelId, contents: prompt })

      // The SDK shape can vary; try common locations for the textual output
  const rawText = response?.text || (Array.isArray(response?.candidates) && response?.candidates[0]?.content) || JSON.stringify(response)
      const raw = typeof rawText === 'string' ? rawText : JSON.stringify(rawText)

      // Try to extract JSON substring if model wrapped it in markdown
      const jsonMatch = raw.match(/(\[\s*\{[\s\S]*\}\s*\])/m)
      const toParse = jsonMatch ? jsonMatch[1] : raw

      try {
        const parsed = JSON.parse(toParse)
        if (Array.isArray(parsed)) return parsed.slice(0, 4) as Insight[]
      } catch (err) {
        console.warn('[LLM] failed to parse JSON from model output, falling back', err)
        return fallbackInsights(prompt)
      }
    } catch (err) {
      console.error('[LLM] error calling Gemini via SDK', err)
      return fallbackInsights(prompt)
    }
  }

  // no API key configured — use local heuristic
  return fallbackInsights(prompt)
}

function fallbackInsights(prompt: string): Insight[] {
  // Very small, deterministic heuristic fallback so UI still shows helpful tips.
  const tempMatch = prompt.match(/Temperature: ([0-9.-]+)/)
  const aqiMatch = prompt.match(/AQI: (\d+)/)
  const humidityMatch = prompt.match(/Humidity: ([0-9.-]+)/)
  const temp = tempMatch ? parseFloat(tempMatch[1]) : 25
  const aqi = aqiMatch ? parseInt(aqiMatch[1]) : 50
  const humidity = humidityMatch ? parseFloat(humidityMatch[1]) : 50

  const insights: Insight[] = []
  if (temp >= 30) {
    insights.push({ icon: 'sun', title: 'Hot day', suggestion: 'Consider shading and cooling measures for outdoor activities.', color: 'yellow' })
  } else if (temp <= 5) {
    insights.push({ icon: 'cloud', title: 'Cold day', suggestion: 'Provide heated shelters and warn users about low temperatures.', color: 'cyan' })
  }

  if (aqi >= 150) {
    insights.push({ icon: 'mask', title: 'Unhealthy air', suggestion: 'Air quality is poor — recommend limiting outdoor exposure and wearing masks.', color: 'red' })
  } else if (aqi >= 100) {
    insights.push({ icon: 'alert-circle', title: 'Moderate pollution', suggestion: 'Air quality is moderate — sensitive groups should take care.', color: 'yellow' })
  } else {
    insights.push({ icon: 'leaf', title: 'Good air', suggestion: 'Air quality is good — normal activities are fine.', color: 'emerald' })
  }

  if (humidity >= 80) {
    insights.push({ icon: 'droplet', title: 'High humidity', suggestion: 'High humidity — ensure hydration and ventilation.', color: 'sky' })
  }

  return insights.slice(0, 4)
}
