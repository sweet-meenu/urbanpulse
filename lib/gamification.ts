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
  increment,
  setDoc,
} from "firebase/firestore"
import { auth } from "./firebase"

const getDb = () => getFirestore()

// ============================================
// GAMIFICATION TYPES
// ============================================

export type TaskType = "daily" | "special"
export type TaskCategory = "incident" | "post" | "pulse" | "route" | "social" | "exploration"

export interface Task {
  id: string
  title: string
  description: string
  category: TaskCategory
  type: TaskType
  xpReward: number
  tokenReward: number
  targetCount: number
  icon: string
  createdAt: Date
  expiresAt?: Date // For daily tasks
  isActive: boolean
}

export interface UserProgress {
  userId: string
  level: number
  currentXp: number
  xpToNextLevel: number
  totalXp: number
  pulseTokens: number
  completedDailyTasks: string[] // Task IDs
  completedSpecialTasks: string[] // Task IDs
  taskProgress: { [taskId: string]: number } // Current progress for each task
  lastDailyReset: Date
  ownedItems: string[] // Shop item IDs
  customMarkers?: {
    origin?: string
    destination?: string
    incident?: string
  }
  unlockedLevels: number[]
  createdAt: Date
  updatedAt: Date
}

export interface ShopItem {
  id: string
  name: string
  description: string
  category: "marker" | "theme" | "badge" | "avatar_frame" | "other"
  price: number
  imageUrl: string
  preview?: string
  isAvailable: boolean
  minLevel?: number
  createdAt: Date
}

export interface Transaction {
  id: string
  userId: string
  type: "earn" | "spend"
  amount: number
  reason: string
  taskId?: string
  itemId?: string
  createdAt: Date
}

// ============================================
// XP & LEVEL CALCULATIONS
// ============================================

// XP calculation: Level N requires (N * 100) XP to reach next level
// Level 1 -> 2: 100 XP
// Level 2 -> 3: 200 XP
// Level 3 -> 4: 300 XP
const calculateXpForLevel = (level: number): number => level * 100

const calculateLevelFromXp = (totalXp: number): { level: number; currentXp: number; xpToNextLevel: number } => {
  let level = 1
  let xpUsed = 0
  
  while (xpUsed + calculateXpForLevel(level) <= totalXp) {
    xpUsed += calculateXpForLevel(level)
    level++
  }
  
  const currentXp = totalXp - xpUsed
  const xpToNextLevel = calculateXpForLevel(level)
  
  return { level, currentXp, xpToNextLevel }
}

// Level unlock rewards: Level N unlocks N * 50 PulseTokens
const getTokenRewardForLevel = (level: number): number => level * 50

// ============================================
// USER PROGRESS FUNCTIONS
// ============================================

