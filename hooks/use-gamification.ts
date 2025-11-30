"use client"

import { useState, useCallback } from "react"
import { updateTaskProgress, type Task } from "@/lib/gamification"

interface TaskReward {
  completed: boolean
  xpAwarded?: number
  tokensAwarded?: number
  taskTitle?: string
}

export function useGamification() {
  const [showReward, setShowReward] = useState(false)
  const [rewardData, setRewardData] = useState<TaskReward | null>(null)

  // Track action and check for task completion
  const trackAction = useCallback(async (
    category: "pulse" | "post" | "incident" | "route" | "social",
    taskTitle?: string,
    incrementBy: number = 1
  ) => {
    try {
      // In a real implementation, you'd match the category to active tasks
      // For now, we'll pass a task ID if we have one
      // This is a simplified version - you'd need to fetch active tasks
      // and find matching ones based on category
      
      // TODO: Implement task matching logic
      // const tasks = await getActiveTasks()
      // const matchingTask = tasks.daily.find(t => t.category === category) || 
      //                      tasks.special.find(t => t.category === category)
      
      // For demo purposes, returning early
      return null
    } catch (error) {
      console.error("Error tracking action:", error)
      return null
    }
  }, [])

  // Manually trigger task completion (when you have the task ID)
  const completeTask = useCallback(async (taskId: string, task?: Task) => {
    try {
      const result = await updateTaskProgress(taskId, 1)
      
      if (result.completed) {
        setRewardData({
          completed: true,
          xpAwarded: result.xpAwarded,
          tokensAwarded: result.tokensAwarded,
          taskTitle: task?.title,
        })
        setShowReward(true)
      }
      
      return result
    } catch (error) {
      console.error("Error completing task:", error)
      return null
    }
  }, [])

  const hideReward = useCallback(() => {
    setShowReward(false)
    setRewardData(null)
  }, [])

  return {
    showReward,
    rewardData,
    trackAction,
    completeTask,
    hideReward,
  }
}
