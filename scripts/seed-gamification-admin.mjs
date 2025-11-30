/**
 * GAMIFICATION DATA SEEDING SCRIPT
 * ==================================
 * This script seeds tasks and shop items into Firestore
 * Uses Firebase Admin SDK for authentication
 * 
 * SETUP:
 * 1. Download service account key from Firebase Console
 * 2. Save as scripts/serviceAccountKey.json
 * 3. Run: node scripts/seed-gamification-admin.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Try to load service account key
let serviceAccount
try {
  const serviceAccountPath = join(__dirname, 'serviceAccountKey.json')
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'))
  console.log('✅ Service account key loaded')
} catch (error) {
  console.error('❌ Error: Could not load serviceAccountKey.json')
  console.error('   Please download your Firebase service account key and save it as scripts/serviceAccountKey.json')
  console.error('   Get it from: Firebase Console > Project Settings > Service Accounts > Generate New Private Key')
  process.exit(1)
}

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
})

const db = getFirestore()

// SAMPLE DAILY TASKS
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
    createdAt: new Date(),
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
    createdAt: new Date(),
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
    createdAt: new Date(),
  },
]

// SAMPLE SPECIAL TASKS
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
    createdAt: new Date(),
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
    createdAt: new Date(),
  },
]

// SAMPLE SHOP ITEMS
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
    createdAt: new Date(),
  },
  {
    name: "Fire Destination Marker",
    description: "Mark your destination with a blazing fire icon",
    category: "marker",
    price: 200,
    imageUrl: "🔥",
    preview: "M12,2 C12,2 8,6 8,10 C8,13.31 10.69,16 14,16 C17.31,16 20,13.31 20,10 C20,6 16,2 16,2 C16,2 14,4 14,6 C14,8 16,10 16,10 C16,10 14,12 12,12 C10,12 8,10 8,10 L12,2 Z",
    isAvailable: true,
    minLevel: 3,
    createdAt: new Date(),
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
    createdAt: new Date(),
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
    createdAt: new Date(),
  },
  {
    name: "Diamond Destination Marker",
    description: "Premium destination marker for special places",
    category: "marker",
    price: 400,
    imageUrl: "💎",
    preview: "M12,2 L18,8 L12,14 L6,8 L12,2 Z M12,5 L9,8 L12,11 L15,8 L12,5 Z",
    isAvailable: true,
    minLevel: 8,
    createdAt: new Date(),
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
    createdAt: new Date(),
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
    createdAt: new Date(),
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
    createdAt: new Date(),
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
    createdAt: new Date(),
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
    createdAt: new Date(),
  },
]

async function seedTasks() {
  console.log('🌱 Seeding tasks...')
  
  // Check if tasks already exist
  const tasksSnapshot = await db.collection('tasks').limit(1).get()
  if (!tasksSnapshot.empty) {
    console.log('⚠️  Tasks collection already has data. Skipping...')
    console.log('   To re-seed, delete the tasks collection first.')
    return
  }

  // Seed daily tasks
  let count = 0
  for (const task of SAMPLE_DAILY_TASKS) {
    await db.collection('tasks').add(task)
    count++
    console.log(`   ✅ Added daily task: ${task.title}`)
  }

  // Seed special tasks
  for (const task of SAMPLE_SPECIAL_TASKS) {
    await db.collection('tasks').add(task)
    count++
    console.log(`   ✅ Added special task: ${task.title}`)
  }

  console.log(`✅ Successfully seeded ${count} tasks`)
}

async function seedShopItems() {
  console.log('🛍️  Seeding shop items...')
  
  // Check if shop items already exist
  const shopSnapshot = await db.collection('shopItems').limit(1).get()
  if (!shopSnapshot.empty) {
    console.log('⚠️  Shop items collection already has data. Skipping...')
    console.log('   To re-seed, delete the shopItems collection first.')
    return
  }

  // Seed shop items
  let count = 0
  for (const item of SAMPLE_SHOP_ITEMS) {
    await db.collection('shopItems').add(item)
    count++
    console.log(`   ✅ Added shop item: ${item.name}`)
  }

  console.log(`✅ Successfully seeded ${count} shop items`)
}

async function main() {
  try {
    console.log('🚀 Starting gamification data seeding...\n')
    
    await seedTasks()
    console.log('')
    await seedShopItems()
    
    console.log('\n✨ Seeding complete!')
    console.log('\n📋 Next steps:')
    console.log('1. Update Firebase security rules (see GAMIFICATION_SETUP.ts)')
    console.log('2. Test the gamification features in your app')
    console.log('3. Users will automatically initialize with 100 tokens at Level 1')
    
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error during seeding:', error)
    process.exit(1)
  }
}

main()