// Initialize user progress (called on first login)
export async function initializeUserProgress() {
  try {
    const user = auth.currentUser
    if (!user) throw new Error("User not authenticated")

    const db = getDb()
    const progressRef = doc(db, "userProgress", user.uid)
    const progressSnap = await getDoc(progressRef)

    if (!progressSnap.exists()) {
      const initialProgress: Omit<UserProgress, "userId"> = {
        level: 1,
        currentXp: 0,
        xpToNextLevel: 100,
        totalXp: 0,
        pulseTokens: 100, // Starting bonus
        completedDailyTasks: [],
        completedSpecialTasks: [],
        taskProgress: {},
        lastDailyReset: new Date(),
        ownedItems: [],
        unlockedLevels: [1],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await setDoc(progressRef, {
        userId: user.uid,
        ...initialProgress,
      })

      return { userId: user.uid, ...initialProgress }
    }

    return { userId: user.uid, ...progressSnap.data() } as UserProgress
  } catch (error) {
    console.error("Error initializing user progress:", error)
    throw error
  }
}

// Get user progress
export async function getUserProgress(): Promise<UserProgress | null> {
  try {
    const user = auth.currentUser
    if (!user) return null

    const db = getDb()
    const progressRef = doc(db, "userProgress", user.uid)
    const progressSnap = await getDoc(progressRef)

    if (!progressSnap.exists()) {
      return await initializeUserProgress()
    }

    const data = progressSnap.data()
    
    // Check if daily tasks need reset (new day)
    const lastReset = data.lastDailyReset?.toDate?.() || new Date(data.lastDailyReset)
    const now = new Date()
    const isNewDay = now.getDate() !== lastReset.getDate() || 
                     now.getMonth() !== lastReset.getMonth() || 
                     now.getFullYear() !== lastReset.getFullYear()

    if (isNewDay) {
      // Reset daily tasks
      await updateDoc(progressRef, {
        completedDailyTasks: [],
        lastDailyReset: now,
        updatedAt: now,
      })
      
      return {
        ...data,
        userId: user.uid,
        completedDailyTasks: [],
        lastDailyReset: now,
        updatedAt: now,
      } as UserProgress
    }

    return { userId: user.uid, ...data } as UserProgress
  } catch (error) {
    console.error("Error getting user progress:", error)
    throw error
  }
}

// Award XP and handle level ups
export async function awardXp(xp: number, reason: string): Promise<{ leveledUp: boolean; newLevel?: number; tokensAwarded?: number }> {
  try {
    const user = auth.currentUser
    if (!user) throw new Error("User not authenticated")

    const db = getDb()
    const progressRef = doc(db, "userProgress", user.uid)
    const progressSnap = await getDoc(progressRef)
    
    if (!progressSnap.exists()) {
      await initializeUserProgress()
      return awardXp(xp, reason)
    }

    const progress = progressSnap.data() as UserProgress
    const newTotalXp = progress.totalXp + xp
    const levelData = calculateLevelFromXp(newTotalXp)
    
    const leveledUp = levelData.level > progress.level
    let tokensAwarded = 0
    const newUnlockedLevels = [...(progress.unlockedLevels || [1])]

    if (leveledUp) {
      // Award tokens for each new level
      for (let l = progress.level + 1; l <= levelData.level; l++) {
        tokensAwarded += getTokenRewardForLevel(l)
        if (!newUnlockedLevels.includes(l)) {
          newUnlockedLevels.push(l)
        }
      }
    }

    await updateDoc(progressRef, {
      level: levelData.level,
      currentXp: levelData.currentXp,
      xpToNextLevel: levelData.xpToNextLevel,
      totalXp: newTotalXp,
      pulseTokens: increment(tokensAwarded),
      unlockedLevels: newUnlockedLevels,
      updatedAt: new Date(),
    })

    // Record transaction if tokens were awarded
    if (tokensAwarded > 0) {
      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        type: "earn",
        amount: tokensAwarded,
        reason: `Level ${levelData.level} unlock reward`,
        createdAt: new Date(),
      })
    }

    return { leveledUp, newLevel: levelData.level, tokensAwarded }
  } catch (error) {
    console.error("Error awarding XP:", error)
    throw error
  }
}

// Award PulseTokens
export async function awardTokens(amount: number, reason: string, taskId?: string) {
  try {
    const user = auth.currentUser
    if (!user) throw new Error("User not authenticated")

    const db = getDb()
    const progressRef = doc(db, "userProgress", user.uid)
    
    await updateDoc(progressRef, {
      pulseTokens: increment(amount),
      updatedAt: new Date(),
    })

    // Record transaction
    await addDoc(collection(db, "transactions"), {
      userId: user.uid,
      type: "earn",
      amount,
      reason,
      taskId,
      createdAt: new Date(),
    })
  } catch (error) {
    console.error("Error awarding tokens:", error)
    throw error
  }
}

// ============================================
// TASK FUNCTIONS
// ============================================

// Get all active tasks
export async function getActiveTasks(): Promise<{ daily: Task[]; special: Task[] }> {
  try {
    const db = getDb()
    const now = new Date()
    
    // Get daily tasks (not expired)
    const dailyQuery = query(
      collection(db, "tasks"),
      where("type", "==", "daily"),
      where("isActive", "==", true),
      orderBy("createdAt", "desc")
    )
    const dailySnap = await getDocs(dailyQuery)
    const daily = dailySnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Task))
      .filter(task => !task.expiresAt || task.expiresAt > now)
      .slice(0, 3) // Max 3 daily tasks

    // Get special tasks
    const specialQuery = query(
      collection(db, "tasks"),
      where("type", "==", "special"),
      where("isActive", "==", true),
      orderBy("createdAt", "desc")
    )
    const specialSnap = await getDocs(specialQuery)
    const special = specialSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Task))
      .slice(0, 2) // Max 2 special tasks

    return { daily, special }
  } catch (error) {
    console.error("Error getting active tasks:", error)
    throw error
  }
}

