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
import { Card, CardContent } from "@/components/ui/card";

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
      month: "long",
      year: "numeric",
    }),
    duration: meeting.duration || undefined,
    attendeesCount: meeting.attendeesCount,
    status: meeting.status as ActaStatus,
  }));

  const filteredMeetings = formattedMeetings.filter((m) =>
    m.buildingName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isEmpty = meetings.length === 0;

  // Get current date for header
  const today = new Date();
  const dateString = today.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans">
      <Header onSearch={setSearchQuery} />

      <main className="max-w-[1600px] mx-auto px-6 py-10 pb-24">
        {/* Hero Section */}
        <div className="mb-12">
          <p className="text-xs font-semibold text-muted-foreground mb-3 tracking-wider uppercase">{dateString}</p>
          <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">Hola, María</h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
            Bienvenida a tu panel de gestión. Todo está listo para tu próxima reunión.
          </p>
        </div>

        {/* Recent Meetings Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground tracking-tight">Reuniones Recientes</h2>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="text-muted-foreground text-xs h-8">Ver todas</Button>
              <Button
                size="sm"
                className="hidden md:flex gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Nueva Acta
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : isEmpty ? (
            <EmptyState onStartRecording={() => setDialogOpen(true)} />
          ) : (
            <>
              {filteredMeetings.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No se encontraron actas que coincidan con "{searchQuery}"
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredMeetings.map((meeting) => (
                    <MeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      onClick={() => onMeetingClick?.(meeting.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-6 right-6 md:hidden z-50">
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-transform hover:scale-105 active:scale-95"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      <NewMeetingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onStartRecording={onStartRecording}
      />
    </div>
  );
}
