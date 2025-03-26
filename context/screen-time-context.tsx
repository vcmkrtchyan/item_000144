"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

export type Device = "phone" | "tablet" | "laptop" | "desktop" | "other"

export type Category =
  | "social media"
  | "productivity"
  | "entertainment"
  | "gaming"
  | "communication"
  | "education"
  | "other"

export interface TimeEntry {
  id: string
  date: string
  device: Device
  app: string
  category: Category
  duration: number // in minutes
  notes?: string
}

export interface Goal {
  id: string
  type: "app" | "category" | "total"
  target: string // app name or category
  limit: number // in minutes
}

interface ScreenTimeContextType {
  entries: TimeEntry[]
  goals: Goal[]
  addEntry: (entry: Omit<TimeEntry, "id">) => void
  updateEntry: (id: string, entry: Partial<TimeEntry>) => void
  deleteEntry: (id: string) => void
  addGoal: (goal: Omit<Goal, "id">) => void
  updateGoal: (id: string, goal: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  getTodayUsage: (type?: "app" | "category", target?: string) => number
  getUsageByDate: (date: string) => TimeEntry[]
}

const ScreenTimeContext = createContext<ScreenTimeContextType | undefined>(undefined)

export const useScreenTime = () => {
  const context = useContext(ScreenTimeContext)
  if (!context) {
    throw new Error("useScreenTime must be used within a ScreenTimeProvider")
  }
  return context
}

export const ScreenTimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [goals, setGoals] = useState<Goal[]>([])

  // Load data from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEntries = localStorage.getItem("screenTimeEntries")
      const savedGoals = localStorage.getItem("screenTimeGoals")

      if (savedEntries) {
        setEntries(JSON.parse(savedEntries))
      }

      if (savedGoals) {
        setGoals(JSON.parse(savedGoals))
      }
    }
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("screenTimeEntries", JSON.stringify(entries))
    }
  }, [entries])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("screenTimeGoals", JSON.stringify(goals))
    }
  }, [goals])

  const addEntry = (entry: Omit<TimeEntry, "id">) => {
    const newEntry = {
      ...entry,
      id: crypto.randomUUID(),
    }
    setEntries((prev) => [...prev, newEntry])
  }

  const updateEntry = (id: string, updatedFields: Partial<TimeEntry>) => {
    setEntries((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...updatedFields } : entry)))
  }

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id))
  }

  const addGoal = (goal: Omit<Goal, "id">) => {
    const newGoal = {
      ...goal,
      id: crypto.randomUUID(),
    }
    setGoals((prev) => [...prev, newGoal])
  }

  const updateGoal = (id: string, updatedFields: Partial<Goal>) => {
    setGoals((prev) => prev.map((goal) => (goal.id === id ? { ...goal, ...updatedFields } : goal)))
  }

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== id))
  }

  const getTodayUsage = (type?: "app" | "category", target?: string) => {
    const today = new Date().toISOString().split("T")[0]
    return entries
      .filter((entry) => {
        if (entry.date !== today) return false
        if (!type) return true
        if (type === "app") return entry.app === target
        if (type === "category") return entry.category === target
        return true
      })
      .reduce((total, entry) => total + entry.duration, 0)
  }

  const getUsageByDate = (date: string) => {
    return entries.filter((entry) => entry.date === date)
  }

  const value = {
    entries,
    goals,
    addEntry,
    updateEntry,
    deleteEntry,
    addGoal,
    updateGoal,
    deleteGoal,
    getTodayUsage,
    getUsageByDate,
  }

  return <ScreenTimeContext.Provider value={value}>{children}</ScreenTimeContext.Provider>
}

