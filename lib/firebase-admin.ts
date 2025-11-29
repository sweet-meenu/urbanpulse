import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
} from "firebase/firestore"
import { auth } from "./firebase"

import type { Insight } from "./genai"

// Initialize Firestore (lazy loaded to ensure auth is ready)
const getDb = () => getFirestore()

export interface Simulation {
  id: string
  userId: string
  name: string
  location: string
  latitude: number
  longitude: number
  cityImage: string
  includedOptions: {
    weather: boolean
    traffic: boolean
    emissions: boolean
    pollution: boolean
  }
  insights?: Insight[]
  createdAt: Date
  updatedAt: Date
  status: "active" | "completed" | "archived"
}

// Create a new simulation
export async function createSimulation(simulationData: Omit<Simulation, "id" | "userId" | "createdAt" | "updatedAt">) {
  try {
    const user = auth.currentUser
    if (!user) throw new Error("User not authenticated")

    const db = getDb()
    const docRef = await addDoc(collection(db, "simulations"), {
      ...simulationData,
      userId: user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return docRef.id
  } catch (error) {
    console.error("Error creating simulation:", error)
    throw error
  }
}

// Get all simulations for current user
export async function getUserSimulations() {
  try {
    const user = auth.currentUser
    if (!user) throw new Error("User not authenticated")

    const db = getDb()
    const q = query(collection(db, "simulations"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)
    const simulations: Simulation[] = []

    querySnapshot.forEach((doc) => {
      simulations.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      } as Simulation)
    })

    return simulations
  } catch (error) {
    console.error("Error fetching simulations:", error)
    throw error
  }
}

// Get single simulation by ID
export async function getSimulation(simulationId: string) {
  try {
    const db = getDb()
    const docRef = doc(db, "simulations", simulationId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      throw new Error("Simulation not found")
    }

    const data = docSnap.data()
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as Simulation
  } catch (error) {
    console.error("Error fetching simulation:", error)
    throw error
  }
}

// Update simulation
export async function updateSimulation(simulationId: string, updates: Partial<Simulation>) {
  try {
    const db = getDb()
    const docRef = doc(db, "simulations", simulationId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error("Error updating simulation:", error)
    throw error
  }
}

// Delete simulation
export async function deleteSimulation(simulationId: string) {
  try {
    const db = getDb()
    const docRef = doc(db, "simulations", simulationId)
    await deleteDoc(docRef)
  } catch (error) {
    console.error("Error deleting simulation:", error)
    throw error
  }
}
