"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useScreenTime } from "@/context/screen-time-context"
import TimeTracker from "@/components/time-tracker"
import GoalSetting from "@/components/goal-setting"
import UsageStats from "@/components/usage-stats"
import UsageChart from "@/components/usage-chart"
import { Clock, BarChart, Target, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("track")
  const { entries, goals, getTodayUsage, deleteEntry } = useScreenTime()
  const [anyGoalReached, setAnyGoalReached] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const todayTotal = getTodayUsage()
  const todayDate = new Date().toISOString().split("T")[0]

  // Check if any goals have reached their limits
  useEffect(() => {
    const checkGoals = () => {
      const reached = goals.some((goal) => {
        let currentUsage = 0

        if (goal.type === "total") {
          currentUsage = getTodayUsage()
        } else if (goal.type === "app") {
          currentUsage = getTodayUsage("app", goal.target)
        } else if (goal.type === "category") {
          currentUsage = getTodayUsage("category", goal.target)
        }

        return currentUsage >= goal.limit
      })

      setAnyGoalReached(reached)
    }

    checkGoals()
  }, [goals, entries, getTodayUsage])

  // Get recent entries (all entries, not just today's)
  const recentEntries = [...entries]
    .sort((a, b) => {
      // Sort by date (newest first)
      const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime()

      // If dates are the same, we'll assume newer entries are added later in the array
      // This is a simplification since we don't have timestamps
      if (dateComparison === 0) {
        // Use the array index as a proxy for time (higher index = more recently added)
        return entries.indexOf(b) - entries.indexOf(a)
      }

      return dateComparison
    })
    .slice(0, 5) // Get the 5 most recent entries

  const handleDeleteClick = (id: string) => {
    setEntryToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (entryToDelete) {
      deleteEntry(entryToDelete)
      setEntryToDelete(null)
    }
    setIsDeleteDialogOpen(false)
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <header className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Screen Time Tracker</h1>
          <p className="text-muted-foreground">Track, visualize, and manage your digital habits</p>
        </div>
        <Card className="w-full md:w-auto">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Today's Screen Time</p>
                <p className="text-2xl font-bold">
                  {Math.floor(todayTotal / 60)}h {todayTotal % 60}m
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </header>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete entry?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this entry from your records.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEntryToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
          <TabsTrigger value="track" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Track</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            <span className="hidden sm:inline">Stats</span>
          </TabsTrigger>
          <TabsTrigger
            value="goals"
            className={`flex items-center gap-2 ${anyGoalReached && activeTab !== "goals" ? "relative animate-pulse" : ""}`}
          >
            <Target className={`h-4 w-4 ${anyGoalReached && activeTab !== "goals" ? "text-destructive" : ""}`} />
            <span
              className={`hidden sm:inline ${anyGoalReached && activeTab !== "goals" ? "text-destructive font-semibold" : ""}`}
            >
              Goals
            </span>
            {anyGoalReached && activeTab !== "goals" && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="track" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <TimeTracker />
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest screen time entries</CardDescription>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="space-y-2">
                  {recentEntries.length > 0 ? (
                    recentEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex justify-between items-center p-2 rounded-md bg-muted/50 group"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{entry.app}</p>
                          <p className="text-sm text-muted-foreground">
                            {entry.date === todayDate ? "Today" : entry.date} • {entry.category} • {entry.device}
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <p className="font-medium">
                            {Math.floor(entry.duration / 60)}h {entry.duration % 60}m
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteClick(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No entries yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <UsageStats />
            <UsageChart />
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <GoalSetting />
        </TabsContent>
      </Tabs>
    </div>
  )
}

