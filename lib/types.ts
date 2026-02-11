export interface User {
  id: string
  username: string
  email: string
  createdAt: string
}

export interface Syllabus {
  id: string
  userId: string
  name: string
  examDate: string
  dailyHours: number
  inputMethod: "text_input" | "pdf_upload"
  status: "active" | "archived"
  createdAt: string
}

export interface SyllabusModule {
  id: string
  syllabusId: string
  moduleName: string
  estimatedWeightage: number
  userDifficultyScore: number
  aiDifficultyScore: number
  priorityRank: number
}

export interface SyllabusTopic {
  id: string
  moduleId: string
  topicName: string
  requiredStudyTimeHrs: number
  isMastered: boolean
}

export type PlanType = "Study" | "Revision_Short" | "Revision_Weekly" | "Revision_Final"
export type PlanStatus = "pending" | "completed" | "missed"

export interface StudyPlanEntry {
  id: string
  topicId: string
  studyDate: string
  allocatedHours: number
  planType: PlanType
  status: PlanStatus
  generatedAt: string
  moduleName?: string
  topicName?: string
}

export interface ProgressEntry {
  id: string
  planEntryId: string
  dateCompleted: string
  durationSpentHrs: number
  confidenceScore: number
  quizPerformance: Record<string, boolean>
}

export interface Roadmap {
  id: string
  syllabusId: string
  syllabus: Syllabus
  modules: SyllabusModule[]
  topics: SyllabusTopic[]
  studyPlan: StudyPlanEntry[]
  progress: ProgressEntry[]
  createdAt: string
}

export interface UserStats {
  currentStreak: number
  longestStreak: number
  totalStudyHours: number
  topicsCompleted: number
  totalTopics: number
  lastStudyDate: string | null
}
