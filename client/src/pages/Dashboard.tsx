import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, FileText, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import MeetingCard from "@/components/MeetingCard";
import EmptyState from "@/components/EmptyState";
import type { Meeting } from "@shared/schema";
import type { ActaStatus } from "@/components/StatusBadge";
import { useCurrentUser } from "@/lib/clerk";

/**
 * Dashboard - Main landing page
 *
 * Design Philosophy:
 * - Quick stats at top for immediate status awareness
 * - Recent actas for quick access to ongoing work
 * - Clear visual hierarchy: Stats → Actas
 * - Mobile-first with touch-friendly targets
 */
export default function Dashboard() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const currentUser = useCurrentUser();

  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
  });

  // Calculate stats
  const totalActas = meetings.length;
  const draftActas = meetings.filter(m => m.status === 'review').length; // Only count "Borrador" status
  const inProgressActas = meetings.filter(m => m.status === 'processing' || m.status === 'recording').length;
  const sentActas = meetings.filter(m => m.status === 'sent').length;

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
  }).replace(/^\w/, c => c.toUpperCase());

  // Get hour for greeting
  const hour = today.getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header onSearch={setSearchQuery} />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-24">
        {/* Hero Section with Stats */}
        <div className="mb-8 sm:mb-12">
          <p className="text-sm text-muted-foreground mb-1">{dateString}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 tracking-tight">
            {greeting}{currentUser?.firstName ? `, ${currentUser.firstName}` : ''}
          </h1>
          
          {/* Quick Stats - Only show if there are meetings */}
          {totalActas > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4 sm:gap-6 mt-4"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <span className="text-xl font-bold text-foreground">{totalActas}</span>
                  <span className="text-sm text-muted-foreground ml-1">actas</span>
                </div>
              </div>
              
              {draftActas > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <span className="text-xl font-bold text-foreground">{draftActas}</span>
                    <span className="text-sm text-muted-foreground ml-1">{draftActas === 1 ? 'borrador' : 'borradores'}</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Recent Meetings Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground tracking-tight">
              Actas Recientes
            </h2>
            <Button
              size="sm"
              className="hidden sm:flex gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => navigate("/acta/new")}
            >
              <Plus className="w-4 h-4" />
              Nueva Acta
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : isEmpty ? (
            <EmptyState onStartRecording={() => navigate("/acta/new")} />
          ) : (
            <>
              {filteredMeetings.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No se encontraron actas que coincidan con "{searchQuery}"
                  </p>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                  {filteredMeetings.map((meeting, index) => (
                    <motion.div
                      key={meeting.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                    >
                      <MeetingCard
                        meeting={meeting}
                        onClick={() => navigate(`/acta/${meeting.id}`)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Mobile Floating Action Button */}
      <motion.div 
        className="fixed bottom-6 right-6 sm:hidden z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 400, damping: 20 }}
      >
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg shadow-primary/25 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => navigate("/acta/new")}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </motion.div>
    </div>
  );
}
