"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { createIncident, getUserIncidents, pulseIncident } from "@/lib/firebase-admin"
import { searchLocations } from "@/app/actions/location-search"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { addToast } from "@heroui/toast"
import { IconHeartbeat } from "@tabler/icons-react"

type IncidentType = "Medical" | "Fire" | "Accident" | "Violence" | "Other"

export default function IncidentsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [type, setType] = useState<IncidentType>("Other")
  const [description, setDescription] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [locationQuery, setLocationQuery] = useState("")
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([])
  const [selectedLocation, setSelectedLocation] = useState<{ name: string; lat: number; lon: number } | null>(null)

  const [myReports, setMyReports] = useState<any[] | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    fetchMyReports()
  }, [])

  async function fetchMyReports() {
    try {
      const r = await getUserIncidents()
      setMyReports(r)
    } catch (e) {
      console.warn(e)
    }
  }

  const handleLocationSearch = async (q: string) => {
    setLocationQuery(q)
    if (q.length < 2) return setLocationSuggestions([])
    try {
      const res = await searchLocations(q)
      setLocationSuggestions(res)
    } catch (e) {
      console.warn(e)
    }
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const readers: Promise<string>[] = []
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      readers.push(new Promise((res) => {
        const r = new FileReader()
        r.onload = () => res(String(r.result))
        r.readAsDataURL(f)
      }))
    }
    Promise.all(readers).then((imgs) => setImages((prev) => [...prev, ...imgs]))
  }

  const handleSubmit = async () => {
    if (!description.trim() || !selectedLocation) return addToast({ title: "Please provide description and location", color: "danger" })
    setIsSubmitting(true)
    try {
      const id = await createIncident({
        type,
        description,
        images,
        location: { name: selectedLocation.name, lat: selectedLocation.lat, lon: selectedLocation.lon },
      })
      addToast({ title: "Incident reported", description: "Your report has been submitted.", color: "success" })
      setDescription("")
      setImages([])
      setSelectedLocation(null)
      setLocationQuery("")
      fetchMyReports()
    } catch (e) {
      console.error(e)
      addToast({ title: "Failed to report", color: "danger" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePulse = async (incidentId: string) => {
    try {
      await pulseIncident(incidentId)
      addToast({ title: "Pulsed", description: "Thanks for supporting this report", color: "success" })
      fetchMyReports()
    } catch (e) {
      console.warn(e)
      addToast({ title: "Failed", color: "danger" })
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Report Incident</h1>

      <Card className="p-6 mb-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as IncidentType)} className="mt-2 w-full p-2 border rounded">
              <option>Medical</option>
              <option>Fire</option>
              <option>Accident</option>
              <option>Violence</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-2 w-full p-2 border rounded h-28" />
          </div>

          <div>
            <label className="block text-sm font-medium">Images (optional)</label>
            <input type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} className="mt-2" />
            <div className="flex gap-2 mt-2">
              {images.map((src, idx) => (
                <img key={idx} src={src} alt={`img-${idx}`} className="h-16 w-16 object-cover rounded" />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Location</label>
            <Input placeholder="Search location" value={locationQuery} onChange={(e) => handleLocationSearch(e.target.value)} className="mt-2" />
            {locationSuggestions.length > 0 && (
              <div className="mt-2 border rounded p-2 max-h-40 overflow-auto">
                {locationSuggestions.map((s: any, i: number) => (
                  <button key={i} className="block w-full text-left p-2 hover:bg-gray-100" onClick={() => { setSelectedLocation({ name: s.name, lat: s.lat, lon: s.lon }); setLocationQuery(s.name); setLocationSuggestions([]) }}>{s.name}</button>
                ))}
              </div>
            )}
            {selectedLocation && <div className="mt-2 text-sm">Selected: {selectedLocation.name}</div>}
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Reporting..." : "Report"}</Button>
            <Link href="/community" className="px-4 py-2 border rounded">View Community Reports</Link>
          </div>
        </div>
      </Card>

      <h2 className="text-2xl font-bold mb-4">My Reports</h2>
      {!myReports ? (
        <div>Loading...</div>
      ) : myReports.length === 0 ? (
        <div>No reports yet.</div>
      ) : (
        <div className="space-y-4">
          {myReports.map((r: any) => (
            <Card key={r.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-muted">{r.type}</div>
                  <div className="font-medium">{r.description}</div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] mt-2">{r.location?.name}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <IconHeartbeat className="w-5 h-5 text-red-500" />
                    <div>{r.pulses ?? 0}</div>
                  </div>
                  <button onClick={() => handlePulse(r.id)} className="mt-2 px-3 py-1 rounded border">Pulse</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
