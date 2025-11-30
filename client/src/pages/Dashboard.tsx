import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Plus, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import MeetingCard from "@/components/MeetingCard";
import EmptyState from "@/components/EmptyState";
import NewMeetingDialog from "@/components/NewMeetingDialog";
import type { Meeting } from "@shared/schema";
import type { ActaStatus } from "@/components/StatusBadge";

interface DashboardProps {
  onStartRecording?: (data: { buildingName: string; attendeesCount: number }) => void;
  onMeetingClick?: (meetingId: string) => void;
}

export default function Dashboard({ onStartRecording, onMeetingClick }: DashboardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
  });

  const formattedMeetings = meetings.map(meeting => ({
    id: meeting.id,
    buildingName: meeting.buildingName,
    date: new Date(meeting.date).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    attendeesCount: meeting.attendeesCount,
    status: meeting.status as ActaStatus,
  }));

  const filteredMeetings = formattedMeetings.filter((m) =>
    m.buildingName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isEmpty = meetings.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={setSearchQuery} />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col items-center mb-12">
          <Button
            size="lg"
            onClick={() => setDialogOpen(true)}
            className="h-14 px-10 text-base font-semibold bg-accent hover:bg-accent/90 text-accent-foreground gap-2 shadow-md"
            data-testid="button-new-acta"
          >
            <Mic className="w-5 h-5" />
            Nueva Acta
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : isEmpty ? (
          <EmptyState onStartRecording={() => setDialogOpen(true)} />
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
              <h2 className="text-xl font-semibold">Actas recientes</h2>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => setDialogOpen(true)}
                data-testid="button-add-meeting"
              >
                <Plus className="w-4 h-4" />
                Añadir
              </Button>
            </div>

            {filteredMeetings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No se encontraron actas que coincidan con "{searchQuery}"
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onClick={() => onMeetingClick?.(meeting.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <NewMeetingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onStartRecording={onStartRecording}
      />
    </div>
  );
}
