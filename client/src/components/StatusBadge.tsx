import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ActaStatus = "grabando" | "procesando" | "borrador" | "enviado";

interface StatusBadgeProps {
  status: ActaStatus;
  className?: string;
}

const statusConfig: Record<ActaStatus, { label: string; className: string }> = {
  grabando: {
    label: "Grabando",
    className: "bg-recording/10 text-recording border-recording/20 animate-recording-pulse",
  },
  procesando: {
    label: "Procesando",
    className: "bg-warning/10 text-warning-foreground border-warning/20",
  },
  borrador: {
    label: "Borrador",
    className: "bg-muted text-muted-foreground border-muted-foreground/20",
  },
  enviado: {
    label: "Enviado",
    className: "bg-success/10 text-success border-success/20",
  },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

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
