"use client"

import { Clock, BookOpen, CheckCircle2, Circle, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { StudyPlanEntry, PlanStatus } from "@/lib/types"

interface DailyTaskCardProps {
  entry: StudyPlanEntry
  onMarkComplete: (id: string) => void
  onMarkMissed: (id: string) => void
}

const typeLabels: Record<string, string> = {
  Study: "Study",
  Revision_Short: "Quick Revision",
  Revision_Weekly: "Weekly Revision",
  Revision_Final: "Final Revision",
}

const typeColors: Record<string, string> = {
  Study: "bg-primary/10 text-primary",
  Revision_Short: "bg-success/10 text-success",
  Revision_Weekly: "bg-success/10 text-success",
  Revision_Final: "bg-destructive/10 text-destructive",
}

export function DailyTaskCard({ entry, onMarkComplete, onMarkMissed }: DailyTaskCardProps) {
  const isCompleted = entry.status === "completed"
  const isMissed = entry.status === "missed"

  return (
    <Card
      className={cn(
        "transition-all",
        isCompleted && "opacity-60",
        isMissed && "border-destructive/30"
      )}
    >
      <CardContent className="flex items-center gap-4 p-4">
        {/* Status icon */}
        <button
          onClick={() => !isCompleted && !isMissed && onMarkComplete(entry.id)}
          className="shrink-0"
          disabled={isCompleted || isMissed}
          aria-label={isCompleted ? "Task completed" : "Mark as complete"}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-6 w-6 text-success" />
          ) : isMissed ? (
            <AlertTriangle className="h-6 w-6 text-destructive" />
          ) : (
            <Circle className="h-6 w-6 text-muted-foreground hover:text-primary" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                typeColors[entry.planType] || "bg-secondary text-secondary-foreground"
              )}
            >
              {typeLabels[entry.planType] || entry.planType}
            </span>
          </div>
          <p
            className={cn(
              "mt-1 font-medium text-foreground",
              isCompleted && "line-through"
            )}
          >
            {entry.topicName || "Study Session"}
          </p>
          {entry.moduleName && (
            <p className="text-sm text-muted-foreground">{entry.moduleName}</p>
          )}
        </div>

        {/* Time */}
        <div className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{entry.allocatedHours}h</span>
        </div>

        {/* Missed button */}
        {!isCompleted && !isMissed && (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-xs text-muted-foreground"
            onClick={() => onMarkMissed(entry.id)}
          >
            Skip
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
