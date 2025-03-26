"use client"

import type React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useScreenTime, type Device, type Category } from "@/context/screen-time-context"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  app: z.string().min(1, "App name is required"),
  category: z.string().min(1, "Category is required"),
  device: z.string().min(1, "Device is required"),
  hours: z.coerce.number().min(0).max(24),
  minutes: z.coerce.number().min(0).max(59),
  notes: z.string().optional(),
})

export default function TimeTracker() {
  const { addEntry } = useScreenTime()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastCategory, setLastCategory] = useState<Category>("social media")
  const [lastDevice, setLastDevice] = useState<Device>("phone")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      app: "",
      category: lastCategory,
      device: lastDevice,
      hours: 0,
      minutes: 15,
      notes: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)

    try {
      const totalMinutes = values.hours * 60 + values.minutes

      // Save the selected category and device for next time
      setLastCategory(values.category as Category)
      setLastDevice(values.device as Device)

      addEntry({
        date: new Date().toISOString().split("T")[0],
        app: values.app,
        category: values.category as Category,
        device: values.device as Device,
        duration: totalMinutes,
        notes: values.notes,
      })

      // Reset the form but keep the last selected category and device
      form.reset({
        app: "",
        category: values.category, // Keep the current category
        device: values.device, // Keep the current device
        hours: 0,
        minutes: 15,
        notes: "",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Function to select all text in an input when clicked
  const handleInputClick = (event: React.MouseEvent<HTMLInputElement>) => {
    event.currentTarget.select()
  }

  const devices: Device[] = ["phone", "tablet", "laptop", "desktop", "other"]
  const categories: Category[] = [
    "social media",
    "productivity",
    "entertainment",
    "gaming",
    "communication",
    "education",
    "other",
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Screen Time</CardTitle>
        <CardDescription>Manually track your device usage</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="app"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>App or Website</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Instagram, Netflix, Gmail" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="device"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select device" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {devices.map((device) => (
                          <SelectItem key={device} value={device}>
                            {device.charAt(0).toUpperCase() + device.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="24" {...field} onClick={handleInputClick} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minutes</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="59" {...field} onClick={handleInputClick} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add any additional details" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Log Screen Time"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

