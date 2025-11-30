/**
 * GAMIFICATION SYSTEM SETUP GUIDE
 * ================================
 * 
 * This file contains instructions and sample data for setting up the gamification system.
 * The system includes:
 * - User progression (levels, XP, tokens)
 * - Daily and special tasks
 * - Shop with custom markers and items
 * - Reward notifications with confetti
 * 
 * FIRESTORE COLLECTIONS NEEDED:
 * ==============================
 * 1. userProgress - Stores each user's progression data
 * 2. tasks - Contains all available tasks (managed by admin)
 * 3. shopItems - Contains all purchasable items
 * 4. transactions - Logs all token earnings and spending
 * 
 * SETUP STEPS:
 * ============
 */

// ============================================
// STEP 1: SEED SAMPLE TASKS
// ============================================
// Go to Firebase Console > Firestore Database > Create collection "tasks"
// Add these documents (you can add via Firebase Console or a seed script):

export const SAMPLE_DAILY_TASKS = [
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

export const SAMPLE_SPECIAL_TASKS = [
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

// ============================================
// STEP 2: SEED SHOP ITEMS
// ============================================
// Go to Firebase Console > Firestore Database > Create collection "shopItems"
// Add these documents:

export const SAMPLE_SHOP_ITEMS = [
    // CUSTOM MARKERS
    {
        name: "Golden Star Origin Marker",
        description: "Replace your origin marker with a shining golden star",
        category: "marker",
        price: 150,
        imageUrl: "⭐",
        preview: "data:image/svg+xml,...", // Custom SVG marker
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
        preview: "data:image/svg+xml,...",
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
        preview: "data:image/svg+xml,...",
        isAvailable: true,
        minLevel: 5,
        createdAt: new Date(),
    },

    // AVATAR FRAMES
    {
        name: "Bronze Frame",
        description: "Add a bronze border to your profile avatar",
        category: "avatar_frame",
        price: 100,
        imageUrl: "🥉",
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
        isAvailable: true,
        minLevel: 15,
        createdAt: new Date(),
    },
]

// ============================================
// STEP 3: INTEGRATION POINTS
// ============================================

/**
 * INTEGRATION CHECKLIST:
 * 
 * 1. ✅ Core Functions Created (lib/gamification.ts)
 *    - getUserProgress()
 *    - awardXp()
 *    - awardTokens()
 *    - updateTaskProgress()
 *    - getActiveTasks()
 *    - getShopItems()
 *    - purchaseShopItem()
 * 
 * 2. ✅ Reward Dialog Created (components/reward-dialog.tsx)
 *    - Shows XP and token rewards
 *    - Confetti animation
 *    - Level up celebrations
 * 
 * 3. ✅ Gamification Hook (hooks/use-gamification.ts)
 *    - useGamification() for tracking actions
 * 
 * 4. ⏳ PROFILE PAGE UPDATES NEEDED:
 *    - Replace mock challenges with real tasks from getActiveTasks()
 *    - Show task progress bars
 *    - Add Shop tab with getShopItems() and purchaseShopItem()
 *    - Display owned items and equipped markers
 *    - Show level progress with XP bar
 *    - Update level calculation to use getUserProgress()
 * 
 * 5. ⏳ INCIDENTS PAGE INTEGRATION:
 *    - In pulseIncident() function:
 *      ```typescript
 *      // After successful pulse
 *      await updateTaskProgress(pulseTaskId)
 *      ```
 *    - In createIncident() success handler:
 *      ```typescript
 *      await updateTaskProgress(incidentTaskId)
 *      ```
 * 
 * 6. ⏳ COMMUNITY PAGE INTEGRATION:
 *    - In createPost() success handler:
 *      ```typescript
 *      await updateTaskProgress(postTaskId)
 *      ```
 * 
 * 7. ⏳ MAPS PAGE INTEGRATION:
 *    - In calculateRoutes() success handler:
 *      ```typescript
 *      await updateTaskProgress(routeTaskId)
 *      ```
 *    - Load custom markers from user progress:
 *      ```typescript
 *      const progress = await getUserProgress()
 *      if (progress?.customMarkers?.origin) {
 *        // Use custom origin marker
 *      }
 *      ```
 * 
 * 8. ⏳ DASHBOARD INTEGRATION:
 *    - Initialize progress on mount:
 *      ```typescript
 *      useEffect(() => {
 *        initializeUserProgress()
 *      }, [])
 *      ```
 *    - Show current level and tokens in header
 */

// ============================================
// STEP 4: FIREBASE RULES
// ============================================

/**
 * Add these security rules to Firestore:
 * 
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     
 *     // User progress - users can only read/write their own
 *     match /userProgress/{userId} {
 *       allow read, write: if request.auth != null && request.auth.uid == userId;
 *     }
 *     
 *     // Tasks - everyone can read, only admins can write
 *     match /tasks/{taskId} {
 *       allow read: if request.auth != null;
 *       allow write: if false; // Only via admin SDK or Firebase Console
 *     }
 *     
 *     // Shop items - everyone can read, only admins can write
 *     match /shopItems/{itemId} {
 *       allow read: if request.auth != null;
 *       allow write: if false;
 *     }
 *     
 *     // Transactions - users can only read their own
 *     match /transactions/{transactionId} {
 *       allow read: if request.auth != null && 
 *                     resource.data.userId == request.auth.uid;
 *       allow write: if false; // Only via Cloud Functions
 *     }
 *   }
 * }
 */

// ============================================
// STEP 5: TASK MATCHING SYSTEM
// ============================================

/**
 * Create a helper function to match actions to tasks:
 * 
 * // lib/task-matcher.ts
 * import { getActiveTasks, updateTaskProgress } from './gamification'
 * 
 * export async function trackAction(category: TaskCategory) {
 *   try {
 *     const { daily, special } = await getActiveTasks()
 *     const allTasks = [...daily, ...special]
 *     
 *     // Find tasks matching this category
 *     const matchingTasks = allTasks.filter(t => t.category === category)
 *     
 *     // Update progress for each matching task
 *     const results = await Promise.all(
 *       matchingTasks.map(task => updateTaskProgress(task.id))
 *     )
 *     
 *     // Return completed tasks
 *     return results.filter(r => r.completed)
 *   } catch (error) {
 *     console.error('Error tracking action:', error)
 *     return []
 *   }
 * }
 */

// ============================================
// STEP 6: REWARD NOTIFICATION USAGE
// ============================================

/**
 * Example usage in any component:
 * 
 * import { RewardDialog } from '@/components/reward-dialog'
 * import { useState } from 'react'
 * 
 * function MyComponent() {
 *   const [showReward, setShowReward] = useState(false)
 *   const [rewardData, setRewardData] = useState({})
 *   
 *   async function handlePulse() {
 *     await pulseIncident(incidentId)
 *     
 *     // Track the action
 *     const result = await updateTaskProgress(pulseTaskId)
 *     
 *     if (result.completed) {
 *       setRewardData({
 *         xpAwarded: result.xpAwarded,
 *         tokensAwarded: result.tokensAwarded,
 *         taskTitle: "Pulse 1 incident near you"
 *       })
 *       setShowReward(true)
 *     }
 *   }
 *   
 *   return (
 *     <>
 *       <button onClick={handlePulse}>Pulse</button>
 *       
 *       <RewardDialog 
 *         open={showReward}
 *         onOpenChange={setShowReward}
 *         {...rewardData}
 *       />
 *     </>
 *   )
 * }
 */

// ============================================
// LEVELING SYSTEM REFERENCE
// ============================================

/**
 * XP REQUIREMENTS:
 * - Level 1 → 2: 100 XP
 * - Level 2 → 3: 200 XP
 * - Level 3 → 4: 300 XP
 * - Level N → N+1: N * 100 XP
 * 
 * TOKEN REWARDS PER LEVEL:
 * - Level 2: 100 tokens
 * - Level 3: 150 tokens
 * - Level 4: 200 tokens
 * - Level N: N * 50 tokens
 * 
 * STARTING BONUS:
 * - New users get 100 PulseTokens
 * 
 * TASK REWARDS (suggested):
 * - Daily tasks: 30-100 XP, 5-25 tokens
 * - Special tasks: 200-500 XP, 50-100 tokens
 */

export const GAMIFICATION_CONFIG = {
    startingTokens: 100,
    xpPerLevel: (level: number) => level * 100,
    tokensPerLevel: (level: number) => level * 50,
    maxDailyTasks: 3,
    maxSpecialTasks: 2,
}
