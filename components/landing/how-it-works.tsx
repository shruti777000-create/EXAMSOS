import { Upload, Cpu, BookCheck, Trophy } from "lucide-react"

const steps = [
  {
    step: "01",
    icon: Upload,
    title: "Input Your Syllabus",
    description:
      "Paste your syllabus text or upload a PDF. Set your exam date and daily available study hours.",
  },
  {
    step: "02",
    icon: Cpu,
    title: "AI Generates Your Plan",
    description:
      "Our AI analyzes topics, estimates difficulty, and creates an optimized day-by-day study roadmap.",
  },
  {
    step: "03",
    icon: BookCheck,
    title: "Study & Track Progress",
    description:
      "Follow your daily schedule, complete confidence checkpoints, and watch your mastery grow.",
  },
  {
    step: "04",
    icon: Trophy,
    title: "Ace Your Exams",
    description:
      "With smart revision and adaptive scheduling, walk into your exam fully prepared and confident.",
  },
]

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-balance text-foreground md:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Four simple steps from syllabus chaos to exam confidence.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((item, index) => (
            <div key={item.step} className="relative flex flex-col items-center text-center">
              {/* Connector line for larger screens */}
              {index < steps.length - 1 && (
                <div className="absolute left-[calc(50%+40px)] top-10 hidden h-px w-[calc(100%-80px)] bg-border lg:block" />
              )}
              <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-card">
                <item.icon className="h-8 w-8 text-primary" />
                <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {item.step}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
