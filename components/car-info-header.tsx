import { Car, Hash } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function CarInfoHeader() {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Car className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">BMW X5</h1>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Hash className="h-3.5 w-3.5" />
              <span className="font-mono tracking-wider">M777MM</span>
            </div>
          </div>
        </div>
        <Badge className="bg-primary/15 text-primary border-primary/20 hover:bg-primary/15">
          In Progress
        </Badge>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-md bg-secondary px-3 py-2">
          <p className="text-xs text-muted-foreground">Order</p>
          <p className="text-sm font-medium text-foreground">#2847</p>
        </div>
        <div className="rounded-md bg-secondary px-3 py-2">
          <p className="text-xs text-muted-foreground">Date In</p>
          <p className="text-sm font-medium text-foreground">Feb 3</p>
        </div>
        <div className="rounded-md bg-secondary px-3 py-2">
          <p className="text-xs text-muted-foreground">Est. Done</p>
          <p className="text-sm font-medium text-foreground">Feb 10</p>
        </div>
      </div>
    </div>
  )
}
