"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useScreenTime } from "@/context/screen-time-context"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"

export default function UsageStats() {
  const { entries, getTodayUsage } = useScreenTime()
  const [date, setDate] = useState<Date>(new Date())
  const [view, setView] = useState<"category" | "app" | "device">("category")

  const selectedDate = format(date, "yyyy-MM-dd")
  const filteredEntries = entries.filter((entry) => entry.date === selectedDate)

  const totalMinutes = filteredEntries.reduce((total, entry) => total + entry.duration, 0)

  const getGroupedData = () => {
    const grouped = new Map<string, number>()

    filteredEntries.forEach((entry) => {
      const key = view === "category" ? entry.category : view === "app" ? entry.app : entry.device

      if (grouped.has(key)) {
        grouped.set(key, grouped.get(key)! + entry.duration)
      } else {
        grouped.set(key, entry.duration)
      }
    })

    return Array.from(grouped.entries())
      .map(([name, duration]) => ({ name, duration }))
      .sort((a, b) => b.duration - a.duration)
  }

  const groupedData = getGroupedData()

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Usage Breakdown</CardTitle>
        <CardDescription>View your screen time by category, app, or device</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-2">
          <span className="text-sm font-medium">Select Date</span>
          <Calendar
            mode="single"
            selected={date}
            onSelect={(date) => date && setDate(date)}
            className="rounded-md border"
            disabled={(date) => date > new Date()}
          />
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="category">Category</TabsTrigger>
            <TabsTrigger value="app">App</TabsTrigger>
            <TabsTrigger value="device">Device</TabsTrigger>
          </TabsList>

          <TabsContent value={view} className="pt-4">
            {totalMinutes > 0 ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Screen Time</p>
                  <p className="text-2xl font-bold">
                    {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
                  </p>
                </div>

                <div className="space-y-2">
                  {groupedData.map(({ name, duration }) => {
                    const percentage = Math.round((duration / totalMinutes) * 100)
                    return (
                      <div key={name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{name.charAt(0).toUpperCase() + name.slice(1)}</span>
                          <span>
                            {Math.floor(duration / 60)}h {duration % 60}m ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No data for this date</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

