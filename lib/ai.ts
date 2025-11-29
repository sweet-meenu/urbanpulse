// lib/ai.ts
    try {
      // Try to dynamically load the official Google GenAI client (optional dependency).
      // The package may not be installed in all environments, so silence TS errors for this import.
  // @ts-expect-error - optional dependency may not be installed in some environments
  const { GoogleGenAI } = await import('@google/genai')
  // constructor types may not be available at compile time
  const ai = new GoogleGenAI({})

      // lib/ai.ts

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
            // @ts-expect-error - dynamic optional import of @google/genai
            const { GoogleGenAI } = await import('@google/genai')
            // @ts-expect-error - constructor types may not be available at compile time
            const ai = new GoogleGenAI({})

            const modelId = process.env.GEMINI_MODEL || model
            // Use the prompt provided by the caller directly (do NOT hardcode instructions here).
        // SDK types may not be available at compile time; call generateContent
        const response = await ai.models.generateContent({ model: modelId, contents: prompt })

            // The SDK shape can vary; try common locations for the textual output
            const rawText = response?.text || response?.outputText || (Array.isArray(response?.candidates) && response?.candidates[0]?.content) || JSON.stringify(response)
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
        const tempMatch = prompt.match(/Temperature: ([\d.-]+)/)
        const aqiMatch = prompt.match(/AQI: ([\d]+)/)
        const humidityMatch = prompt.match(/Humidity: ([\d.-]+)/)
        const temp = tempMatch ? parseFloat(tempMatch[1]) : 25
        const aqi = aqiMatch ? parseInt(aqiMatch[1]) : 50
        const humidity = humidityMatch ? parseFloat(humidityMatch[1]) : null

        const out: Insight[] = []
        out.push({ icon: 'target', title: 'Eco-Focus Zone', suggestion: 'Current conditions are suitable for light outdoor activity.', color: 'emerald' })
        if (temp > 32) out.push({ icon: 'sun', title: 'Heat Alert', suggestion: 'Temperature is high — stay hydrated and avoid prolonged exposure.', color: 'red' })
        if (temp < 5) out.push({ icon: 'snowflake', title: 'Cold Advisory', suggestion: 'Cold conditions — ensure heating and battery checks.', color: 'sky' })
        if (aqi > 100) out.push({ icon: 'leafOff', title: 'Air Quality Warning', suggestion: `AQI is ${aqi}. Limit strenuous outdoor exercise.`, color: 'yellow' })
        if (humidity !== null && humidity > 80) out.push({ icon: 'droplet', title: 'High Humidity', suggestion: 'Humidity is high — consider reducing outdoor tasks and stay hydrated.', color: 'cyan' })
// Compatibility shim: re-export the clean genai util.
export { getLlmInsights, type Insight } from './genai'
      }


