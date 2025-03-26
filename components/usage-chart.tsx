"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useScreenTime } from "@/context/screen-time-context"
import { addDays, format, startOfWeek } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function UsageChart() {
  const { entries } = useScreenTime()
  const [chartType, setChartType] = useState<"bar" | "pie">("bar")
  const [chartData, setChartData] = useState<any[]>([])
  const [maxValue, setMaxValue] = useState(60) // Default minimum scale (1 hour)

  useEffect(() => {
    generateChartData()
  }, [entries, chartType])

  const generateChartData = () => {
    const today = new Date()

    // Generate dates for the week
    const startDay = startOfWeek(today, { weekStartsOn: 1 }) // Start from Monday
    const dates = Array.from({ length: 7 }, (_, i) => addDays(startDay, i))

    if (chartType === "bar") {
      // Daily data for the week
      const data = dates.map((date) => {
        const dateStr = format(date, "yyyy-MM-dd")
        const dayEntries = entries.filter((entry) => entry.date === dateStr)
        const totalMinutes = dayEntries.reduce((sum, entry) => sum + entry.duration, 0)

        return {
          label: format(date, "EEE"), // "Mon", "Tue", etc.
          value: totalMinutes,
          tooltip: `${format(date, "MMM d")}: ${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
        }
      })

      // Find maximum value for scaling
      const max = Math.max(...data.map((d) => d.value), 60) // At least 60 minutes
      setMaxValue(max)
      setChartData(data)
    } else if (chartType === "pie") {
      // For pie chart, filter entries for the week
      const formattedDates = dates.map((date) => format(date, "yyyy-MM-dd"))
      const filteredEntries = entries.filter((entry) => formattedDates.includes(entry.date))

      // Group by category
      const categoryMap = new Map<string, number>()

      filteredEntries.forEach((entry) => {
        if (categoryMap.has(entry.category)) {
          categoryMap.set(entry.category, categoryMap.get(entry.category)! + entry.duration)
        } else {
          categoryMap.set(entry.category, entry.duration)
        }
      })

      // Convert to array and sort
      const data = Array.from(categoryMap.entries())
        .map(([category, minutes]) => ({
          label: category.charAt(0).toUpperCase() + category.slice(1),
          value: minutes,
          tooltip: `${category}: ${Math.floor(minutes / 60)}h ${minutes % 60}m`,
        }))
        .sort((a, b) => b.value - a.value)

      setChartData(data)

      // Calculate total for percentages
      const total = data.reduce((sum, item) => sum + item.value, 0)
      setMaxValue(total)
    }
  }

  // Get color for SVG segments
  const getSegmentColor = (index: number) => {
    const colors = [
      "#7c3aed", // primary
      "#3b82f6", // blue-500
      "#22c55e", // green-500
      "#eab308", // yellow-500
      "#ef4444", // red-500
      "#ec4899", // pink-500
      "#6366f1", // indigo-500
    ]
    return colors[index % colors.length]
  }

  // Calculate percentage for pie chart
  const getPercentage = (value: number) => {
    return maxValue > 0 ? Math.round((value / maxValue) * 100) : 0
  }

  // Generate SVG pie chart
  const generatePieChart = () => {
    if (chartData.length === 0) return null

    const size = 200
    const radius = size / 2
    const centerX = radius
    const centerY = radius

    // Special case for single category
    if (chartData.length === 1) {
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
          <circle
            cx={centerX}
            cy={centerY}
            r={radius - 1} // Slightly smaller to fit within SVG
            fill={getSegmentColor(0)}
            stroke="white"
            strokeWidth="1"
            className="hover:opacity-90 transition-opacity cursor-pointer"
          >
            <title>{chartData[0].tooltip} (100%)</title>
          </circle>
        </svg>
      )
    }

    // Normal case for multiple categories
    let startAngle = 0
    const segments = chartData.map((item, index) => {
      const percentage = getPercentage(item.value)
      if (percentage < 1) return null

      const angle = (percentage / 100) * 360
      const endAngle = startAngle + angle

      // Calculate the two points on the arc
      const startRad = (startAngle - 90) * (Math.PI / 180)
      const endRad = (endAngle - 90) * (Math.PI / 180)

      const x1 = centerX + radius * Math.cos(startRad)
      const y1 = centerY + radius * Math.sin(startRad)
      const x2 = centerX + radius * Math.cos(endRad)
      const y2 = centerY + radius * Math.sin(endRad)

      // Determine if the arc should be drawn as a large arc
      const largeArcFlag = angle > 180 ? 1 : 0

      // Create the SVG path
      const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`

      const segment = (
        <path
          key={index}
          d={path}
          fill={getSegmentColor(index)}
          stroke="white"
          strokeWidth="1"
          className="hover:opacity-90 transition-opacity cursor-pointer"
        >
          <title>
            {item.tooltip} ({percentage}%)
          </title>
        </path>
      )

      startAngle = endAngle
      return segment
    })

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
        {segments}
      </svg>
    )
  }

  return (
    <Card className="col-span-1">
      <CardHeader>
        <div>
          <CardTitle>Weekly Usage</CardTitle>
          <CardDescription>Visualize your weekly screen time patterns</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={chartType} onValueChange={(v) => setChartType(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bar">Bar Chart</TabsTrigger>
            <TabsTrigger value="pie">Pie Chart</TabsTrigger>
          </TabsList>

          <TabsContent value="bar" className="pt-4">
            {chartData.length > 0 ? (
              <div className="h-[250px] flex items-end space-x-2">
                {chartData.map((item, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div
                      className="w-full bg-primary rounded-t-sm transition-all duration-500 ease-in-out relative group"
                      style={{
                        height: `${Math.max(4, (item.value / maxValue) * 200)}px`,
                        minHeight: item.value > 0 ? "4px" : "0",
                      }}
                    >
                      <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-background border border-border px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.tooltip}
                      </div>
                    </div>
                    <div className="text-xs mt-2 text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center">
                <p className="text-muted-foreground">No data available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pie" className="pt-4">
            {chartData.length > 0 ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-[200px] h-[200px] flex-shrink-0">{generatePieChart()}</div>

                <ScrollArea className="w-full h-[150px] md:h-auto">
                  <div className="flex flex-col gap-2 w-full pr-4">
                    {chartData.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs sm:text-sm">
                        <div
                          className="w-3 h-3 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: getSegmentColor(index) }}
                        />
                        <div className="flex-1 truncate" title={item.label}>
                          {item.label}
                        </div>
                        <div className="font-medium whitespace-nowrap">
                          {Math.floor(item.value / 60)}h {item.value % 60}m
                        </div>
                        <div className="text-muted-foreground w-8 text-right">
                          {chartData.length === 1 ? "100" : getPercentage(item.value)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center">
                <p className="text-muted-foreground">No data available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

