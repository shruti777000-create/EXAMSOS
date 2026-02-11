"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { getRoadmaps, saveRoadmap, getStats, updateStats, updateStreak } from "@/lib/store"
import type { Roadmap, StudyPlanEntry, UserStats } from "@/lib/types"
import { ProgressRing } from "@/components/dashboard/progress-ring"
import { StreakCounter } from "@/components/dashboard/streak-counter"
import { DailyTaskCard } from "@/components/dashboard/daily-task-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, BookOpen, Clock, Target, Trophy } from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuth()
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [todayTasks, setTodayTasks] = useState<{ roadmapId: string; entry: StudyPlanEntry }[]>([])

  const loadData = useCallback(() => {
    const allRoadmaps = getRoadmaps()
    setRoadmaps(allRoadmaps)
    setStats(getStats())

    const today = new Date().toISOString().split("T")[0]
    const tasks: { roadmapId: string; entry: StudyPlanEntry }[] = []
    for (const roadmap of allRoadmaps) {
      for (const entry of roadmap.studyPlan) {
        if (entry.studyDate === today) {
          tasks.push({ roadmapId: roadmap.id, entry })
        }
      }
    }
    setTodayTasks(tasks)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleMarkComplete = (taskId: string) => {
    for (const roadmap of roadmaps) {
      const entryIndex = roadmap.studyPlan.findIndex((e) => e.id === taskId)
      if (entryIndex >= 0) {
        roadmap.studyPlan[entryIndex].status = "completed"
        saveRoadmap(roadmap)
        updateStreak()

        // Update stats
        const currentStats = getStats()
        const completedTopics = roadmaps.reduce(
          (acc, r) => acc + r.studyPlan.filter((e) => e.status === "completed").length,
          0
        )
        const totalHours = roadmaps.reduce(
          (acc, r) =>
            acc + r.studyPlan.filter((e) => e.status === "completed").reduce((h, e) => h + e.allocatedHours, 0),
          0
        )
        updateStats({
          ...currentStats,
          topicsCompleted: completedTopics,
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

  const totalTopics = roadmaps.reduce((acc, r) => acc + r.topics.length, 0)
  const masteredTopics = roadmaps.reduce(
    (acc, r) => acc + r.topics.filter((t) => t.isMastered).length,
    0
  )
  const overallProgress = totalTopics > 0 ? (masteredTopics / totalTopics) * 100 : 0

  const completedToday = todayTasks.filter((t) => t.entry.status === "completed").length
  const totalToday = todayTasks.length

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.username?.split(" ")[0] || "Student"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {todayTasks.length > 0
              ? `You have ${totalToday - completedToday} tasks remaining today.`
              : "No tasks scheduled for today. Create a new roadmap to get started!"}
          </p>
        </div>
        <StreakCounter streak={stats?.currentStreak || 0} />
      </div>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Plans</p>
              <p className="text-2xl font-bold text-foreground">
                {roadmaps.filter((r) => r.syllabus.status === "active").length}
              </p>
            </div>
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
              <p className="text-sm text-muted-foreground">Study Hours</p>
              <p className="text-2xl font-bold text-foreground">{stats?.totalStudyHours || 0}h</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Trophy className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Best Streak</p>
              <p className="text-2xl font-bold text-foreground">{stats?.longestStreak || 0} days</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Today's Schedule - takes 2 cols */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">{"Today's Schedule"}</h2>
            <Link href="/dashboard/schedule">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>

          {todayTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <PlusCircle className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">No study plan yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create a new roadmap to get your personalized study schedule.
                  </p>
                </div>
                <Button asChild>
                  <Link href="/dashboard/new">Create Roadmap</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {todayTasks.map(({ entry }) => (
                <DailyTaskCard
                  key={entry.id}
                  entry={entry}
                  onMarkComplete={handleMarkComplete}
                  onMarkMissed={handleMarkMissed}
                />
              ))}
            </div>
          )}
        </div>

        {/* Progress sidebar */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-foreground">Overall Progress</h2>
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <ProgressRing
                progress={overallProgress}
                size={140}
                label="Complete"
              />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {masteredTopics} of {totalTopics} topics mastered
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Active Roadmaps */}
          {roadmaps.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Your Roadmaps</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {roadmaps.map((roadmap) => {
                  const completed = roadmap.studyPlan.filter(
                    (e) => e.status === "completed"
                  ).length
                  const total = roadmap.studyPlan.length
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
                  return (
                    <Link
                      key={roadmap.id}
                      href={`/dashboard/roadmap/${roadmap.id}`}
                      className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-secondary"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {roadmap.syllabus.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Exam: {new Date(roadmap.syllabus.examDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-primary">{pct}%</span>
                    </Link>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
