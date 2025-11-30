/**
 * Gamification Data Seeding Script
 * Run with: node scripts/seed-gamification.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query } from 'firebase/firestore';

// Firebase config - matches your existing setup
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDVJ8KNt5Z0d-C3LkEMBYRKr9KX9WaWqEg",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "urbanpulse-59af5.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "urbanpulse-59af5",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "urbanpulse-59af5.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "671006038697",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:671006038697:web:8b5e3e0c8e3e0c8e3e0c8e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
];

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
];

const SAMPLE_SHOP_ITEMS = [
  // CUSTOM MARKERS
  {
    name: "Golden Star Origin Marker",
    description: "Replace your origin marker with a shining golden star",
    category: "marker",
    subCategory: "origin",
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
    subCategory: "destination",
    price: 200,
    imageUrl: "🔥",
    preview: "M12,2 C12,2 8,6 8,10 C8,13.31 10.69,16 14,16 C17.31,16 20,13.31 20,10 C20,6 16,2 16,2 L14,5 L12,2 Z",
    isAvailable: true,
    minLevel: 3,
    createdAt: new Date(),
  },
  {
    name: "Lightning Incident Marker",
    description: "Make incidents stand out with a lightning bolt",
    category: "marker",
    subCategory: "incident",
    price: 250,
    imageUrl: "⚡",
    preview: "M13,2 L3,14 L10,14 L8,22 L18,10 L11,10 L13,2 Z",
    isAvailable: true,
    minLevel: 5,
    createdAt: new Date(),
  },
  {
    name: "Heart Origin Marker",
    description: "Show love for your starting location",
    category: "marker",
    subCategory: "origin",
    price: 100,
    imageUrl: "💖",
    preview: "M12,21.35 L10.55,20.03 C5.4,15.36 2,12.27 2,8.5 C2,5.41 4.42,3 7.5,3 C9.24,3 10.91,3.81 12,5.08 C13.09,3.81 14.76,3 16.5,3 C19.58,3 22,5.41 22,8.5 C22,12.27 18.6,15.36 13.45,20.03 L12,21.35 Z",
    isAvailable: true,
    minLevel: 2,
    createdAt: new Date(),
  },
  {
    name: "Diamond Destination Marker",
    description: "Premium diamond marker for your destination",
    category: "marker",
    subCategory: "destination",
    price: 400,
    imageUrl: "💎",
    preview: "M12,2 L18,8 L12,14 L6,8 L12,2 Z M6,8 L2,12 L6,16 L6,8 Z M18,8 L18,16 L22,12 L18,8 Z M12,14 L18,16 L12,22 L6,16 L12,14 Z",
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
    preview: "#CD7F32",
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
    preview: "#C0C0C0",
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
    preview: "#FFD700",
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
    preview: "early-adopter",
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
    preview: "guardian",
    isAvailable: true,
    minLevel: 15,
    createdAt: new Date(),
  },
];

async function seedTasks() {
  console.log('🌱 Seeding tasks...');
  
  // Check if tasks already exist
  const tasksQuery = query(collection(db, 'tasks'));
  const existingTasks = await getDocs(tasksQuery);
  
  if (existingTasks.size > 0) {
    console.log(`⚠️  Found ${existingTasks.size} existing tasks. Skipping...`);
    return;
  }
  
  // Add daily tasks
  for (const task of SAMPLE_DAILY_TASKS) {
    const docRef = await addDoc(collection(db, 'tasks'), task);
    console.log(`✅ Added daily task: ${task.title} (ID: ${docRef.id})`);
  }
  
  // Add special tasks
  for (const task of SAMPLE_SPECIAL_TASKS) {
    const docRef = await addDoc(collection(db, 'tasks'), task);
    console.log(`✅ Added special task: ${task.title} (ID: ${docRef.id})`);
  }
  
  console.log(`✨ Successfully seeded ${SAMPLE_DAILY_TASKS.length + SAMPLE_SPECIAL_TASKS.length} tasks!\n`);
}

async function seedShopItems() {
  console.log('🛍️  Seeding shop items...');
  
  // Check if shop items already exist
  const shopQuery = query(collection(db, 'shopItems'));
  const existingItems = await getDocs(shopQuery);
  
  if (existingItems.size > 0) {
    console.log(`⚠️  Found ${existingItems.size} existing shop items. Skipping...`);
    return;
  }
  
  for (const item of SAMPLE_SHOP_ITEMS) {
    const docRef = await addDoc(collection(db, 'shopItems'), item);
    console.log(`✅ Added shop item: ${item.name} (ID: ${docRef.id})`);
  }
  
  console.log(`✨ Successfully seeded ${SAMPLE_SHOP_ITEMS.length} shop items!\n`);
}

async function main() {
  console.log('\n🚀 Starting gamification data seeding...\n');
  
  try {
    await seedTasks();
    await seedShopItems();
    
    console.log('🎉 All done! Gamification system is ready to use!\n');
    console.log('Next steps:');
    console.log('1. Start your app: pnpm dev');
    console.log('2. Login to see your gamification progress');
    console.log('3. Complete tasks to earn XP and PulseTokens!');
    console.log('4. Visit the Shop tab to buy custom markers\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

main();
