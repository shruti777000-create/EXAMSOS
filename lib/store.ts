import type { User, Roadmap, UserStats, Syllabus, SyllabusModule, SyllabusTopic, StudyPlanEntry } from "./types"
import { supabase } from "./supabase"

const KEYS = {
  USER: "exam-sos-user",
  ROADMAPS: "exam-sos-roadmaps",
  STATS: "exam-sos-stats",
} as const

// Helper to check if Supabase is configured
const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && url !== 'your_supabase_url_here' && key && key !== 'your_supabase_anon_key_here';
};

function getItem<T>(key: string, fallback: T, userId?: string): T {
  if (typeof window === "undefined") return fallback
  try {
    const finalKey = userId ? `${key}-${userId}` : key
    const item = localStorage.getItem(finalKey)
    return item ? JSON.parse(item) : fallback
  } catch {
    return fallback
  }
}

function setItem<T>(key: string, value: T, userId?: string): void {
  if (typeof window === "undefined") return
  const finalKey = userId ? `${key}-${userId}` : key
  localStorage.setItem(finalKey, JSON.stringify(value))
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
// Roadmaps
export async function getRoadmaps(): Promise<Roadmap[]> {
  const user = getUser();
  const localRoadmaps = getItem<Roadmap[]>(KEYS.ROADMAPS, [], user?.id);

  if (isSupabaseConfigured() && user && supabase) {
    try {
      const { data: syllabuses, error } = await supabase
        .from('syllabuses')
        .select('*')
        .eq('user_id', user.id)
        .selectAll()

      if (error) throw error;

      // Map Supabase data back to Roadmap type
      const supabaseRoadmaps = (syllabuses || []).map((s: any) => ({
        id: s.id,
        syllabusId: s.id,
        syllabus: {
          id: s.id,
          userId: s.user_id,
          name: s.name,
          examDate: s.exam_date,
          dailyHours: s.daily_hours,
          inputMethod: s.input_method as any,
          status: s.status as any,
          createdAt: s.created_at
        },
        modules: (s.modules || []).map((m: any) => ({
          ...m,
          syllabusId: s.id
        })),
        topics: (s.modules || []).flatMap((m: any) => (m.topics || []).map((t: any) => ({
          ...t,
          moduleId: m.id
        }))),
        studyPlan: s.study_plan || [],
        progress: [],
        createdAt: s.created_at
      }));

      // Merge: Union of local and remote. 
      // If a roadmap exists in both, prefer the one with more recent data or simply deduplicate.
      // For simplicity, we'll use a Map by ID.
      const roadmapMap = new Map<string, Roadmap>();

      // Add local first
      localRoadmaps.forEach(r => roadmapMap.set(r.id, r));

      // Overlay remote (assuming remote is source of truth, BUT if remote is missing a just-created one, local keeps it)
      supabaseRoadmaps.forEach((r: Roadmap) => {
        // Only overwrite if remote actually returning valid data structure
        roadmapMap.set(r.id, r);
      });

      // Special case: If we just created a roadmap locally but it hasn't synced to Supabase yet,
      // it might be in localRoadmaps but NOT in supabaseRoadmaps.
      // We want to KEEP the local one in that case.
      // The map set above would handle it: 
      // 1. set(local_id, local_obj)
      // 2. set(remote_id, remote_obj) -> if remote_id == local_id, it overwrites.
      // If remote doesn't have it, local stays.

      return Array.from(roadmapMap.values());

    } catch (e) {
      console.error("Supabase fetch failed, using local storage:", e);
    }
  }
  return localRoadmaps;
}

export async function getRoadmap(id: string): Promise<Roadmap | undefined> {
  const roadmaps = await getRoadmaps()
  // Search by both id and syllabusId to handle both cases
  return roadmaps.find((r) => r.id === id || r.syllabusId === id)
}

export async function saveRoadmap(roadmap: Roadmap): Promise<void> {
  const user = getUser();
  // Always save to local storage first (backup/cache)
  const roadmaps = getItem<Roadmap[]>(KEYS.ROADMAPS, [], user?.id)
  const index = roadmaps.findIndex((r) => r.id === roadmap.id)
  if (index >= 0) {
    roadmaps[index] = roadmap
  } else {
    roadmaps.push(roadmap)
  }
  setItem(KEYS.ROADMAPS, roadmaps, user?.id)

  // Save to Supabase if configured
  if (isSupabaseConfigured() && supabase) {
    try {
      // 1. Save Syllabus
      // IMPORTANT: Use roadmap.syllabusId as the key for the syllabuses table
      const { error: sError } = await supabase.from('syllabuses').upsert({
        id: roadmap.syllabusId,
        user_id: roadmap.syllabus.userId,
        name: roadmap.syllabus.name,
        exam_date: roadmap.syllabus.examDate,
        daily_hours: roadmap.syllabus.dailyHours,
        input_method: roadmap.syllabus.inputMethod,
        status: roadmap.syllabus.status,
        created_at: roadmap.syllabus.createdAt
      });
      if (sError) {
        console.error("Supabase syllabus save failed:", sError);
        // Don't throw - localStorage save already succeeded, Supabase is secondary
        // Log error but continue
      }

      // 2. Save Modules
      const { error: mError } = await supabase.from('syllabus_modules').upsert(
        roadmap.modules.map(m => ({
          id: m.id,
          syllabus_id: roadmap.syllabusId,
          module_name: m.moduleName,
          estimated_weightage: m.estimatedWeightage,
          user_difficulty_score: m.userDifficultyScore,
          ai_difficulty_score: m.aiDifficultyScore,
          priority_rank: m.priorityRank
        }))
      );
      if (mError) {
        console.error("Supabase modules save failed:", mError);
        // Don't throw - localStorage save already succeeded
      }

      // 3. Save Topics
      const { error: tError } = await supabase.from('syllabus_topics').upsert(
        roadmap.topics.map(t => ({
          id: t.id,
          module_id: t.moduleId,
          topic_name: t.topicName,
          required_study_time_hrs: t.requiredStudyTimeHrs,
          is_mastered: t.isMastered
        }))
      );
      if (tError) {
        console.error("Supabase topics save failed:", tError);
        // Don't throw - localStorage save already succeeded
      }

      // 4. Save Study Plan
      const { error: spError } = await supabase.from('study_plan_entries').upsert(
        roadmap.studyPlan.map(sp => ({
          id: sp.id,
          syllabus_id: roadmap.syllabusId,
          topic_id: sp.topicId,
          study_date: sp.studyDate,
          allocated_hours: sp.allocatedHours,
          plan_type: sp.planType,
          status: sp.status,
          generated_at: sp.generatedAt
        }))
      );
      if (spError) {
        console.error("Supabase study plan save failed:", spError);
        // Don't throw - localStorage save already succeeded
      }
    } catch (e) {
      console.error("Supabase save failed (non-critical, localStorage save succeeded):", e);
      // Don't rethrow - localStorage is the primary store and save already succeeded
    }
  }
}

export async function deleteRoadmap(id: string): Promise<void> {
  const roadmaps = getItem<Roadmap[]>(KEYS.ROADMAPS, []).filter((r) => r.id !== id)
  setItem(KEYS.ROADMAPS, roadmaps)

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('syllabuses').eq('id', id).delete();
    } catch (e) {
      console.error("Supabase delete failed:", e);
    }
  }
}

