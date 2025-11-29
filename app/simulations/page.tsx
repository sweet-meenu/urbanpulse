"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  IconSearch,
  IconPlus,
  IconCalendar,
  IconMapPin,
  IconTrash,
  IconArrowRight,
  IconLoader,
} from "@tabler/icons-react"
import { useAuth } from "@/context/AuthContext"
import { getUserSimulations, deleteSimulation, type Simulation } from "@/lib/firebase-admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

type FilterStatus = "all" | "active" | "completed" | "archived"

export default function SimulationsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [filteredSimulations, setFilteredSimulations] = useState<Simulation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push("/login")
      return
    }

    const loadSimulations = async () => {
      try {
        setLoading(true)
        const data = await getUserSimulations()
        setSimulations(data)
        filterSimulations(data, searchQuery, filterStatus)
      } catch (err) {
        console.error("Error loading simulations:", err)
        setError("Failed to load simulations")
      } finally {
        setLoading(false)
      }
    }

    loadSimulations()
  }, [user, authLoading, router])

  const filterSimulations = (data: Simulation[], query: string, status: FilterStatus) => {
    let filtered = data

    if (query) {
      filtered = filtered.filter(
        (sim) =>
          sim.name.toLowerCase().includes(query.toLowerCase()) ||
          sim.location.toLowerCase().includes(query.toLowerCase()),
      )
    }

    if (status !== "all") {
      filtered = filtered.filter((sim) => sim.status === status)
    }

    setFilteredSimulations(filtered)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    filterSimulations(simulations, query, filterStatus)
  }

  const handleFilterChange = (status: FilterStatus) => {
    setFilterStatus(status)
    filterSimulations(simulations, searchQuery, status)
  }

  const handleDelete = async (simulationId: string) => {
    if (!confirm("Are you sure you want to delete this simulation?")) return

    setDeleting(simulationId)
    try {
      await deleteSimulation(simulationId)
      setSimulations((prev) => prev.filter((sim) => sim.id !== simulationId))
      filterSimulations(
        simulations.filter((sim) => sim.id !== simulationId),
        searchQuery,
        filterStatus,
      )
    } catch (err) {
      console.error("Error deleting simulation:", err)
      setError("Failed to delete simulation")
    } finally {
      setDeleting(null)
    }
  }

  const handleOpenSimulation = (simulation: Simulation) => {
    router.push(
      `/simulation?simulationId=${simulation.id}&location=${encodeURIComponent(
        simulation.location,
      )}&lat=${simulation.latitude}&lon=${simulation.longitude}&simulationName=${encodeURIComponent(simulation.name)}`,
    )
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex items-center justify-center p-8">
        <div className="text-center">
          <IconLoader size={48} className="animate-spin mx-auto mb-4 text-[hsl(var(--primary))]" />
          <p className="text-lg text-[hsl(var(--muted-foreground))]">Loading simulations...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] p-8 pt-24"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold font-space mb-2">
              My <span className="text-[hsl(var(--secondary))]">Simulations</span>
            </h1>
            <p className="text-lg text-[hsl(var(--muted-foreground))]">
              Manage and track your digital twin simulations
            </p>
          </div>
          <Link href="/simulations/new">
            <Button className="flex items-center gap-2 whitespace-nowrap">
              <IconPlus size={20} />
              New Simulation
            </Button>
          </Link>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-8">{error}</div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 mb-12">
          <div className="flex-1 relative">
            <IconSearch
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
            />
            <Input
              placeholder="Search simulations by name or location..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {(["all", "active", "completed", "archived"] as FilterStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => handleFilterChange(status)}
                className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                  filterStatus === status
                    ? "bg-[hsl(var(--primary))] text-black"
                    : "bg-[hsl(var(--card))]/50 border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {filteredSimulations.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-xl text-[hsl(var(--muted-foreground))] mb-6">
              {searchQuery || filterStatus !== "all"
                ? "No simulations match your filters"
                : "No simulations yet. Create one to get started!"}
            </p>
            {!searchQuery && filterStatus === "all" && (
              <Link href="/simulations/new">
                <Button className="inline-flex items-center gap-2">
                  <IconPlus size={20} />
                  Create First Simulation
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSimulations.map((simulation, idx) => (
              <motion.div
                key={simulation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
              >
                <Card className="h-full p-6 hover:shadow-lg transition-all cursor-pointer group flex flex-col">
                  {simulation.cityImage && (
                    <div className="w-full h-40 rounded-lg overflow-hidden mb-4 bg-[hsl(var(--card))]/50">
                      <img
                        src={simulation.cityImage || "/placeholder.svg"}
                        alt={simulation.location}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}

                  <div className="flex-1 space-y-3 mb-4">
                    <div>
                      <h3 className="text-lg font-bold truncate">{simulation.name}</h3>
                      <p className="text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-1 mt-1">
                        <IconMapPin size={14} />
                        {simulation.location}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                      <IconCalendar size={14} />
                      {new Date(simulation.createdAt).toLocaleDateString()}
                    </div>

                    <div className="flex gap-2 flex-wrap pt-2">
                      {simulation.includedOptions.weather && (
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-400">Weather</span>
                      )}
                      {simulation.includedOptions.traffic && (
                        <span className="px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-400">Traffic</span>
                      )}
                      {simulation.includedOptions.emissions && (
                        <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/10 text-yellow-400">
                          Emissions
                        </span>
                      )}
                      {simulation.includedOptions.pollution && (
                        <span className="px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-400">Pollution</span>
                      )}
                    </div>

                    <span
                      className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                        simulation.status === "active"
                          ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                          : simulation.status === "completed"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-[hsl(var(--muted-foreground))]/10 text-[hsl(var(--muted-foreground))]"
                      }`}
                    >
                      {simulation.status}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-[hsl(var(--border))]">
                    <button
                      onClick={() => handleOpenSimulation(simulation)}
                      className="flex-1 px-3 py-2 rounded-lg bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <span>Open</span>
                      <IconArrowRight size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(simulation.id)}
                      disabled={deleting === simulation.id}
                      className="px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      {deleting === simulation.id ? (
                        <IconLoader size={18} className="animate-spin" />
                      ) : (
                        <IconTrash size={18} />
                      )}
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
