import { BookOpen } from "lucide-react"

export function LandingFooter() {
  return (
    <footer className="border-t border-border px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <BookOpen className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground">Exam SOS</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Built to help students study smarter, not harder.
        </p>
      </div>
    </footer>
  )
}
