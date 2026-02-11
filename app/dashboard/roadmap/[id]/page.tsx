"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getRoadmap, saveRoadmap, updateStreak, getStats, updateStats } from "@/lib/store"
import type { Roadmap, SyllabusModule, SyllabusTopic } from "@/lib/types"
import { ProgressRing } from "@/components/dashboard/progress-ring"
import { DailyTaskCard } from "@/components/dashboard/daily-task-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Target,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from "lucide-react"

function getDifficultyLabel(score: number) {
  if (score <= 1) return "Easy"
  if (score <= 2) return "Moderate"
  if (score <= 3) return "Medium"
  if (score <= 4) return "Hard"
  return "Very Hard"
}

function getDifficultyColor(score: number) {
  if (score <= 2) return "bg-success/10 text-success"
  if (score <= 3) return "bg-accent/10 text-accent"
  return "bg-destructive/10 text-destructive"
}

export default function RoadmapDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)

  const loadRoadmap = useCallback(() => {
    const id = params.id as string
    const r = getRoadmap(id)
    if (!r) {
      router.push("/dashboard")
      return
    }
    setRoadmap(r)
  }, [params.id, router])

  useEffect(() => {
    loadRoadmap()
  }, [loadRoadmap])

  const handleMarkComplete = (taskId: string) => {
    if (!roadmap) return
    const entryIndex = roadmap.studyPlan.findIndex((e) => e.id === taskId)
    if (entryIndex >= 0) {
      roadmap.studyPlan[entryIndex].status = "completed"

      // Check if all study entries for a topic are completed, mark topic as mastered
      const topicId = roadmap.studyPlan[entryIndex].topicId
      const topicEntries = roadmap.studyPlan.filter(
        (e) => e.topicId === topicId && e.planType === "Study"
      )
      const allCompleted = topicEntries.every((e) => e.status === "completed")
      if (allCompleted) {
        const topicIndex = roadmap.topics.findIndex((t) => t.id === topicId)
        if (topicIndex >= 0) {
          roadmap.topics[topicIndex].isMastered = true
        }
      }

      saveRoadmap(roadmap)
      updateStreak()

      const stats = getStats()
      const completedCount = roadmap.studyPlan.filter((e) => e.status === "completed").length
      const totalHours = roadmap.studyPlan
        .filter((e) => e.status === "completed")
        .reduce((h, e) => h + e.allocatedHours, 0)
      updateStats({
        ...stats,
        topicsCompleted: completedCount,
        totalStudyHours: Math.round(totalHours * 10) / 10,
      })
    }
    loadRoadmap()
  }

  const handleMarkMissed = (taskId: string) => {
    if (!roadmap) return
    const entryIndex = roadmap.studyPlan.findIndex((e) => e.id === taskId)
    if (entryIndex >= 0) {
      roadmap.studyPlan[entryIndex].status = "missed"
      saveRoadmap(roadmap)
    }
    loadRoadmap()
  }

  if (!roadmap) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const totalEntries = roadmap.studyPlan.length
  const completedEntries = roadmap.studyPlan.filter((e) => e.status === "completed").length
  const missedEntries = roadmap.studyPlan.filter((e) => e.status === "missed").length
  const overallProgress = totalEntries > 0 ? (completedEntries / totalEntries) * 100 : 0
  const masteredTopics = roadmap.topics.filter((t) => t.isMastered).length
  const totalTopics = roadmap.topics.length
  const totalStudyHours = roadmap.studyPlan
    .filter((e) => e.status === "completed")
    .reduce((h, e) => h + e.allocatedHours, 0)
  const daysUntilExam = Math.max(
    0,
    Math.ceil(
      (new Date(roadmap.syllabus.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  )

  const today = new Date().toISOString().split("T")[0]
  const todayTasks = roadmap.studyPlan.filter((e) => e.studyDate === today)
  const upcomingTasks = roadmap.studyPlan
    .filter((e) => e.studyDate > today && e.status === "pending")
    .slice(0, 10)

  // Group by module for module view
  const moduleData = roadmap.modules.map((mod) => {
    const modTopics = roadmap.topics.filter((t) => t.moduleId === mod.id)
    const modEntries = roadmap.studyPlan.filter((e) =>
      modTopics.some((t) => t.id === e.topicId)
    )
    const modCompleted = modEntries.filter((e) => e.status === "completed").length
    const modTotal = modEntries.length
    const modProgress = modTotal > 0 ? (modCompleted / modTotal) * 100 : 0
    return { module: mod, topics: modTopics, progress: modProgress, completed: modCompleted, total: modTotal }
  })

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="w-fit gap-2" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{roadmap.syllabus.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                Exam: {new Date(roadmap.syllabus.examDate).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {roadmap.syllabus.dailyHours}h/day
              </span>
              <span className="flex items-center gap-1">
                <Layers className="h-4 w-4" />
                {roadmap.modules.length} modules, {totalTopics} topics
              </span>
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              daysUntilExam <= 3
                ? "border-destructive/50 bg-destructive/10 text-destructive"
                : daysUntilExam <= 7
                  ? "border-accent/50 bg-accent/10 text-accent-foreground"
                  : "border-primary/50 bg-primary/10 text-primary"
            }
          >
            {daysUntilExam} days until exam
          </Badge>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-6">
            <ProgressRing progress={overallProgress} size={80} strokeWidth={8} />
            <p className="text-sm font-medium text-muted-foreground">Plan Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <Target className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Topics Mastered</p>
              <p className="text-2xl font-bold text-foreground">
                {masteredTopics}/{totalTopics}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hours Studied</p>
              <p className="text-2xl font-bold text-foreground">
                {Math.round(totalStudyHours * 10) / 10}h
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Missed Sessions</p>
              <p className="text-2xl font-bold text-foreground">{missedEntries}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Today / Modules / Upcoming */}
      <Tabs defaultValue="today" className="w-full">
        <TabsList>
          <TabsTrigger value="today">
            {"Today's Tasks"} ({todayTasks.length})
          </TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-6">
          {todayTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12">
                <CheckCircle2 className="h-12 w-12 text-success" />
                <div className="text-center">
                  <p className="font-medium text-foreground">No tasks for today</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Check the upcoming tab to see what{"'"}s next.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {todayTasks.map((entry) => (
                <DailyTaskCard
                  key={entry.id}
                  entry={entry}
                  onMarkComplete={handleMarkComplete}
                  onMarkMissed={handleMarkMissed}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="modules" className="mt-6">
          <div className="flex flex-col gap-4">
            {moduleData.map(({ module: mod, topics: modTopics, progress, completed, total }) => (
              <Card key={mod.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base">{mod.moduleName}</CardTitle>
                      <Badge variant="secondary" className={getDifficultyColor(mod.aiDifficultyScore)}>
                        {getDifficultyLabel(mod.aiDifficultyScore)}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {mod.estimatedWeightage}% weightage
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={progress} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground">
                      {completed}/{total}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col gap-2">
                    {modTopics.map((topic) => (
                      <div
                        key={topic.id}
                        className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          {topic.isMastered ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span
                            className={`text-sm ${topic.isMastered ? "text-muted-foreground line-through" : "text-foreground"}`}
                          >
                            {topic.topicName}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {topic.requiredStudyTimeHrs}h
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12">
                <CheckCircle2 className="h-12 w-12 text-success" />
                <div className="text-center">
                  <p className="font-medium text-foreground">All caught up</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    No upcoming tasks remaining.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingTasks.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <CalendarDays className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {entry.topicName || "Study Session"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.moduleName} &middot;{" "}
                        {new Date(entry.studyDate).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {entry.planType === "Study"
                        ? "Study"
                        : entry.planType === "Revision_Short"
                          ? "Quick Rev"
                          : entry.planType === "Revision_Weekly"
                            ? "Weekly Rev"
                            : "Final Rev"}
                    </Badge>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {entry.allocatedHours}h
                    </span>
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
