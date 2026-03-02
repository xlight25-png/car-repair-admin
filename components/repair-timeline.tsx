"use client"

import {
  CheckCircle2,
  ClipboardCheck,
  Cog,
  Search,
  Package,
  Wrench,
  CircleCheckBig,
} from "lucide-react"
import { cn } from "@/lib/utils"

const steps = [
  {
    label: "Received",
    icon: ClipboardCheck,
    status: "completed" as const,
    date: "Feb 3, 10:30",
  },
  {
    label: "Disassembly",
    icon: Cog,
    status: "completed" as const,
    date: "Feb 3, 14:00",
  },
  {
    label: "Defect Detection",
    icon: Search,
    status: "completed" as const,
    date: "Feb 4, 11:15",
  },
  {
    label: "Parts Ordered",
    icon: Package,
    status: "active" as const,
    date: "Feb 5, 09:00",
  },
  {
    label: "Repair",
    icon: Wrench,
    status: "upcoming" as const,
    date: null,
  },
  {
    label: "Ready",
    icon: CircleCheckBig,
    status: "upcoming" as const,
    date: null,
  },
]

export function RepairTimeline() {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Repair Progress
      </h2>
      <div className="relative">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isLast = index === steps.length - 1

          return (
            <div key={step.label} className="relative flex gap-4">
              {/* Vertical line */}
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-[17px] top-[36px] h-[calc(100%-20px)] w-[2px]",
                    step.status === "completed"
                      ? "bg-primary"
                      : step.status === "active"
                        ? "bg-gradient-to-b from-primary to-border"
                        : "bg-border"
                  )}
                />
              )}

              {/* Dot / Icon */}
              <div className="relative z-10 flex-shrink-0">
                {step.status === "completed" ? (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                ) : step.status === "active" ? (
                  <div className="flex h-9 w-9 animate-pulse-ring items-center justify-center rounded-full bg-primary">
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-secondary">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className={cn("flex-1 pb-6", isLast && "pb-0")}>
                <div className="flex items-center justify-between pt-1.5">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      step.status === "completed"
                        ? "text-foreground"
                        : step.status === "active"
                          ? "text-primary font-semibold"
                          : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                  {step.date && (
                    <span className="text-xs text-muted-foreground">
                      {step.date}
                    </span>
                  )}
                </div>
                {step.status === "active" && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Waiting for parts delivery from supplier
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
