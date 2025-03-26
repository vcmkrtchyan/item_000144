"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useScreenTime, type Category } from "@/context/screen-time-context"
import { Trash2, Edit, Plus, Target } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const formSchema = z.object({
  type: z.enum(["app", "category", "total"]),
  target: z.string().optional(),
  limit: z.coerce.number().min(1, "Limit must be at least 1 minute"),
})

export default function GoalSetting() {
  const { goals, addGoal, updateGoal, deleteGoal, getTodayUsage } = useScreenTime()
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "total",
      target: "",
      limit: 120,
    },
  })

  const watchType = form.watch("type")

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isEditing) {
      updateGoal(isEditing, values)
      setIsEditing(null)
    } else {
      addGoal(values)
    }
    setIsDialogOpen(false)
    form.reset({
      type: "total",
      target: "",
      limit: 120,
    })
  }

  const handleEdit = (id: string) => {
    const goal = goals.find((g) => g.id === id)
    if (goal) {
      form.reset({
        type: goal.type,
        target: goal.target,
        limit: goal.limit,
      })
      setIsEditing(id)
      setIsDialogOpen(true)
    }
  }

  const handleDelete = (id: string) => {
    deleteGoal(id)
  }

  const categories: Category[] = [
    "social media",
    "productivity",
    "entertainment",
    "gaming",
    "communication",
    "education",
    "other",
  ]

  const getProgressPercentage = (goal: (typeof goals)[0]) => {
    let usage = 0

    if (goal.type === "total") {
      usage = getTodayUsage()
    } else if (goal.type === "app") {
      usage = getTodayUsage("app", goal.target)
    } else if (goal.type === "category") {
      usage = getTodayUsage("category", goal.target)
    }

    return Math.min(Math.round((usage / goal.limit) * 100), 100)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Screen Time Goals</h2>
          <p className="text-muted-foreground">Set limits for your digital usage</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Goal" : "Create New Goal"}</DialogTitle>
              <DialogDescription>Set limits for your screen time.</DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select goal type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="total">Total Screen Time</SelectItem>
                          <SelectItem value="category">By Category</SelectItem>
                          <SelectItem value="app">By App</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchType !== "total" && (
                  <FormField
                    control={form.control}
                    name="target"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{watchType === "category" ? "Category" : "App Name"}</FormLabel>
                        {watchType === "category" ? (
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
                        ) : (
                          <FormControl>
                            <Input placeholder="e.g. Instagram, Netflix" {...field} />
                          </FormControl>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="limit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Daily Limit (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormDescription>
                        {field.value >= 60
                          ? `${Math.floor(field.value / 60)}h ${field.value % 60}m per day`
                          : `${field.value}m per day`}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit">{isEditing ? "Update Goal" : "Create Goal"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No goals set</h3>
            <p className="text-muted-foreground text-center mt-2">
              Create your first screen time goal to start managing your digital habits.
            </p>
            <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => {
            const progress = getProgressPercentage(goal)
            return (
              <Card key={goal.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      {goal.type === "total"
                        ? "Total Screen Time"
                        : goal.type === "category"
                          ? `${goal.target.charAt(0).toUpperCase() + goal.target.slice(1)}`
                          : goal.target}
                    </CardTitle>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(goal.id)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently delete this goal.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(goal.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <CardDescription>
                    {goal.type === "total"
                      ? "Daily limit for all screen time"
                      : goal.type === "category"
                        ? `Daily limit for ${goal.target} apps`
                        : `Daily limit for ${goal.target}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        {Math.floor(
                          getTodayUsage(
                            goal.type === "total" ? undefined : goal.type,
                            goal.type === "total" ? undefined : goal.target,
                          ) / 60,
                        )}
                        h{" "}
                        {getTodayUsage(
                          goal.type === "total" ? undefined : goal.type,
                          goal.type === "total" ? undefined : goal.target,
                        ) % 60}
                        m
                      </span>
                      <span className="text-muted-foreground">
                        {Math.floor(goal.limit / 60)}h {goal.limit % 60}m
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          progress >= 100 ? "bg-destructive" : progress >= 80 ? "bg-warning" : "bg-primary"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

