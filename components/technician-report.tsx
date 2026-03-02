import Image from "next/image"
import { Sparkles, FileText } from "lucide-react"

export function TechnicianReport() {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Technician Report
        </h2>
      </div>

      {/* Image placeholder */}
      <div className="relative mb-4 overflow-hidden rounded-lg">
        <Image
          src="/images/technician-report.jpg"
          alt="Technician inspecting the vehicle underside"
          width={800}
          height={450}
          className="h-48 w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-card/80 px-2 py-1 backdrop-blur-sm">
          <span className="text-xs font-medium text-foreground">
            3 photos attached
          </span>
        </div>
      </div>

      {/* AI Summary */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-primary">
            AI Summary
          </span>
        </div>
        <p className="text-sm leading-relaxed text-secondary-foreground">
          Inspection revealed worn front brake pads (2mm remaining) and a
          damaged CV boot on the left axle. The serpentine belt shows cracking
          and should be replaced preventatively. Oil leak traced to the valve
          cover gasket. OEM replacement parts have been ordered from the
          authorized supplier; expected delivery in 2 business days.
        </p>
      </div>
    </div>
  )
}
