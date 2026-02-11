import {
  Brain,
  CalendarDays,
  RefreshCcw,
  Bell,
  BarChart3,
  Flame,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: Brain,
    title: "AI-Generated Roadmap",
    description:
      "Upload your syllabus and let AI create a complete, day-by-day study schedule tailored to your exam date and available hours.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: CalendarDays,
    title: "Daily Study Schedule",
    description:
      "Get a clear plan for each day specifying subjects, topics, and time allocation. Never wonder what to study next.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: RefreshCcw,
    title: "Smart Revision",
    description:
      "Spaced repetition techniques ensure you retain what you learn with short-term, weekly, and final revision sessions.",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    icon: Bell,
    title: "Study Reminders",
    description:
      "Stay on track with timely reminders for upcoming study sessions, pending tasks, and revision schedules.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: BarChart3,
    title: "Adaptive Learning",
    description:
      "If you fall behind, the AI reshuffles your schedule, prioritizing high-weightage topics and adjusting difficulty levels.",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    icon: Flame,
    title: "Gamification",
    description:
      "Track your streaks, earn badges, and watch progress rings fill up as you master your syllabus topic by topic.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
]

export function LandingFeatures() {
  return (
    <section id="features" className="px-6 py-24 bg-card">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-balance text-foreground md:text-4xl">
            Everything You Need to Ace Your Exams
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Built by students, for students. Every feature designed to reduce
            stress and maximize results.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group border-border transition-all hover:border-primary/20 hover:shadow-md"
            >
              <CardContent className="p-6">
                <div className={`mb-4 inline-flex rounded-lg p-2.5 ${feature.bg}`}>
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
