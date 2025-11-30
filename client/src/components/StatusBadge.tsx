import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ActaStatus = "recording" | "processing" | "review" | "sent";

interface StatusBadgeProps {
  status: ActaStatus;
  className?: string;
}

const statusConfig: Record<ActaStatus, { label: string; className: string }> = {
  recording: {
    label: "Grabando",
    className: "bg-recording/10 text-recording border-recording/20 animate-recording-pulse",
  },
  processing: {
    label: "Procesando",
    className: "bg-warning/10 text-warning-foreground border-warning/20",
  },
  review: {
    label: "Borrador",
    className: "bg-muted text-muted-foreground border-muted-foreground/20",
  },
  sent: {
    label: "Enviado",
    className: "bg-success/10 text-success border-success/20",
  },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.review;

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium px-2.5 py-0.5 rounded-full border",
        config.className,
        className
      )}
      data-testid={`badge-status-${status}`}
    >
      {config.label}
    </Badge>
  );
}
