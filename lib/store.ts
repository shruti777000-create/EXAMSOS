import type { User, Roadmap, UserStats } from "./types"

const KEYS = {
  USER: "exam-sos-user",
  ROADMAPS: "exam-sos-roadmaps",
  STATS: "exam-sos-stats",
} as const

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : fallback
  } catch {
    return fallback
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(value))
}

// User
export function getUser(): User | null {
  return getItem<User | null>(KEYS.USER, null)
}

export function setUser(user: User): void {
  setItem(KEYS.USER, user)
}

export function removeUser(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(KEYS.USER)
}

// Roadmaps
export function getRoadmaps(): Roadmap[] {
  return getItem<Roadmap[]>(KEYS.ROADMAPS, [])
}

export function getRoadmap(id: string): Roadmap | undefined {
  return getRoadmaps().find((r) => r.id === id)
}

export function saveRoadmap(roadmap: Roadmap): void {
  const roadmaps = getRoadmaps()
  const index = roadmaps.findIndex((r) => r.id === roadmap.id)
  if (index >= 0) {
    roadmaps[index] = roadmap
  } else {
    roadmaps.push(roadmap)
  }
  setItem(KEYS.ROADMAPS, roadmaps)
}

export function deleteRoadmap(id: string): void {
  const roadmaps = getRoadmaps().filter((r) => r.id !== id)
  setItem(KEYS.ROADMAPS, roadmaps)
}

// Stats
export function getStats(): UserStats {
  return getItem<UserStats>(KEYS.STATS, {
    currentStreak: 0,
    longestStreak: 0,
    totalStudyHours: 0,
    topicsCompleted: 0,
    totalTopics: 0,
    lastStudyDate: null,
  })
}

export function updateStats(updates: Partial<UserStats>): void {
  const stats = getStats()
  setItem(KEYS.STATS, { ...stats, ...updates })
}

export function updateStreak(): void {
  const stats = getStats()
  const today = new Date().toISOString().split("T")[0]

  if (stats.lastStudyDate === today) return

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split("T")[0]

  if (stats.lastStudyDate === yesterdayStr) {
    stats.currentStreak += 1
  } else {
    stats.currentStreak = 1
  }

  if (stats.currentStreak > stats.longestStreak) {
    stats.longestStreak = stats.currentStreak
  }

  stats.lastStudyDate = today
  setItem(KEYS.STATS, stats)
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
