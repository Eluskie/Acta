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
    className: "bg-red-100 text-red-700 border-red-200 animate-pulse",
  },
  processing: {
    label: "Procesando",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  review: {
    label: "Completada",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  sent: {
    label: "Enviada",
    className: "bg-blue-100 text-blue-700 border-blue-200",
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
