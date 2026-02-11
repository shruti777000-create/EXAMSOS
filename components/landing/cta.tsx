import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function LandingCTA() {
  return (
    <section className="px-6 py-24 bg-card">
      <div className="mx-auto max-w-3xl text-center">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-8 py-16 md:px-16">
          <h2 className="text-3xl font-bold text-balance text-foreground md:text-4xl">
            Stop Stressing. Start Studying Smart.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join thousands of students who have conquered their syllabi with
            AI-powered study planning. It only takes a minute to get started.
          </p>
          <Button size="lg" className="mt-8 gap-2 px-10 text-base" asChild>
            <Link href="/auth/signup">
              Create Your Study Plan
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
