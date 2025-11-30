"use client"

import { useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import confetti from "canvas-confetti"
import { Sparkles, Trophy, Coins } from "lucide-react"

interface RewardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  xpAwarded?: number
  tokensAwarded?: number
  taskTitle?: string
  levelUp?: boolean
  newLevel?: number
}

export function RewardDialog({
  open,
  onOpenChange,
  xpAwarded,
  tokensAwarded,
  taskTitle,
  levelUp,
  newLevel,
}: RewardDialogProps) {
  
  useEffect(() => {
    if (open) {
      // Trigger confetti when dialog opens
      const end = Date.now() + 3000 // 3 seconds
      const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"]

      const frame = () => {
        if (Date.now() > end) return

        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          startVelocity: 60,
          origin: { x: 0, y: 0.5 },
          colors: colors,
        })
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          startVelocity: 60,
          origin: { x: 1, y: 0.5 },
          colors: colors,
        })

        requestAnimationFrame(frame)
      }

      frame()
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 border-2 border-purple-300 dark:border-purple-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {levelUp ? "LEVEL UP!" : "Task Completed!"}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Task Title */}
          {taskTitle && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">You completed:</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{taskTitle}</p>
            </div>
          )}

          {/* Level Up Message */}
          {levelUp && newLevel && (
            <div className="text-center p-4 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-lg border-2 border-yellow-400 dark:border-yellow-600">
              <Sparkles className="h-12 w-12 mx-auto text-yellow-500 mb-2 animate-pulse" />
              <p className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                Level {newLevel}
              </p>
              <p className="text-sm text-muted-foreground mt-1">You leveled up!</p>
            </div>
          )}

          {/* Rewards */}
          <div className="grid grid-cols-2 gap-3">
            {xpAwarded !== undefined && xpAwarded > 0 && (
              <div className="p-4 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-lg border-2 border-blue-300 dark:border-blue-700 text-center">
                <Sparkles className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  +{xpAwarded}
                </p>
                <p className="text-xs text-muted-foreground mt-1">XP</p>
              </div>
            )}

            {tokensAwarded !== undefined && tokensAwarded > 0 && (
              <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg border-2 border-purple-300 dark:border-purple-700 text-center">
                <Coins className="h-6 w-6 mx-auto text-purple-500 mb-2" />
                <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  +{tokensAwarded}
                </p>
                <p className="text-xs text-muted-foreground mt-1">PulseTokens</p>
              </div>
            )}
          </div>

          {/* Motivational Message */}
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              🎉 Keep up the great work! 🎉
            </p>
          </div>
        </div>

        <Button
          onClick={() => onOpenChange(false)}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
        >
          Awesome!
        </Button>
      </DialogContent>
    </Dialog>
  )
}
