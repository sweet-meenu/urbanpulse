"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { createIncident, getUserIncidents, pulseIncident } from "@/lib/firebase-admin"
import { getActiveTasks, updateTaskProgress, type Task } from "@/lib/gamification"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { addToast } from "@heroui/toast"
import { IconHeartbeat } from "@tabler/icons-react"
import { RewardDialog } from "@/components/reward-dialog"

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
  
  // Gamification state
  const [showReward, setShowReward] = useState(false)
  const [rewardData, setRewardData] = useState<{
    xpAwarded?: number
    tokensAwarded?: number
    taskTitle?: string
    levelUp?: boolean
    newLevel?: number
  }>({})
  const [tasks, setTasks] = useState<{ daily: Task[]; special: Task[] }>({ daily: [], special: [] })

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    fetchMyReports()
    loadTasks()
  }, [])

  async function loadTasks() {
    try {
      const activeTasks = await getActiveTasks()
      setTasks(activeTasks)
    } catch (e) {
      console.warn("Could not load tasks:", e)
    }
  }

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
      const response = await fetch(`/api/location-search?query=${encodeURIComponent(q)}`)
      const res = await response.json()
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
      await createIncident({
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

      // Track incident creation task progress
      const incidentTask = tasks.daily.find(t => t.category === "incident") || tasks.special.find(t => t.category === "incident")
      if (incidentTask) {
        const result = await updateTaskProgress(incidentTask.id)
        if (result.completed) {
          setRewardData({
            xpAwarded: result.xpAwarded || 0,
            tokensAwarded: result.tokensAwarded || 0,
            taskTitle: incidentTask.title
          })
          setShowReward(true)
        }
      }
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

      // Track pulse task progress
      const pulseTask = tasks.daily.find(t => t.category === "pulse") || tasks.special.find(t => t.category === "pulse")
      if (pulseTask) {
        const result = await updateTaskProgress(pulseTask.id)
        if (result.completed) {
          setRewardData({
            xpAwarded: result.xpAwarded || 0,
            tokensAwarded: result.tokensAwarded || 0,
            taskTitle: pulseTask.title,
            levelUp: false,
            newLevel: undefined
          })
          setShowReward(true)
        }
      }
    } catch (e) {
      console.warn(e)
      addToast({ title: "Failed", color: "danger" })
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-orange-900/20 dark:to-red-900/20">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 shadow-lg shadow-orange-500/50">
              <IconHeartbeat className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            Report Incident
          </h1>
        </div>

      <Card className="p-4 sm:p-6 mb-6 sm:mb-8 shadow-xl border-2 border-orange-200/50 bg-gradient-to-br from-white via-orange-50/30 to-red-50/30 dark:from-gray-800 dark:via-orange-900/10 dark:to-red-900/10">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as IncidentType)} className="mt-2 w-full p-2 border-2 border-orange-200 focus:border-orange-500 rounded-lg text-sm sm:text-base bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500/20 transition-all">
              <option>Medical</option>
              <option>Fire</option>
              <option>Accident</option>
              <option>Violence</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-2 w-full p-2 border-2 border-orange-200 focus:border-orange-500 rounded-lg h-24 sm:h-28 text-sm sm:text-base bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500/20 transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Images (optional)</label>
            <input type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} className="mt-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-orange-500 file:to-red-500 file:text-white hover:file:from-orange-600 hover:file:to-red-600 file:cursor-pointer file:shadow-lg file:transition-all" />
            <div className="flex flex-wrap gap-2 mt-2">
              {images.map((src, idx) => (
                <div key={idx} className="relative group">
                  <img src={src} alt={`img-${idx}`} className="h-14 w-14 sm:h-16 sm:w-16 object-cover rounded-lg border-2 border-orange-300 shadow-md" />
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Location</label>
            <Input placeholder="Search location" value={locationQuery} onChange={(e) => handleLocationSearch(e.target.value)} className="mt-2 border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20" />
            {locationSuggestions.length > 0 && (
              <div className="mt-2 border-2 border-orange-200 rounded-lg p-2 max-h-40 overflow-auto bg-white dark:bg-gray-800 shadow-lg">
                {locationSuggestions.map((s: any, i: number) => (
                  <button key={i} className="block w-full text-left p-2 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-orange-900/20 dark:hover:to-red-900/20 text-sm rounded-lg transition-all" onClick={() => { setSelectedLocation({ name: s.name, lat: s.lat, lon: s.lon }); setLocationQuery(s.name); setLocationSuggestions([]) }}>{s.name}</button>
                ))}
              </div>
            )}
            {selectedLocation && (
              <div className="mt-2 text-sm p-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-700 dark:text-green-400 rounded-lg border border-green-300 dark:border-green-700">
                ✓ Selected: {selectedLocation.name}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 hover:from-orange-700 hover:via-red-700 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all">
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Reporting...
                </>
              ) : (
                "Report Incident"
              )}
            </Button>
            <Link href="/community" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full border-2 border-orange-300 text-orange-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:border-orange-700 dark:text-orange-400 dark:hover:from-orange-900/20 dark:hover:to-red-900/20">View Community Reports</Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">My Reports</h2>
      </div>
      {!myReports ? (
        <div className="text-sm sm:text-base p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border-2 border-blue-200 text-blue-700 dark:text-blue-400">Loading...</div>
      ) : myReports.length === 0 ? (
        <div className="text-sm sm:text-base p-6 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">No reports yet.</div>
      ) : (
        <div className="space-y-4">
          {myReports.map((r: any) => (
            <Card key={r.id} className="p-4 border-2 border-orange-200/50 bg-gradient-to-br from-white to-orange-50/30 dark:from-gray-800 dark:to-orange-900/10 hover:shadow-lg hover:border-orange-300 transition-all">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0">
                <div className="flex-1">
                  <div className="inline-block px-3 py-1 mb-2 text-xs sm:text-sm font-semibold rounded-full bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border border-orange-300 dark:from-orange-900/50 dark:to-red-900/50 dark:text-orange-300 dark:border-orange-700">
                    {r.type}
                  </div>
                  <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">{r.description}</div>
                  <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <span className="text-orange-500">📍</span>
                    {r.location?.name}
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-0">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 border border-red-300 dark:border-red-700">
                    <IconHeartbeat className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 animate-pulse" />
                    <div className="text-sm sm:text-base font-bold text-red-700 dark:text-red-400">{r.pulses ?? 0}</div>
                  </div>
                  <button onClick={() => handlePulse(r.id)} className="px-4 py-2 rounded-lg border-2 border-orange-300 text-sm font-semibold text-orange-700 hover:bg-gradient-to-r hover:from-orange-500 hover:to-red-500 hover:text-white hover:border-transparent transition-all dark:border-orange-700 dark:text-orange-400">
                    Pulse
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <RewardDialog
        open={showReward}
        onOpenChange={setShowReward}
        xpAwarded={rewardData.xpAwarded}
        tokensAwarded={rewardData.tokensAwarded}
        taskTitle={rewardData.taskTitle}
        levelUp={rewardData.levelUp}
        newLevel={rewardData.newLevel}
      />
      </div>
    </div>
  )
}
