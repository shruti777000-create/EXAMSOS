"use client"

import React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { getRoadmaps, saveRoadmap, updateStreak, getStats, updateStats } from "@/lib/store"
import type { Roadmap, StudyPlanEntry, PlanType } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  RefreshCcw,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  CalendarDays,
  Zap,
  Brain,
  GraduationCap,
} from "lucide-react"

const revisionTypeConfig: Record<
  string,
  { label: string; description: string; icon: React.ElementType; color: string }
> = {
  Revision_Short: {
    label: "Quick Revision",
    description: "1-day spaced recall to reinforce new learning",
    icon: Zap,
    color: "text-success",
  },
  Revision_Weekly: {
    label: "Weekly Revision",
    description: "7-day spaced repetition for long-term memory",
    icon: Brain,
    color: "text-primary",
  },
  Revision_Final: {
    label: "Final Revision",
    description: "Last-day comprehensive review before exam",
    icon: GraduationCap,
    color: "text-destructive",
  },
}

interface RevisionTask {
  roadmapId: string
  roadmapName: string
  entry: StudyPlanEntry
}

export default function RevisionPage() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([])

  const loadData = useCallback(() => {
    setRoadmaps(getRoadmaps())
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const today = new Date().toISOString().split("T")[0]

  // Get all revision entries grouped by type
  const revisionTasks = useMemo(() => {
    const tasks: RevisionTask[] = []
    for (const roadmap of roadmaps) {
      for (const entry of roadmap.studyPlan) {
        if (entry.planType !== "Study") {
          tasks.push({
            roadmapId: roadmap.id,
            roadmapName: roadmap.syllabus.name,
            entry,
          })
        }
      }
    }
    return tasks
  }, [roadmaps])

  const upcomingRevisions = useMemo(
    () =>
      revisionTasks
        .filter((t) => t.entry.studyDate >= today && t.entry.status === "pending")
        .sort((a, b) => a.entry.studyDate.localeCompare(b.entry.studyDate)),
    [revisionTasks, today]
  )

  const todayRevisions = useMemo(
    () => revisionTasks.filter((t) => t.entry.studyDate === today),
    [revisionTasks, today]
  )

  const completedRevisions = useMemo(
    () => revisionTasks.filter((t) => t.entry.status === "completed"),
    [revisionTasks]
  )

  const missedRevisions = useMemo(
    () =>
      revisionTasks.filter(
        (t) => t.entry.studyDate < today && t.entry.status === "pending"
      ),
    [revisionTasks, today]
  )

  // Stats
  const totalRevisions = revisionTasks.length
  const completedCount = completedRevisions.length
  const revisionProgress = totalRevisions > 0 ? (completedCount / totalRevisions) * 100 : 0

  const shortRevCount = revisionTasks.filter((t) => t.entry.planType === "Revision_Short").length
  const weeklyRevCount = revisionTasks.filter((t) => t.entry.planType === "Revision_Weekly").length
  const finalRevCount = revisionTasks.filter((t) => t.entry.planType === "Revision_Final").length

  const handleMarkComplete = (taskId: string) => {
    for (const roadmap of roadmaps) {
      const entryIndex = roadmap.studyPlan.findIndex((e) => e.id === taskId)
      if (entryIndex >= 0) {
        roadmap.studyPlan[entryIndex].status = "completed"
        saveRoadmap(roadmap)
        updateStreak()

        const stats = getStats()
        const totalCompleted = roadmaps.reduce(
          (acc, r) => acc + r.studyPlan.filter((e) => e.status === "completed").length,
          0
        )
        const totalHours = roadmaps.reduce(
          (acc, r) =>
            acc +
            r.studyPlan
              .filter((e) => e.status === "completed")
              .reduce((h, e) => h + e.allocatedHours, 0),
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

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Smart Revision</h1>
        <p className="mt-1 text-muted-foreground">
          Spaced repetition scheduling to help you retain what you learn.
        </p>
      </div>

      {/* Overview stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Revision Progress</p>
              <RefreshCcw className="h-4 w-4 text-primary" />
            </div>
            <Progress value={revisionProgress} className="mb-2 h-2" />
            <p className="text-xs text-muted-foreground">
              {completedCount}/{totalRevisions} sessions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <Zap className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Quick Revisions</p>
              <p className="text-xl font-bold text-foreground">{shortRevCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Weekly Revisions</p>
              <p className="text-xl font-bold text-foreground">{weeklyRevCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <GraduationCap className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Final Revisions</p>
              <p className="text-xl font-bold text-foreground">{finalRevCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spaced repetition explanation */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-4 p-6">
          <Brain className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
          <div>
            <p className="font-semibold text-foreground">How Smart Revision Works</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your revision schedule follows the spaced repetition principle: topics are revisited at
              increasing intervals (1 day, 7 days, then a final review before your exam). This
              pattern is proven to improve long-term memory retention by up to 200%.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="today" className="w-full">
        <TabsList>
          <TabsTrigger value="today">
            Today ({todayRevisions.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingRevisions.length})
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Overdue ({missedRevisions.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedRevisions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-6">
          {todayRevisions.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No revisions today"
              description="You don't have any revision sessions scheduled for today."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {todayRevisions.map(({ entry, roadmapName }) => (
                <RevisionCard
                  key={entry.id}
                  entry={entry}
                  roadmapName={roadmapName}
                  onComplete={handleMarkComplete}
                  onMiss={handleMarkMissed}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingRevisions.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No upcoming revisions"
              description="Create a roadmap to generate revision sessions."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingRevisions.slice(0, 20).map(({ entry, roadmapName }) => (
                <RevisionCard
                  key={entry.id}
                  entry={entry}
                  roadmapName={roadmapName}
                  onComplete={handleMarkComplete}
                  onMiss={handleMarkMissed}
                  showDate
                />
              ))}
              {upcomingRevisions.length > 20 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  + {upcomingRevisions.length - 20} more revision sessions
                </p>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="overdue" className="mt-6">
          {missedRevisions.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="All caught up"
              description="No overdue revision sessions. Great work!"
            />
          ) : (
            <div className="flex flex-col gap-3">
              {missedRevisions.map(({ entry, roadmapName }) => (
                <RevisionCard
                  key={entry.id}
                  entry={entry}
                  roadmapName={roadmapName}
                  onComplete={handleMarkComplete}
                  onMiss={handleMarkMissed}
                  showDate
                  isOverdue
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedRevisions.length === 0 ? (
            <EmptyState
              icon={RefreshCcw}
              title="No completed revisions"
              description="Complete revision sessions to track your progress."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {completedRevisions.slice(0, 20).map(({ entry, roadmapName }) => (
                <Card key={entry.id} className="opacity-60">
                  <CardContent className="flex items-center gap-4 p-4">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground line-through">
                        {entry.topicName || "Revision Session"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {roadmapName} &middot;{" "}
                        {new Date(entry.studyDate + "T12:00:00").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <RevisionTypeBadge type={entry.planType} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RevisionCard({
  entry,
  roadmapName,
  onComplete,
  onMiss,
  showDate,
  isOverdue,
}: {
  entry: StudyPlanEntry
  roadmapName: string
  onComplete: (id: string) => void
  onMiss: (id: string) => void
  showDate?: boolean
  isOverdue?: boolean
}) {
  const isCompleted = entry.status === "completed"
  const isMissed = entry.status === "missed"
  const config = revisionTypeConfig[entry.planType]
  const Icon = config?.icon || RefreshCcw

  return (
    <Card
      className={cn(
        "transition-all",
        isOverdue && "border-destructive/30",
        isCompleted && "opacity-60",
        isMissed && "border-destructive/20 opacity-60"
      )}
    >
      <CardContent className="flex items-center gap-4 p-4">
        {/* Status / action */}
        <button
          onClick={() => !isCompleted && !isMissed && onComplete(entry.id)}
          className="shrink-0"
          disabled={isCompleted || isMissed}
          aria-label={isCompleted ? "Completed" : "Mark complete"}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-6 w-6 text-success" />
          ) : isMissed ? (
            <AlertTriangle className="h-6 w-6 text-destructive" />
          ) : (
            <Circle className="h-6 w-6 text-muted-foreground hover:text-primary" />
          )}
        </button>

        {/* Icon */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            entry.planType === "Revision_Short" && "bg-success/10",
            entry.planType === "Revision_Weekly" && "bg-primary/10",
            entry.planType === "Revision_Final" && "bg-destructive/10"
          )}
        >
          <Icon className={cn("h-5 w-5", config?.color || "text-primary")} />
        </div>

        {/* Content */}
        <div className="flex-1">
          <p
            className={cn(
              "text-sm font-medium text-foreground",
              isCompleted && "line-through"
            )}
          >
            {entry.topicName || "Revision Session"}
          </p>
          <p className="text-xs text-muted-foreground">
            {roadmapName}
            {entry.moduleName ? ` / ${entry.moduleName}` : ""}
            {showDate &&
              ` - ${new Date(entry.studyDate + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}`}
          </p>
        </div>

        {/* Type badge */}
        <RevisionTypeBadge type={entry.planType} />

        {/* Time */}
        <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {entry.allocatedHours}h
        </span>

        {/* Skip */}
        {!isCompleted && !isMissed && (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-xs text-muted-foreground"
            onClick={() => onMiss(entry.id)}
          >
            Skip
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function RevisionTypeBadge({ type }: { type: PlanType }) {
  const config = revisionTypeConfig[type]
  if (!config) return null

  return (
    <Badge
      variant="secondary"
      className={cn(
        "text-xs",
        type === "Revision_Short" && "bg-success/10 text-success",
        type === "Revision_Weekly" && "bg-primary/10 text-primary",
        type === "Revision_Final" && "bg-destructive/10 text-destructive"
      )}
    >
      {config.label}
    </Badge>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12">
        <Icon className="h-12 w-12 text-muted-foreground" />
        <div className="text-center">
          <p className="font-medium text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
