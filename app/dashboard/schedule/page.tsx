"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { getRoadmaps, saveRoadmap, updateStreak, getStats, updateStats } from "@/lib/store"
import type { Roadmap, StudyPlanEntry } from "@/lib/types"
import { DailyTaskCard } from "@/components/dashboard/daily-task-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"

function getWeekDates(referenceDate: Date): Date[] {
  const start = new Date(referenceDate)
  const day = start.getDay()
  start.setDate(start.getDate() - day)
  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    dates.push(d)
  }
  return dates
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

export default function SchedulePage() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([])
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()))

  const loadData = useCallback(() => {
    setRoadmaps(getRoadmaps())
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const referenceDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + weekOffset * 7)
    return d
  }, [weekOffset])

  const weekDates = useMemo(() => getWeekDates(referenceDate), [referenceDate])

  const today = formatDate(new Date())

  // Get all tasks for the selected date across all roadmaps
  const selectedTasks = useMemo(() => {
    const tasks: { roadmapId: string; roadmapName: string; entry: StudyPlanEntry }[] = []
    for (const roadmap of roadmaps) {
      for (const entry of roadmap.studyPlan) {
        if (entry.studyDate === selectedDate) {
          tasks.push({
            roadmapId: roadmap.id,
            roadmapName: roadmap.syllabus.name,
            entry,
          })
        }
      }
    }
    return tasks
  }, [roadmaps, selectedDate])

  // Get task count per day for the week
  const dayTaskCounts = useMemo(() => {
    const counts: Record<string, { total: number; completed: number; hours: number }> = {}
    for (const date of weekDates) {
      const dateStr = formatDate(date)
      counts[dateStr] = { total: 0, completed: 0, hours: 0 }
    }
    for (const roadmap of roadmaps) {
      for (const entry of roadmap.studyPlan) {
        if (counts[entry.studyDate]) {
          counts[entry.studyDate].total++
          counts[entry.studyDate].hours += entry.allocatedHours
          if (entry.status === "completed") {
            counts[entry.studyDate].completed++
          }
        }
      }
    }
    return counts
  }, [roadmaps, weekDates])

  const handleMarkComplete = (taskId: string) => {
    for (const roadmap of roadmaps) {
      const entryIndex = roadmap.studyPlan.findIndex((e) => e.id === taskId)
      if (entryIndex >= 0) {
        roadmap.studyPlan[entryIndex].status = "completed"

        const topicId = roadmap.studyPlan[entryIndex].topicId
        const topicEntries = roadmap.studyPlan.filter(
          (e) => e.topicId === topicId && e.planType === "Study"
        )
        if (topicEntries.every((e) => e.status === "completed")) {
          const topicIndex = roadmap.topics.findIndex((t) => t.id === topicId)
          if (topicIndex >= 0) {
            roadmap.topics[topicIndex].isMastered = true
          }
        }

        saveRoadmap(roadmap)
        updateStreak()

        const stats = getStats()
        const totalCompleted = roadmaps.reduce(
          (acc, r) => acc + r.studyPlan.filter((e) => e.status === "completed").length,
          0
        )
        const totalHours = roadmaps.reduce(
          (acc, r) =>
            acc + r.studyPlan.filter((e) => e.status === "completed").reduce((h, e) => h + e.allocatedHours, 0),
          0
        )
        updateStats({
          ...stats,
          topicsCompleted: totalCompleted,
          totalStudyHours: Math.round(totalHours * 10) / 10,
        })
        break
      }
    }
    loadData()
  }

  const handleMarkMissed = (taskId: string) => {
    for (const roadmap of roadmaps) {
      const entryIndex = roadmap.studyPlan.findIndex((e) => e.id === taskId)
      if (entryIndex >= 0) {
        roadmap.studyPlan[entryIndex].status = "missed"
        saveRoadmap(roadmap)
        break
      }
    }
    loadData()
  }

  const weekLabel = `${weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`

  const completedToday = selectedTasks.filter((t) => t.entry.status === "completed").length
  const totalHoursToday = selectedTasks.reduce((h, t) => h + t.entry.allocatedHours, 0)
  const missedToday = selectedTasks.filter((t) => t.entry.status === "missed").length

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Study Schedule</h1>
        <p className="mt-1 text-muted-foreground">
          Your weekly view of all study and revision sessions.
        </p>
      </div>

      {/* Week navigator */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setWeekOffset((o) => o - 1)}>
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Previous week</span>
            </Button>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{weekLabel}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setWeekOffset((o) => o + 1)}>
              <ChevronRight className="h-5 w-5" />
              <span className="sr-only">Next week</span>
            </Button>
          </div>

          {/* Day selectors */}
          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((date) => {
              const dateStr = formatDate(date)
              const isToday = dateStr === today
              const isSelected = dateStr === selectedDate
              const counts = dayTaskCounts[dateStr] || { total: 0, completed: 0, hours: 0 }
              const allDone = counts.total > 0 && counts.completed === counts.total

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl p-3 transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : isToday
                        ? "bg-primary/10"
                        : "hover:bg-secondary"
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isSelected ? "text-primary-foreground" : "text-muted-foreground"
                    )}
                  >
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span
                    className={cn(
                      "text-lg font-bold",
                      isSelected ? "text-primary-foreground" : "text-foreground"
                    )}
                  >
                    {date.getDate()}
                  </span>
                  {counts.total > 0 && (
                    <div className="flex items-center gap-1">
                      {allDone ? (
                        <CheckCircle2
                          className={cn(
                            "h-3 w-3",
                            isSelected ? "text-primary-foreground" : "text-success"
                          )}
                        />
                      ) : (
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            isSelected ? "bg-primary-foreground" : "bg-primary"
                          )}
                        />
                      )}
                      <span
                        className={cn(
                          "text-[10px]",
                          isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}
                      >
                        {counts.total}
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tasks</p>
              <p className="text-xl font-bold text-foreground">
                {completedToday}/{selectedTasks.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Study Hours</p>
              <p className="text-xl font-bold text-foreground">
                {Math.round(totalHoursToday * 10) / 10}h
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Missed</p>
              <p className="text-xl font-bold text-foreground">{missedToday}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task list for selected day */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          {selectedDate === today
            ? "Today's Sessions"
            : new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
        </h2>

        {selectedTasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <CalendarDays className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium text-foreground">No sessions scheduled</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  This day has no study or revision sessions.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {selectedTasks.map(({ entry, roadmapName }) => (
              <div key={entry.id} className="flex flex-col gap-1">
                <span className="px-1 text-xs text-muted-foreground">{roadmapName}</span>
                <DailyTaskCard
                  entry={entry}
                  onMarkComplete={handleMarkComplete}
                  onMarkMissed={handleMarkMissed}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
