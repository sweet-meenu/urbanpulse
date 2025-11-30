"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { getUserIncidents, getUserPosts, type Incident, type Post } from "@/lib/firebase-admin"
import { 
  getUserProgress, 
  getActiveTasks, 
  getShopItems, 
  getUserTransactions,
  purchaseShopItem,
  equipCustomMarker,
  type UserProgress,
  type Task,
  type ShopItem,
  type Transaction
} from "@/lib/gamification"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Mail, 
  Calendar,
  MapPin,
  Award,
  CheckCircle2,
  Clock,
  Edit2,
  Save,
  X,
  Loader2,
  AlertCircle,
  MessageCircle,
  Heart,
  Trophy,
  Coins,
  Sparkles,
  ShoppingBag
} from "lucide-react"
import { addToast } from "@heroui/toast"
import Link from "next/link"

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading, logout } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")
  const [location, setLocation] = useState("")
  
  const [myIncidents, setMyIncidents] = useState<Incident[]>([])
  const [myPosts, setMyPosts] = useState<Post[]>([])
  
  // Gamification state
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [dailyTasks, setDailyTasks] = useState<Task[]>([])
  const [specialTasks, setSpecialTasks] = useState<Task[]>([])
  const [shopItems, setShopItems] = useState<ShopItem[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }

    if (user) {
      setDisplayName(user.displayName || "")
      loadUserData()
    }
  }, [user, authLoading, router])

  const loadUserData = async () => {
    setLoading(true)
    try {
      const [incidents, posts, progress, tasks, items, trans] = await Promise.all([
        getUserIncidents(),
        getUserPosts(),
        getUserProgress(),
        getActiveTasks(),
        getShopItems(),
        getUserTransactions(20)
      ])
      setMyIncidents(incidents)
      setMyPosts(posts)
      setUserProgress(progress)
      setDailyTasks(tasks.daily)
      setSpecialTasks(tasks.special)
      setShopItems(items)
      setTransactions(trans)
    } catch (error) {
      console.error("Error loading user data:", error)
      addToast({ title: "Failed to load profile data", color: "danger" })
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (itemId: string) => {
    setPurchaseLoading(itemId)
    try {
      const result = await purchaseShopItem(itemId)
      addToast({ 
        title: result.message, 
        description: "Check your profile to see your new item!",
        color: "success" 
      })
      // Reload data to reflect purchase
      loadUserData()
    } catch (error: any) {
      addToast({ title: error.message || "Purchase failed", color: "danger" })
    } finally {
      setPurchaseLoading(null)
    }
  }

  const handleEquipMarker = async (markerType: "origin" | "destination" | "incident", itemId: string) => {
    try {
      await equipCustomMarker(markerType, itemId)
      addToast({ 
        title: "Marker equipped!", 
        description: "Your custom marker is now active on the map",
        color: "success" 
      })
      loadUserData()
    } catch (error: any) {
      addToast({ title: error.message || "Failed to equip marker", color: "danger" })
    }
  }

  const handleSaveProfile = async () => {
    // In a real app, this would update the user profile in Firestore
    addToast({ 
      title: "Profile updated", 
      description: "Your profile has been saved successfully",
      color: "success" 
    })
    setEditMode(false)
  }

  const handleCancelEdit = () => {
    setDisplayName(user?.displayName || "")
    setBio("")
    setLocation("")
    setEditMode(false)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return formatDate(date)
  }

  const calculateStats = () => {
    const totalLikes = myPosts.reduce((sum, post) => sum + (post.likesCount || 0), 0)
    const totalReplies = myPosts.reduce((sum, post) => sum + (post.repliesCount || 0), 0)
    const completedDailyTasks = dailyTasks.filter(t => userProgress?.completedDailyTasks.includes(t.id)).length
    const completedSpecialTasks = specialTasks.filter(t => userProgress?.completedSpecialTasks.includes(t.id)).length
    const completedTasks = completedDailyTasks + completedSpecialTasks
    
    return {
      totalIncidents: myIncidents.length,
      totalPosts: myPosts.length,
      totalLikes,
      totalReplies,
      completedChallenges: completedTasks,
      totalChallenges: dailyTasks.length + specialTasks.length
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null

  const stats = calculateStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                My Profile
              </h1>
              <p className="text-slate-600 dark:text-slate-400">Manage your account and track your progress</p>
            </div>
            <Button 
              variant="outline" 
              onClick={logout}
              className="border-2 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="mb-6 shadow-2xl border-2 border-purple-200/50 dark:border-purple-800/50 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 dark:from-gray-800 dark:via-purple-900/10 dark:to-blue-900/10">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center text-white text-3xl font-bold shadow-2xl ring-4 ring-purple-200 dark:ring-purple-800">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"
                  )}
                </div>
                <Badge className="px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
                  Level {Math.floor(stats.totalLikes / 10) + 1}
                </Badge>
              </div>

              {/* Info */}
              <div className="flex-1 space-y-4">
                {editMode ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Display Name</label>
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Bio</label>
                      <Input
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us about yourself"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Location</label>
                      <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Your city"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile} size="sm">
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button onClick={handleCancelEdit} variant="outline" size="sm">
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold">{user.displayName || "Anonymous User"}</h2>
                      <Button onClick={() => setEditMode(true)} variant="ghost" size="sm">
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                    
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </div>
                      {user.metadata?.creationTime && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Joined {new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>
                      )}
                      {location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {location}
                        </div>
                      )}
                    </div>

                    {bio && (
                      <p className="text-sm mt-2">{bio}</p>
                    )}
                  </div>
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-4 border-t border-purple-200 dark:border-purple-800">
                  <div className="text-center p-3 rounded-xl bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30">
                    <div className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                      {userProgress?.level || 1}
                    </div>
                    <div className="text-xs text-yellow-700 dark:text-yellow-400 font-medium flex items-center justify-center gap-1">
                      <Trophy className="h-3 w-3" />
                      Level
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
                    <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {userProgress?.pulseTokens || 0}
                    </div>
                    <div className="text-xs text-purple-700 dark:text-purple-400 font-medium flex items-center justify-center gap-1">
                      <Coins className="h-3 w-3" />
                      Tokens
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30">
                    <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                      {stats.totalIncidents}
                    </div>
                    <div className="text-xs text-orange-700 dark:text-orange-400 font-medium">Incidents</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30">
                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      {stats.totalPosts}
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-400 font-medium">Posts</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30">
                    <div className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                      {stats.totalLikes}
                    </div>
                    <div className="text-xs text-pink-700 dark:text-pink-400 font-medium">Likes</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30">
                    <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                      {stats.completedChallenges}/{stats.totalChallenges}
                    </div>
                    <div className="text-xs text-purple-700 dark:text-purple-400 font-medium">Challenges</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Content */}
        <Tabs defaultValue="challenges" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto bg-gradient-to-r from-purple-100 via-blue-100 to-cyan-100 dark:from-purple-900/30 dark:via-blue-900/30 dark:to-cyan-900/30 p-1">
            <TabsTrigger 
              value="challenges"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Challenges
            </TabsTrigger>
            <TabsTrigger 
              value="shop"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Shop
            </TabsTrigger>
            <TabsTrigger 
              value="reports"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              My Reports
            </TabsTrigger>
            <TabsTrigger 
              value="posts"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              My Posts
            </TabsTrigger>
          </TabsList>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-4">
            <Card className="shadow-2xl border-2 border-purple-200/50 dark:border-purple-800/50 bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-800 dark:to-purple-900/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Your Challenges
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dailyTasks.map((task) => {
                    const progress = userProgress?.taskProgress?.[task.id] || 0
                    const isCompleted = userProgress?.completedDailyTasks.includes(task.id) || false
                    const getColor = (cat: string) => {
                      if (cat === "pulse") return "from-red-500 to-pink-500"
                      if (cat === "incident") return "from-orange-500 to-red-500"
                      if (cat === "route") return "from-green-500 to-emerald-500"
                      return "from-purple-500 to-pink-500"
                    }
                    return (
                      <Card key={task.id} className={`overflow-hidden border-2 ${isCompleted ? 'border-green-500/50' : 'border-border'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getColor(task.category)} flex items-center justify-center text-2xl shrink-0`}>
                              {task.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-semibold text-sm">{task.title}</h3>
                                {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                              </div>
                              <p className="text-xs text-muted-foreground mb-3">{task.description}</p>
                              <div className="space-y-1 mb-2">
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Progress</span>
                                  <span className="font-medium">{progress}/{task.targetCount}</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full bg-gradient-to-r ${getColor(task.category)} transition-all duration-500`}
                                    style={{ width: `${Math.min((progress / task.targetCount) * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    {task.xpReward} XP
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    <Coins className="h-3 w-3 mr-1" />
                                    {task.tokenReward}
                                  </Badge>
                                </div>
                                {isCompleted ? (
                                  <span className="text-xs text-green-600 font-medium">Done!</span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">{task.targetCount - progress} left</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shop Tab */}
          <TabsContent value="shop" className="space-y-4">
            <Card className="shadow-2xl border-2 border-pink-200/50 dark:border-pink-800/50 bg-gradient-to-br from-white to-pink-50/30 dark:from-gray-800 dark:to-pink-900/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-pink-400 to-purple-500">
                      <ShoppingBag className="h-5 w-5 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                      Marketplace
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Coins className="h-5 w-5 text-purple-500" />
                    <span className="font-bold text-purple-600">{userProgress?.pulseTokens || 0} Tokens</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {shopItems.map((item) => {
                    const owned = userProgress?.ownedItems.includes(item.id) || false
                    const canAfford = (userProgress?.pulseTokens || 0) >= item.price
                    const meetsLevel = (userProgress?.level || 1) >= item.minLevel
                    const canPurchase = !owned && canAfford && meetsLevel

                    return (
                      <Card key={item.id} className={`overflow-hidden border-2 ${owned ? 'border-green-500/50' : !canPurchase ? 'border-gray-300 opacity-60' : 'border-border'}`}>
                        <CardContent className="p-4">
                          <div className="flex flex-col gap-3">
                            <div className="w-full h-24 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
                              <div className="text-4xl">{item.preview || "🎨"}</div>
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm mb-1">{item.name}</h3>
                              <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                              <div className="flex flex-wrap gap-2 mb-3">
                                <Badge variant="outline" className="text-xs">
                                  <Coins className="h-3 w-3 mr-1" />
                                  {item.price}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  <Trophy className="h-3 w-3 mr-1" />
                                  Level {item.minLevel}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {item.category}
                                </Badge>
                              </div>
                              {owned ? (
                                <Button size="sm" variant="outline" className="w-full" disabled>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Owned
                                </Button>
                              ) : canPurchase ? (
                                <Button 
                                  size="sm" 
                                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                                  onClick={() => handlePurchase(item.id)}
                                  disabled={purchaseLoading === item.id}
                                >
                                  {purchaseLoading === item.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <ShoppingBag className="h-4 w-4 mr-2" />
                                      Buy Now
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" className="w-full" disabled>
                                  {!meetsLevel ? `Requires Level ${item.minLevel}` : "Not enough tokens"}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    My Incident Reports
                  </CardTitle>
                  <Link href="/incidents">
                    <Button size="sm">
                      Report New
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {myIncidents.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">No incidents reported yet</p>
                    <Link href="/incidents">
                      <Button variant="outline" className="mt-4" size="sm">
                        Report Your First Incident
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myIncidents.map((incident) => (
                      <Card key={incident.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            {incident.images && incident.images[0] && (
                              <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                                <img 
                                  src={incident.images[0]} 
                                  alt="Incident" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                  <Badge variant="outline" className="mb-1">{incident.type}</Badge>
                                  <h4 className="font-medium text-sm">{incident.description}</h4>
                                </div>
                                <div className="flex items-center gap-1 text-sm shrink-0">
                                  <Heart className="h-4 w-4 text-red-500" />
                                  <span>{incident.pulses}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span>{incident.location?.name}</span>
                                <span>•</span>
                                <Clock className="h-3 w-3" />
                                <span>{formatTime(incident.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Posts Tab */}
          <TabsContent value="posts" className="space-y-4">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    My Posts
                  </CardTitle>
                  <Link href="/community">
                    <Button size="sm">
                      Create Post
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {myPosts.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">No posts yet</p>
                    <Link href="/community">
                      <Button variant="outline" className="mt-4" size="sm">
                        Create Your First Post
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myPosts.map((post) => (
                      <Card key={post.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm flex-1">{post.content}</p>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatTime(post.createdAt)}
                              </span>
                            </div>

                            {post.taggedIncident && (
                              <div className="p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="h-3 w-3 text-orange-600" />
                                  <span className="text-xs font-medium">{post.taggedIncident.title}</span>
                                </div>
                              </div>
                            )}

                            {post.images && post.images.length > 0 && (
                              <div className="grid grid-cols-2 gap-2">
                                {post.images.slice(0, 2).map((img, idx) => (
                                  <img
                                    key={idx}
                                    src={img}
                                    alt=""
                                    className="w-full h-24 object-cover rounded-lg"
                                  />
                                ))}
                              </div>
                            )}

                            <div className="flex items-center gap-4 pt-2 border-t text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Heart className="h-4 w-4" />
                                <span>{post.likesCount || 0}</span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <MessageCircle className="h-4 w-4" />
                                <span>{post.repliesCount || 0}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
