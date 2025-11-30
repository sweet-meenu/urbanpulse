/**
 * CLIENT-SIDE GAMIFICATION DATA SEEDING SCRIPT
 * ==============================================
 * This script seeds tasks and shop items to Firestore using client SDK.
 * Run this from the browser console while logged in as an admin user.
 * 
 * Usage:
 * 1. Start your dev server: pnpm dev
 * 2. Open browser and login to your app
 * 3. Open browser console (F12)
 * 4. Copy and paste this entire script
 * 5. Run: await seedGamificationData()
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, Timestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const SAMPLE_DAILY_TASKS = [
  {
    title: "Pulse 1 incident near you",
    description: "Show support for a reported incident by pulsing it",
    category: "pulse",
    type: "daily",
    xpReward: 50,
    tokenReward: 10,
    targetCount: 1,
    icon: "❤️",
    isActive: true,
    createdAt: Timestamp.now(),
  },
  {
    title: "Report an incident",
    description: "Help your community by reporting an incident you've witnessed",
    category: "incident",
    type: "daily",
    xpReward: 100,
    tokenReward: 25,
    targetCount: 1,
    icon: "🚨",
    isActive: true,
    createdAt: Timestamp.now(),
  },
  {
    title: "Plan a route",
    description: "Use the map to plan a route between two locations",
    category: "route",
    type: "daily",
    xpReward: 30,
    tokenReward: 5,
    targetCount: 1,
    icon: "🗺️",
    isActive: true,
    createdAt: Timestamp.now(),
  },
]

const SAMPLE_SPECIAL_TASKS = [
  {
    title: "Community Champion",
    description: "Pulse 50 incidents to show your community support",
    category: "pulse",
    type: "special",
    xpReward: 500,
    tokenReward: 100,
    targetCount: 50,
    icon: "🏆",
    isActive: true,
    createdAt: Timestamp.now(),
  },
  {
    title: "Social Butterfly",
    description: "Create 20 posts in the community feed",
    category: "post",
    type: "special",
    xpReward: 400,
    tokenReward: 80,
    targetCount: 20,
    icon: "🦋",
    isActive: true,
    createdAt: Timestamp.now(),
  },
]

const SAMPLE_SHOP_ITEMS = [
  // CUSTOM MARKERS
  {
    name: "Golden Star Origin Marker",
    description: "Replace your origin marker with a shining golden star",
    category: "marker",
    price: 150,
    imageUrl: "⭐",
    preview: "M12,2 L15,9 L22,9 L17,14 L19,21 L12,17 L5,21 L7,14 L2,9 L9,9 Z",
    isAvailable: true,
    minLevel: 1,
    createdAt: Timestamp.now(),
  },
  {
    name: "Fire Destination Marker",
    description: "Mark your destination with a blazing fire icon",
    category: "marker",
    price: 200,
    imageUrl: "🔥",
    preview: "M12,2 C12,2 8,6 8,10 C8,13.31 10.69,16 14,16 C17.31,16 20,13.31 20,10 C20,6 16,2 16,2 C16,2 14,4 14,6 C14,7.1 13.1,8 12,8 C10.9,8 10,7.1 10,6 C10,4 12,2 12,2 Z",
    isAvailable: true,
    minLevel: 3,
    createdAt: Timestamp.now(),
  },
  {
    name: "Lightning Incident Marker",
    description: "Make incidents stand out with a lightning bolt",
    category: "marker",
    price: 250,
    imageUrl: "⚡",
    preview: "M13,2 L3,14 L10,14 L8,22 L18,10 L11,10 L13,2 Z",
    isAvailable: true,
    minLevel: 5,
    createdAt: Timestamp.now(),
  },
  {
    name: "Heart Origin Marker",
    description: "Show love for your starting point",
    category: "marker",
    price: 100,
    imageUrl: "💖",
    preview: "M12,21.35 L10.55,20.03 C5.4,15.36 2,12.27 2,8.5 C2,5.41 4.42,3 7.5,3 C9.24,3 10.91,3.81 12,5.08 C13.09,3.81 14.76,3 16.5,3 C19.58,3 22,5.41 22,8.5 C22,12.27 18.6,15.36 13.45,20.03 L12,21.35 Z",
    isAvailable: true,
    minLevel: 2,
    createdAt: Timestamp.now(),
  },
  {
    name: "Diamond Destination Marker",
    description: "Your destination is precious",
    category: "marker",
    price: 400,
    imageUrl: "💎",
    preview: "M12,2 L18,8 L12,14 L6,8 L12,2 Z M12,16 L18,22 L12,16 M12,16 L6,22 L12,16 Z",
    isAvailable: true,
    minLevel: 8,
    createdAt: Timestamp.now(),
  },

  // AVATAR FRAMES
  {
    name: "Bronze Frame",
    description: "Add a bronze border to your profile avatar",
    category: "avatar_frame",
    price: 100,
    imageUrl: "🥉",
    preview: "bronze-frame",
    isAvailable: true,
    minLevel: 1,
    createdAt: Timestamp.now(),
  },
  {
    name: "Silver Frame",
    description: "Upgrade to a silver border for your avatar",
    category: "avatar_frame",
    price: 300,
    imageUrl: "🥈",
    preview: "silver-frame",
    isAvailable: true,
    minLevel: 5,
    createdAt: Timestamp.now(),
  },
  {
    name: "Gold Frame",
    description: "Show your elite status with a golden avatar frame",
    category: "avatar_frame",
    price: 500,
    imageUrl: "🥇",
    preview: "gold-frame",
    isAvailable: true,
    minLevel: 10,
    createdAt: Timestamp.now(),
  },

  // BADGES
  {
    name: "Early Adopter Badge",
    description: "Limited edition badge for early UrbanPulse users",
    category: "badge",
    price: 500,
    imageUrl: "🎖️",
    preview: "early-adopter-badge",
    isAvailable: true,
    minLevel: 1,
    createdAt: Timestamp.now(),
  },
  {
    name: "Guardian Badge",
    description: "Awarded to dedicated community protectors",
    category: "badge",
    price: 1000,
    imageUrl: "🛡️",
    preview: "guardian-badge",
    isAvailable: true,
    minLevel: 15,
    createdAt: Timestamp.now(),
  },
]

export async function seedGamificationData() {
  console.log('🚀 Starting gamification data seeding...')
  
  try {
    const app = initializeApp(firebaseConfig)
    const db = getFirestore(app)

    // Seed tasks
    console.log('🌱 Seeding tasks...')
    const tasksRef = collection(db, 'tasks')
    const existingTasks = await getDocs(tasksRef)
    
    if (existingTasks.empty) {
      console.log('  Adding daily tasks...')
      for (const task of SAMPLE_DAILY_TASKS) {
        await addDoc(tasksRef, task)
        console.log(`  ✅ Added: ${task.title}`)
      }
      
      console.log('  Adding special tasks...')
      for (const task of SAMPLE_SPECIAL_TASKS) {
        await addDoc(tasksRef, task)
        console.log(`  ✅ Added: ${task.title}`)
      }
      console.log(`✅ Successfully seeded ${SAMPLE_DAILY_TASKS.length + SAMPLE_SPECIAL_TASKS.length} tasks!`)
    } else {
      console.log(`ℹ️  Tasks collection already has ${existingTasks.size} documents. Skipping...`)
    }

    // Seed shop items
    console.log('🛍️  Seeding shop items...')
    const shopRef = collection(db, 'shopItems')
    const existingShop = await getDocs(shopRef)
    
    if (existingShop.empty) {
      console.log('  Adding shop items...')
      for (const item of SAMPLE_SHOP_ITEMS) {
        await addDoc(shopRef, item)
        console.log(`  ✅ Added: ${item.name}`)
      }
      console.log(`✅ Successfully seeded ${SAMPLE_SHOP_ITEMS.length} shop items!`)
    } else {
      console.log(`ℹ️  Shop items collection already has ${existingShop.size} documents. Skipping...`)
    }

    console.log('🎉 Gamification data seeding complete!')
    console.log('')
    console.log('📋 Summary:')
    console.log(`  - Daily tasks: ${SAMPLE_DAILY_TASKS.length}`)
    console.log(`  - Special tasks: ${SAMPLE_SPECIAL_TASKS.length}`)
    console.log(`  - Shop items: ${SAMPLE_SHOP_ITEMS.length}`)
    console.log('')
    console.log('⚠️  IMPORTANT: Update your Firestore security rules!')
    console.log('   Copy the rules from GAMIFICATION_SETUP.ts to Firebase Console')

  } catch (error) {
    console.error('❌ Error seeding data:', error)
    throw error
  }
}

// If running as a module
if (typeof window === 'undefined') {
  seedGamificationData().catch(console.error)
}