// Update task progress and check for completion
export async function updateTaskProgress(
  taskId: string,
  incrementBy: number = 1
): Promise<{ completed: boolean; xpAwarded?: number; tokensAwarded?: number }> {
  try {
    const user = auth.currentUser
    if (!user) throw new Error("User not authenticated")

    const db = getDb()
    const progressRef = doc(db, "userProgress", user.uid)
    const progressSnap = await getDoc(progressRef)
    
    if (!progressSnap.exists()) {
      await initializeUserProgress()
      return updateTaskProgress(taskId, incrementBy)
    }

    const progress = progressSnap.data() as UserProgress
    const taskRef = doc(db, "tasks", taskId)
    const taskSnap = await getDoc(taskRef)
    
    if (!taskSnap.exists()) throw new Error("Task not found")
    
    const task = { id: taskSnap.id, ...taskSnap.data() } as Task
    
    // Check if already completed
    if (task.type === "daily" && progress.completedDailyTasks.includes(taskId)) {
      return { completed: false }
    }
    if (task.type === "special" && progress.completedSpecialTasks.includes(taskId)) {
      return { completed: false }
    }

    const currentProgress = progress.taskProgress[taskId] || 0
    const newProgress = currentProgress + incrementBy

    // Check if task is now complete
    if (newProgress >= task.targetCount) {
      const completedList = task.type === "daily" ? "completedDailyTasks" : "completedSpecialTasks"
      
      await updateDoc(progressRef, {
        [completedList]: [...progress[completedList], taskId],
        [`taskProgress.${taskId}`]: newProgress,
        updatedAt: new Date(),
      })

      // Award XP and tokens
      await awardXp(task.xpReward, `Completed task: ${task.title}`)
      await awardTokens(task.tokenReward, `Completed task: ${task.title}`, taskId)

      return { 
        completed: true, 
        xpAwarded: task.xpReward, 
        tokensAwarded: task.tokenReward 
      }
    } else {
      // Update progress
      await updateDoc(progressRef, {
        [`taskProgress.${taskId}`]: newProgress,
        updatedAt: new Date(),
      })

      return { completed: false }
    }
  } catch (error) {
    console.error("Error updating task progress:", error)
    throw error
  }
}

// ============================================
// SHOP FUNCTIONS
// ============================================

// Get shop items
export async function getShopItems(): Promise<ShopItem[]> {
  try {
    const db = getDb()
    const q = query(
      collection(db, "shopItems"),
      where("isAvailable", "==", true),
      orderBy("price", "asc")
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShopItem))
  } catch (error) {
    console.error("Error getting shop items:", error)
    throw error
  }
}

// Purchase shop item
export async function purchaseShopItem(itemId: string): Promise<{ success: boolean; message: string }> {
  try {
    const user = auth.currentUser
    if (!user) throw new Error("User not authenticated")

    const db = getDb()
    const progressRef = doc(db, "userProgress", user.uid)
    const progressSnap = await getDoc(progressRef)
    
    if (!progressSnap.exists()) {
      return { success: false, message: "User progress not found" }
    }

    const progress = progressSnap.data() as UserProgress
    const itemRef = doc(db, "shopItems", itemId)
    const itemSnap = await getDoc(itemRef)
    
    if (!itemSnap.exists()) {
      return { success: false, message: "Item not found" }
    }

    const item = { id: itemSnap.id, ...itemSnap.data() } as ShopItem

    // Check if already owned
    if (progress.ownedItems.includes(itemId)) {
      return { success: false, message: "You already own this item" }
    }

    // Check level requirement
    if (item.minLevel && progress.level < item.minLevel) {
      return { success: false, message: `Requires level ${item.minLevel}` }
    }

    // Check tokens
    if (progress.pulseTokens < item.price) {
      return { success: false, message: "Insufficient PulseTokens" }
    }

    // Process purchase
    await updateDoc(progressRef, {
      pulseTokens: increment(-item.price),
      ownedItems: [...progress.ownedItems, itemId],
      updatedAt: new Date(),
    })

    // Record transaction
    await addDoc(collection(db, "transactions"), {
      userId: user.uid,
      type: "spend",
      amount: item.price,
      reason: `Purchased: ${item.name}`,
      itemId,
      createdAt: new Date(),
    })

    return { success: true, message: "Purchase successful!" }
  } catch (error) {
    console.error("Error purchasing item:", error)
    throw error
  }
}

// Equip custom marker
export async function equipCustomMarker(markerType: "origin" | "destination" | "incident", itemId: string) {
  try {
    const user = auth.currentUser
    if (!user) throw new Error("User not authenticated")

    const db = getDb()
    const progressRef = doc(db, "userProgress", user.uid)
    const progressSnap = await getDoc(progressRef)
    
    if (!progressSnap.exists()) throw new Error("User progress not found")
    
    const progress = progressSnap.data() as UserProgress
    
    if (!progress.ownedItems.includes(itemId)) {
      throw new Error("You don't own this item")
    }

    await updateDoc(progressRef, {
      [`customMarkers.${markerType}`]: itemId,
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error("Error equipping marker:", error)
    throw error
  }
}

// Get user transactions
export async function getUserTransactions(limit: number = 20): Promise<Transaction[]> {
  try {
    const user = auth.currentUser
    if (!user) return []

    const db = getDb()
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    )
    const snapshot = await getDocs(q)
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Transaction))
      .slice(0, limit)
  } catch (error) {
    console.error("Error getting transactions:", error)
    throw error
  }
}
