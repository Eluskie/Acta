import { Card, CardContent } from "@/components/ui/card";
import { FileText, Calendar, Clock, FileSignature } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import StatusBadge, { type ActaStatus } from "./StatusBadge";
import { cn } from "@/lib/utils";

export interface MeetingCardData {
  id: string;
  buildingName: string;
  date: string;
  duration?: number; // duration in seconds
  attendeesCount: number;
  status: ActaStatus;
  signatureStatus?: string | null;
  signatureRemindersSent?: string[];
}

interface MeetingCardProps {
  meeting: MeetingCardData;
  onClick?: () => void;
}

export default function MeetingCard({ meeting, onClick }: MeetingCardProps) {
  // Format duration mm:ss or hh:mm:ss
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card
      className="group hover:shadow-sm transition-all duration-200 cursor-pointer border-border/40 bg-card/50 hover:bg-card hover:border-border/80"
      onClick={onClick}
      data-testid={`card-meeting-${meeting.id}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-md bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:bg-muted transition-colors">
            <FileText className="w-4 h-4" />
          </div>
          <div className="flex flex-col gap-1.5 items-end">
            <StatusBadge status={meeting.status} className="scale-90 origin-right" />
            {meeting.signatureStatus === "pending" && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-medium px-2.5 py-0.5 rounded-full border scale-90 origin-right",
                  "bg-purple-100 text-purple-700 border-purple-200"
                )}
              >
                <FileSignature className="w-3 h-3 mr-1 inline" />
                Pendiente firma
              </Badge>
            )}
            {meeting.signatureStatus === "signed" && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-medium px-2.5 py-0.5 rounded-full border scale-90 origin-right",
                  "bg-emerald-100 text-emerald-700 border-emerald-200"
                )}
              >
                <FileSignature className="w-3 h-3 mr-1 inline" />
                Firmada
              </Badge>
            )}
          </div>
        </div>

        <h3 className="font-medium text-base mb-4 line-clamp-2 min-h-[3rem] text-foreground/90 group-hover:text-foreground transition-colors">
          {meeting.buildingName}
        </h3>

        <div className="flex items-center gap-4 text-xs text-muted-foreground/80 group-hover:text-muted-foreground transition-colors">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{meeting.date}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatDuration(meeting.duration)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
