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
  increment,
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

export interface Incident {
  id: string
  userId: string
  type: "Medical" | "Fire" | "Accident" | "Violence" | "Other"
  description: string
  images: string[]
  location: {
    name: string
    lat: number
    lon: number
  }
  pulses: number
  createdAt: Date
  updatedAt: Date
}

export interface Post {
  id: string
  userId: string
  userName: string
  userEmail: string
  userPhoto?: string
  content: string
  images: string[]
  taggedIncident?: {
    id: string
    title: string
    type: string
    location: string
  }
  likes: string[] // Array of userIds who liked
  likesCount: number
  repliesCount: number
  createdAt: Date
  updatedAt: Date
}

export interface Reply {
  id: string
  postId: string
  userId: string
  userName: string
  userEmail: string
  userPhoto?: string
  content: string
  likes: string[]
  likesCount: number
  createdAt: Date
  updatedAt: Date
}

// Create a new incident report (expects image URLs or base64 strings in images[])
export async function createIncident(incidentData: Omit<Incident, "id" | "userId" | "createdAt" | "updatedAt" | "pulses">) {
  try {
    const user = auth.currentUser
    if (!user) throw new Error("User not authenticated")

    const db = getDb()
    const docRef = await addDoc(collection(db, "incidents"), {
      ...incidentData,
      userId: user.uid,
      pulses: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return docRef.id
  } catch (error) {
    console.error("Error creating incident:", error)
    throw error
  }
}

// Get incidents reported by current user
export async function getUserIncidents() {
  try {
    const user = auth.currentUser
    if (!user) throw new Error("User not authenticated")

    const db = getDb()
    const q = query(collection(db, "incidents"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))
    const snapshot = await getDocs(q)
    const incidents: Incident[] = []
    snapshot.forEach((d) => {
      const data = d.data()
      incidents.push({
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Incident)
    })
    return incidents
  } catch (error) {
    console.error("Error fetching user incidents:", error)
    throw error
  }
}

// Get all incidents (for community/global view)
export async function getAllIncidents() {
  try {
    const db = getDb()
    const q = query(collection(db, "incidents"), orderBy("createdAt", "desc"))
    const snapshot = await getDocs(q)
    const incidents: Incident[] = []
    snapshot.forEach((d) => {
      const data = d.data()
      incidents.push({
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Incident)
    })
    return incidents
  } catch (error) {
    console.error("Error fetching all incidents:", error)
    throw error
  }
}

// Increment pulses (approvals) for an incident
export async function pulseIncident(incidentId: string) {
  try {
    const db = getDb()
    const docRef = doc(db, "incidents", incidentId)
    await updateDoc(docRef, { pulses: increment(1), updatedAt: new Date() })
  } catch (error) {
    console.error("Error pulsing incident:", error)
    throw error
  }
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

// ============================================
// POSTS (Social Media Feed)
// ============================================

// Create a new post
export async function createPost(postData: Omit<Post, "id" | "userId" | "userName" | "userEmail" | "userPhoto" | "likes" | "likesCount" | "repliesCount" | "createdAt" | "updatedAt">) {
  try {
    const user = auth.currentUser
    if (!user) throw new Error("User not authenticated")

    const db = getDb()
    const docRef = await addDoc(collection(db, "posts"), {
      ...postData,
      userId: user.uid,
      userName: user.displayName || "Anonymous",
      userEmail: user.email || "",
      userPhoto: user.photoURL || "",
      likes: [],
      likesCount: 0,
      repliesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return docRef.id
  } catch (error) {
    console.error("Error creating post:", error)
    throw error
  }
}

// Get all posts (for community feed)
export async function getAllPosts() {
  try {
    const db = getDb()
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"))
    const snapshot = await getDocs(q)
    const posts: Post[] = []
    snapshot.forEach((d) => {
      const data = d.data()
      posts.push({
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Post)
    })
    return posts
  } catch (error) {
    console.error("Error fetching posts:", error)
    throw error
  }
}

// Get posts by user (for profile page)
export async function getUserPosts(userId?: string) {
  try {
    const user = auth.currentUser
    const targetUserId = userId || user?.uid
    if (!targetUserId) throw new Error("User not specified")

    const db = getDb()
    const q = query(collection(db, "posts"), where("userId", "==", targetUserId), orderBy("createdAt", "desc"))
    const snapshot = await getDocs(q)
    const posts: Post[] = []
    snapshot.forEach((d) => {
      const data = d.data()
      posts.push({
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Post)
    })
    return posts
  } catch (error) {
    console.error("Error fetching user posts:", error)
    throw error
  }
}

// Like/Unlike a post
export async function togglePostLike(postId: string) {
  try {
    const user = auth.currentUser
    if (!user) throw new Error("User not authenticated")

    const db = getDb()
    const docRef = doc(db, "posts", postId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) throw new Error("Post not found")

    const data = docSnap.data()
    const likes = (data.likes || []) as string[]
    const hasLiked = likes.includes(user.uid)

    if (hasLiked) {
      // Unlike
      await updateDoc(docRef, {
        likes: likes.filter((id) => id !== user.uid),
        likesCount: increment(-1),
        updatedAt: new Date(),
      })
      return false
    } else {
      // Like
      await updateDoc(docRef, {
        likes: [...likes, user.uid],
        likesCount: increment(1),
        updatedAt: new Date(),
      })
      return true
    }
  } catch (error) {
    console.error("Error toggling post like:", error)
    throw error
  }
}

// Delete a post (only by owner)
export async function deletePost(postId: string) {
  try {
    const user = auth.currentUser
    if (!user) throw new Error("User not authenticated")

    const db = getDb()
    const docRef = doc(db, "posts", postId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) throw new Error("Post not found")
    
    const data = docSnap.data()
    if (data.userId !== user.uid) throw new Error("Not authorized to delete this post")

    // Delete all replies first
    const repliesQuery = query(collection(db, "replies"), where("postId", "==", postId))
    const repliesSnapshot = await getDocs(repliesQuery)
    const deletePromises = repliesSnapshot.docs.map((doc) => deleteDoc(doc.ref))
    await Promise.all(deletePromises)

    // Delete the post
    await deleteDoc(docRef)
  } catch (error) {
    console.error("Error deleting post:", error)
    throw error
  }
}

// ============================================
// REPLIES
// ============================================

// Create a reply to a post
export async function createReply(postId: string, content: string) {
  try {
    const user = auth.currentUser
    if (!user) throw new Error("User not authenticated")

    const db = getDb()
    
    // Add reply
    const replyRef = await addDoc(collection(db, "replies"), {
      postId,
      userId: user.uid,
      userName: user.displayName || "Anonymous",
      userEmail: user.email || "",
      userPhoto: user.photoURL || "",
      content,
      likes: [],
      likesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Increment replies count on post
    const postRef = doc(db, "posts", postId)
    await updateDoc(postRef, {
      repliesCount: increment(1),
      updatedAt: new Date(),
    })

    return replyRef.id
  } catch (error) {
    console.error("Error creating reply:", error)
    throw error
  }
}

// Get replies for a post
export async function getPostReplies(postId: string) {
  try {
    const db = getDb()
    const q = query(collection(db, "replies"), where("postId", "==", postId), orderBy("createdAt", "asc"))
    const snapshot = await getDocs(q)
    const replies: Reply[] = []
    snapshot.forEach((d) => {
      const data = d.data()
      replies.push({
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Reply)
    })
    return replies
  } catch (error) {
    console.error("Error fetching replies:", error)
    throw error
  }
}

// Like/Unlike a reply
export async function toggleReplyLike(replyId: string) {
  try {
    const user = auth.currentUser
    if (!user) throw new Error("User not authenticated")

    const db = getDb()
    const docRef = doc(db, "replies", replyId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) throw new Error("Reply not found")

    const data = docSnap.data()
    const likes = (data.likes || []) as string[]
    const hasLiked = likes.includes(user.uid)

    if (hasLiked) {
      // Unlike
      await updateDoc(docRef, {
        likes: likes.filter((id) => id !== user.uid),
        likesCount: increment(-1),
        updatedAt: new Date(),
      })
      return false
    } else {
      // Like
      await updateDoc(docRef, {
        likes: [...likes, user.uid],
        likesCount: increment(1),
        updatedAt: new Date(),
      })
      return true
    }
  } catch (error) {
    console.error("Error toggling reply like:", error)
    throw error
  }
}

// Delete a reply (only by owner)
export async function deleteReply(replyId: string, postId: string) {
  try {
    const user = auth.currentUser
    if (!user) throw new Error("User not authenticated")

    const db = getDb()
    const docRef = doc(db, "replies", replyId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) throw new Error("Reply not found")
    
    const data = docSnap.data()
    if (data.userId !== user.uid) throw new Error("Not authorized to delete this reply")

    await deleteDoc(docRef)

    // Decrement replies count on post
    const postRef = doc(db, "posts", postId)
    await updateDoc(postRef, {
      repliesCount: increment(-1),
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error("Error deleting reply:", error)
    throw error
  }
}
