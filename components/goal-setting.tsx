"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useScreenTime, type Category, type Goal } from "@/context/screen-time-context"
import { Trash2, Edit, Plus, Target, ArrowUp, Clock, BarChart3, AlertTriangle } from "lucide-react"
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
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"

const formSchema = z.object({
  type: z.enum(["app", "category", "total"]),
  target: z.string().optional(),
  limit: z.coerce.number().min(1, "Limit must be at least 1 minute"),
})

export default function GoalSetting() {
  const { goals, addGoal, updateGoal, deleteGoal, getTodayUsage } = useScreenTime()
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null)
  const deletedGoalRef = useRef<Goal | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "total",
      target: "",
      limit: 120,
    },
  })

  const watchType = form.watch("type")

  // Reset form error when form values change
  const resetFormError = () => {
    if (formError) {
      setFormError(null)
    }
  }

  // Check if a goal would conflict with existing goals
  const hasConflict = (type: string, target: string | undefined, limit: number, excludeId?: string) => {
    const conflictingGoal = goals.find((goal) => {
      // Skip the goal being edited
      if (excludeId && goal.id === excludeId) return false

      // Check for conflicts
      if (type === "total" && goal.type === "total") {
        return true // Can't have multiple total goals
      }

      if (type === "category" && goal.type === "category" && goal.target === target) {
        return true // Can't have multiple goals for the same category
      }

      if (type === "app" && goal.type === "app" && goal.target === target) {
        return true // Can't have multiple goals for the same app
      }

      return false
    })

    return conflictingGoal
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Check for conflicts
    const conflictingGoal = hasConflict(values.type, values.target, values.limit, isEditing || undefined)

    if (conflictingGoal) {
      // Set error message based on the type of conflict
      let errorMessage = ""
      if (values.type === "total") {
        errorMessage = "You already have a total screen time goal. Please edit the existing goal instead."
      } else if (values.type === "category") {
        errorMessage = `You already have a goal for the "${values.target}" category. Please edit the existing goal instead.`
      } else {
        errorMessage = `You already have a goal for the app "${values.target}". Please edit the existing goal instead.`
      }

      setFormError(errorMessage)
      return
    }

    if (isEditing) {
      updateGoal(isEditing, values)
      setIsEditing(null)
      toast.success("Goal updated successfully")
    } else {
      addGoal(values)
      toast.success("Goal created successfully")
    }
    setIsDialogOpen(false)
    setFormError(null)
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
      setFormError(null)
      setIsDialogOpen(true)
    }
  }

  const handleDeleteClick = (id: string) => {
    const goal = goals.find((g) => g.id === id)
    if (goal) {
      deletedGoalRef.current = goal
      setGoalToDelete(id)
      setIsDeleteDialogOpen(true)
    }
  }

  const confirmDelete = () => {
    if (goalToDelete && deletedGoalRef.current) {
      const goalCopy = { ...deletedGoalRef.current }
      deleteGoal(goalToDelete)

      // Show toast with undo option
      toast.info("Goal deleted", {
        description: getGoalDescription(goalCopy),
        action: {
          label: "Undo",
          onClick: () => {
            // Add the goal back
            addGoal({
              type: goalCopy.type,
              target: goalCopy.target,
              limit: goalCopy.limit,
            })
            toast.success("Goal restored")
          },
        },
        duration: 5000,
      })

      setGoalToDelete(null)
    }
    setIsDeleteDialogOpen(false)
  }

  const getGoalDescription = (goal: Goal | null) => {
    if (!goal) return ""

    if (goal.type === "total") {
      return `Total screen time limit of ${Math.floor(goal.limit / 60)}h ${goal.limit % 60}m`
    } else if (goal.type === "category") {
      return `${goal.target.charAt(0).toUpperCase() + goal.target.slice(1)} category limit of ${Math.floor(goal.limit / 60)}h ${goal.limit % 60}m`
    } else {
      return `${goal.target} app limit of ${Math.floor(goal.limit / 60)}h ${goal.limit % 60}m`
    }
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
      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this goal? This action can be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setGoalToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Screen Time Goals</h2>
          <p className="text-muted-foreground">Set limits for your digital usage</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) {
              setFormError(null)
              if (!isEditing) {
                form.reset({
                  type: "total",
                  target: "",
                  limit: 120,
                })
              }
            }
          }}
        >
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

            {formError && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Type</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          resetFormError()
                        }}
                        defaultValue={field.value}
                      >
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
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value)
                              resetFormError()
                            }}
                            defaultValue={field.value}
                          >
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
                            <Input
                              placeholder="e.g. Instagram, Netflix"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e)
                                resetFormError()
                              }}
                            />
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
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e)
                            resetFormError()
                          }}
                        />
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
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative bg-gradient-to-b from-primary/10 to-background p-6 flex flex-col items-center">
              <div className="absolute top-6 right-6 animate-bounce">
                <ArrowUp className="h-6 w-6 text-primary" />
              </div>

              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 animate-ping opacity-30">
                    <Target className="h-16 w-16 text-primary" />
                  </div>
                  <Target className="h-16 w-16 text-primary relative" />
                </div>

                <h3 className="text-xl font-medium mb-2">Set Your First Goal</h3>
                <p className="text-muted-foreground max-w-md">
                  Create screen time goals to help manage your digital habits. Click the "Add Goal" button above to get
                  started.
                </p>

                <div className="grid grid-cols-3 gap-4 mt-8">
                  <div className="flex flex-col items-center text-center p-3 rounded-lg bg-card">
                    <Clock className="h-8 w-8 text-primary mb-2" />
                    <p className="text-sm font-medium">Total Screen Time</p>
                    <p className="text-xs text-muted-foreground">Limit overall usage</p>
                  </div>

                  <div className="flex flex-col items-center text-center p-3 rounded-lg bg-card">
                    <BarChart3 className="h-8 w-8 text-primary mb-2" />
                    <p className="text-sm font-medium">By Category</p>
                    <p className="text-xs text-muted-foreground">Limit by activity type</p>
                  </div>

                  <div className="flex flex-col items-center text-center p-3 rounded-lg bg-card">
                    <Target className="h-8 w-8 text-primary mb-2" />
                    <p className="text-sm font-medium">By App</p>
                    <p className="text-xs text-muted-foreground">Limit specific apps</p>
                  </div>
                </div>
              </div>
            </div>
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
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(goal.id)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
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

