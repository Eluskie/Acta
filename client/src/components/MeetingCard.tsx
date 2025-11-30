import { Card, CardContent } from "@/components/ui/card";
import { Building2, Calendar, Users } from "lucide-react";
import StatusBadge, { type ActaStatus } from "./StatusBadge";

export interface Meeting {
  id: string;
  buildingName: string;
  date: string;
  attendeesCount: number;
  status: ActaStatus;
}

interface MeetingCardProps {
  meeting: Meeting;
  onClick?: () => void;
}

export default function MeetingCard({ meeting, onClick }: MeetingCardProps) {
  return (
    <Card
      className="hover-elevate active-elevate-2 cursor-pointer transition-all duration-200"
      onClick={onClick}
      data-testid={`card-meeting-${meeting.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-base leading-tight">
              {meeting.buildingName}
            </h3>
          </div>
          <StatusBadge status={meeting.status} />
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{meeting.date}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>{meeting.attendeesCount} asistentes</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
