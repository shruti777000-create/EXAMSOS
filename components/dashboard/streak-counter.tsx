"use client"

import { Flame } from "lucide-react"
import { cn } from "@/lib/utils"

interface StreakCounterProps {
  streak: number
  className?: string
}

export function StreakCounter({ streak, className }: StreakCounterProps) {
  const isActive = streak > 0

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border px-4 py-2",
        isActive
          ? "border-accent/30 bg-accent/10"
          : "border-border bg-secondary",
        className
      )}
    >
      <Flame
        className={cn(
          "h-5 w-5",
          isActive ? "text-accent" : "text-muted-foreground"
        )}
      />
      <span
        className={cn(
          "text-lg font-bold",
          isActive ? "text-accent" : "text-muted-foreground"
        )}
      >
        {streak}
      </span>
      <span className="text-sm text-muted-foreground">
        {streak === 1 ? "day" : "days"}
      </span>
    </div>
  )
}
