import type {
  Roadmap,
  Syllabus,
  SyllabusModule,
  SyllabusTopic,
  StudyPlanEntry,
  PlanType,
} from "./types"
import { generateId } from "./store"

interface AIModule {
  moduleName: string
  estimatedWeightage: number
  aiDifficultyScore: number
  topics: {
    topicName: string
    requiredStudyTimeHrs: number
  }[]
}

/**
 * Takes AI-generated module/topic data and builds a complete Roadmap
 * with a day-by-day study plan including revision sessions.
 */
export function buildRoadmap(
  userId: string,
  syllabusData: {
    name: string
    examDate: string
    dailyHours: number
    inputMethod: "text_input" | "pdf_upload"
  },
  aiModules: AIModule[]
): Roadmap {
  const syllabusId = generateId()
  const roadmapId = generateId()

  const syllabus: Syllabus = {
    id: syllabusId,
    userId,
    name: syllabusData.name,
    examDate: syllabusData.examDate,
    dailyHours: syllabusData.dailyHours,
    inputMethod: syllabusData.inputMethod,
    status: "active",
    createdAt: new Date().toISOString(),
  }

  const modules: SyllabusModule[] = []
  const topics: SyllabusTopic[] = []

  for (let i = 0; i < aiModules.length; i++) {
    const aiMod = aiModules[i]
    const moduleId = generateId()
    modules.push({
      id: moduleId,
      syllabusId,
      moduleName: aiMod.moduleName,
      estimatedWeightage: aiMod.estimatedWeightage,
      userDifficultyScore: aiMod.aiDifficultyScore,
      aiDifficultyScore: aiMod.aiDifficultyScore,
      priorityRank: i + 1,
    })

    for (const aiTopic of aiMod.topics) {
      topics.push({
        id: generateId(),
        moduleId,
        topicName: aiTopic.topicName,
        requiredStudyTimeHrs: aiTopic.requiredStudyTimeHrs,
        isMastered: false,
      })
    }
  }

  // Generate the day-by-day study plan
  const studyPlan = generateStudyPlan(
    modules,
    topics,
    syllabusData.examDate,
    syllabusData.dailyHours
  )

  return {
    id: roadmapId,
    syllabusId,
    syllabus,
    modules,
    topics,
    studyPlan,
    progress: [],
    createdAt: new Date().toISOString(),
  }
}

function generateStudyPlan(
  modules: SyllabusModule[],
  topics: SyllabusTopic[],
  examDate: string,
  dailyHours: number
): StudyPlanEntry[] {
  const entries: StudyPlanEntry[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exam = new Date(examDate)
  exam.setHours(0, 0, 0, 0)

  const daysAvailable = Math.max(
    1,
    Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  )

  // Reserve last day for final revision
  const studyDays = Math.max(1, daysAvailable - 1)

  // Sort topics by module priority and difficulty
  const topicQueue = topics
    .map((topic) => {
      const mod = modules.find((m) => m.id === topic.moduleId)
      return {
        ...topic,
        moduleName: mod?.moduleName || "General",
        priority: mod?.priorityRank || 999,
        difficulty: mod?.aiDifficultyScore || 3,
      }
    })
    .sort((a, b) => {
      // Higher difficulty first, then by priority
      if (b.difficulty !== a.difficulty) return b.difficulty - a.difficulty
      return a.priority - b.priority
    })

  // Distribute topics across days
  let currentDay = 0
  let hoursUsedToday = 0

  for (const topic of topicQueue) {
    let remainingHours = topic.requiredStudyTimeHrs

    while (remainingHours > 0 && currentDay < studyDays) {
      const availableToday = dailyHours - hoursUsedToday
      const allocate = Math.min(remainingHours, availableToday, dailyHours)

      if (allocate <= 0) {
        currentDay++
        hoursUsedToday = 0
        continue
      }

      const studyDate = new Date(today)
      studyDate.setDate(studyDate.getDate() + currentDay)

      entries.push({
        id: generateId(),
        topicId: topic.id,
        studyDate: studyDate.toISOString().split("T")[0],
        allocatedHours: Math.round(allocate * 10) / 10,
        planType: "Study",
        status: "pending",
        generatedAt: new Date().toISOString(),
        moduleName: topic.moduleName,
        topicName: topic.topicName,
      })

      hoursUsedToday += allocate
      remainingHours -= allocate

      if (hoursUsedToday >= dailyHours) {
        currentDay++
        hoursUsedToday = 0
      }
    }
  }

  // Add weekly revision sessions
  const completedTopicDates = new Map<string, string>()
  for (const entry of entries) {
    if (!completedTopicDates.has(entry.topicId)) {
      completedTopicDates.set(entry.topicId, entry.studyDate)
    }
  }

  // Schedule short-term revision (1 day after study)
  for (const [topicId, studyDate] of completedTopicDates) {
    const topic = topicQueue.find((t) => t.id === topicId)
    if (!topic) continue

    const revDate = new Date(studyDate)
    revDate.setDate(revDate.getDate() + 1)

    if (revDate < exam) {
      entries.push({
        id: generateId(),
        topicId,
        studyDate: revDate.toISOString().split("T")[0],
        allocatedHours: Math.min(0.5, topic.requiredStudyTimeHrs * 0.3),
        planType: "Revision_Short",
        status: "pending",
        generatedAt: new Date().toISOString(),
        moduleName: topic.moduleName,
        topicName: topic.topicName,
      })
    }
  }

  // Schedule weekly revision (7 days after study)
  for (const [topicId, studyDate] of completedTopicDates) {
    const topic = topicQueue.find((t) => t.id === topicId)
    if (!topic) continue

    const revDate = new Date(studyDate)
    revDate.setDate(revDate.getDate() + 7)

    if (revDate < exam) {
      entries.push({
        id: generateId(),
        topicId,
        studyDate: revDate.toISOString().split("T")[0],
        allocatedHours: Math.min(0.5, topic.requiredStudyTimeHrs * 0.25),
        planType: "Revision_Weekly",
        status: "pending",
        generatedAt: new Date().toISOString(),
        moduleName: topic.moduleName,
        topicName: topic.topicName,
      })
    }
  }

  // Schedule final revision (day before exam)
  const finalRevDate = new Date(exam)
  finalRevDate.setDate(finalRevDate.getDate() - 1)

  // Pick high-priority topics for final revision
  const highPriorityTopics = topicQueue.slice(0, Math.min(6, topicQueue.length))
  const finalHoursPerTopic = Math.min(
    1,
    dailyHours / highPriorityTopics.length
  )

  for (const topic of highPriorityTopics) {
    entries.push({
      id: generateId(),
      topicId: topic.id,
      studyDate: finalRevDate.toISOString().split("T")[0],
      allocatedHours: Math.round(finalHoursPerTopic * 10) / 10,
      planType: "Revision_Final",
      status: "pending",
      generatedAt: new Date().toISOString(),
      moduleName: topic.moduleName,
      topicName: topic.topicName,
    })
  }

  // Sort by date
  entries.sort((a, b) => a.studyDate.localeCompare(b.studyDate))

  return entries
}