// Stats
export async function getStats(): Promise<UserStats> {
  const user = getUser();
  const fallback = getItem<UserStats>(KEYS.STATS, {
    currentStreak: 0,
    longestStreak: 0,
    totalStudyHours: 0,
    topicsCompleted: 0,
    totalTopics: 0,
    lastStudyDate: null,
  }, user?.id)

  if (isSupabaseConfigured() && user && supabase) {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is code for no rows found

      if (data) {
        return {
          currentStreak: data.current_streak,
          longestStreak: data.longest_streak,
          totalStudyHours: data.total_study_hours,
          topicsCompleted: data.topics_completed,
          totalTopics: data.total_topics,
          lastStudyDate: data.last_study_date,
        };
      }
    } catch (e) {
      console.error("Supabase stats fetch failed:", e);
    }
  }

  return fallback;
}

export async function updateStats(updates: Partial<UserStats>): Promise<void> {
  const user = getUser();
  const stats = await getStats()
  const newStats = { ...stats, ...updates }
  setItem(KEYS.STATS, newStats, user?.id)

  if (isSupabaseConfigured() && user && supabase) {
    try {
      await supabase.from('user_stats').upsert({
        user_id: user.id,
        current_streak: newStats.currentStreak,
        longest_streak: newStats.longestStreak,
        total_study_hours: newStats.totalStudyHours,
        topics_completed: newStats.topicsCompleted,
        total_topics: newStats.totalTopics,
        last_study_date: newStats.lastStudyDate,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.error("Supabase stats update failed:", e);
    }
  }
}


export async function updateStreak(): Promise<void> {
  const stats = await getStats()
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
  await updateStats(stats)
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

