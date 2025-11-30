import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Plus } from "lucide-react";
import Header from "@/components/Header";
import MeetingCard, { type Meeting } from "@/components/MeetingCard";
import EmptyState from "@/components/EmptyState";
import NewMeetingDialog from "@/components/NewMeetingDialog";

interface DashboardProps {
  onStartRecording?: (data: { buildingName: string; attendeesCount: number }) => void;
  onMeetingClick?: (meetingId: string) => void;
}

// todo: remove mock data
const mockMeetings: Meeting[] = [
  {
    id: "1",
    buildingName: "Comunidad Edificio Alameda 42",
    date: "28 Nov 2025",
    attendeesCount: 12,
    status: "enviado",
  },
  {
    id: "2",
    buildingName: "Residencial Los Jardines",
    date: "25 Nov 2025",
    attendeesCount: 8,
    status: "borrador",
  },
  {
    id: "3",
    buildingName: "Torres del Parque",
    date: "20 Nov 2025",
    attendeesCount: 15,
    status: "enviado",
  },
  {
    id: "4",
    buildingName: "Edificio Gran Vía 101",
    date: "15 Nov 2025",
    attendeesCount: 6,
    status: "enviado",
  },
];

export default function Dashboard({ onStartRecording, onMeetingClick }: DashboardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // todo: remove mock functionality - replace with real data fetching
  const [meetings] = useState<Meeting[]>(mockMeetings);

  const filteredMeetings = meetings.filter((m) =>
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

        {isEmpty ? (
          <EmptyState onStartRecording={() => setDialogOpen(true)} />
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
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
