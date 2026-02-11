import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Clock, Target } from "lucide-react"

export function LandingHero() {
  return (
    <section className="relative overflow-hidden px-6 py-24 md:py-32">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/5" />
        <div className="absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full bg-success/5" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            AI-Powered Study Planning
          </div>

          <h1 className="max-w-3xl text-balance text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
            Finish Your Syllabus{" "}
            <span className="text-primary">Before Exams</span>
          </h1>

          <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
            Stop last-minute cramming. Exam SOS creates a personalized AI study
            roadmap that adapts to your pace, tracks your progress, and ensures
            complete syllabus coverage.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Button size="lg" className="gap-2 px-8 text-base" asChild>
              <Link href="/auth/signup">
                Start Planning Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="gap-2 px-8 text-base bg-transparent" asChild>
              <a href="#how-it-works">See How It Works</a>
            </Button>
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid w-full max-w-2xl grid-cols-3 gap-6 rounded-2xl border border-border bg-card p-6 md:p-8">
            <div className="flex flex-col items-center gap-1">
              <Clock className="mb-1 h-5 w-5 text-primary" />
              <span className="text-2xl font-bold text-foreground md:text-3xl">Smart</span>
              <span className="text-xs text-muted-foreground md:text-sm">Scheduling</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Target className="mb-1 h-5 w-5 text-success" />
              <span className="text-2xl font-bold text-foreground md:text-3xl">Adaptive</span>
              <span className="text-xs text-muted-foreground md:text-sm">Learning</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Sparkles className="mb-1 h-5 w-5 text-accent" />
              <span className="text-2xl font-bold text-foreground md:text-3xl">Spaced</span>
              <span className="text-xs text-muted-foreground md:text-sm">Revision</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
