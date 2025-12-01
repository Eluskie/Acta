import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import Dashboard from "@/pages/Dashboard";
import ReviewEditScreen from "@/pages/ReviewEditScreen";
import RecordingScreen from "@/components/RecordingScreen";
import ProcessingScreen from "@/components/ProcessingScreen";
import SendScreen from "@/pages/SendScreen";
import NotFound from "@/pages/not-found";
import type { Meeting } from "@shared/schema";

type AppScreen = "dashboard" | "recording" | "processing" | "review" | "send";

interface MeetingData {
  id?: string;
  buildingName: string;
  attendeesCount: number;
}

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("dashboard");
  const [meetingData, setMeetingData] = useState<MeetingData | null>(null);
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Create meeting mutation
  const createMeetingMutation = useMutation({
    mutationFn: async (data: { buildingName: string; attendeesCount: number }) => {
      const res = await apiRequest("POST", "/api/meetings", {
        buildingName: data.buildingName,
        attendeesCount: data.attendeesCount,
        status: "recording",
      });
      return res.json() as Promise<Meeting>;
    },
    onSuccess: (meeting) => {
      setCurrentMeeting(meeting);
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
    },
  });

  // Transcribe audio mutation
  const transcribeMutation = useMutation({
    mutationFn: async ({ meetingId, audioBlob }: { meetingId: string; audioBlob: Blob }) => {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const res = await fetch(`/api/meetings/${meetingId}/transcribe`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || error.error || "Transcription failed");
      }

      return res.json() as Promise<Meeting>;
    },
    onSuccess: (meeting) => {
      setCurrentMeeting(meeting);
      setCurrentScreen("review");
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", meeting.id] });
    },
    onError: (error) => {
      console.error("Transcription error:", error);
      toast({
        title: "Error de transcripción",
        description: error instanceof Error ? error.message : "No se pudo procesar el audio",
        variant: "destructive",
      });
      setCurrentScreen("dashboard");
    },
  });

  // Generate acta mutation
  const generateActaMutation = useMutation({
    mutationFn: async (meetingId: string) => {
      const res = await apiRequest("POST", `/api/meetings/${meetingId}/generate-acta`);
      return res.json() as Promise<Meeting>;
    },
    onSuccess: (meeting) => {
      setCurrentMeeting(meeting);
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", meeting.id] });
    },
    onError: (error) => {
      toast({
        title: "Error generando acta",
        description: error instanceof Error ? error.message : "No se pudo generar el acta",
        variant: "destructive",
      });
    },
  });

  // Send acta mutation
  const sendActaMutation = useMutation({
    mutationFn: async ({
      meetingId,
      recipients,
      subject,
      message
    }: {
      meetingId: string;
      recipients: Array<{ id: string; name: string; email: string }>;
      subject?: string;
      message?: string;
    }) => {
      const res = await apiRequest("POST", `/api/meetings/${meetingId}/send`, {
        recipients,
        subject,
        message,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({
        title: "Acta enviada",
        description: "El acta ha sido enviada correctamente a todos los destinatarios",
      });
    },
    onError: (error) => {
      toast({
        title: "Error enviando acta",
        description: error instanceof Error ? error.message : "No se pudo enviar el acta",
        variant: "destructive",
      });
    },
  });

  const handleStartRecording = async (data: MeetingData) => {
    setMeetingData(data);

    // Create meeting in backend
    try {
      const meeting = await createMeetingMutation.mutateAsync({
        buildingName: data.buildingName,
        attendeesCount: data.attendeesCount,
      });
      setMeetingData({ ...data, id: meeting.id });
      setCurrentScreen("recording");
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo iniciar la grabación",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = async (duration: number, audioBlob: Blob | null) => {
    if (!meetingData?.id) {
      toast({
        title: "Error",
        description: "No se encontró la reunión",
        variant: "destructive",
      });
      setCurrentScreen("dashboard");
      return;
    }

    if (!audioBlob || audioBlob.size === 0) {
      toast({
        title: "Error de grabación",
        description: "No se pudo capturar el audio. Por favor, verifique los permisos del micrófono e intente de nuevo.",
        variant: "destructive",
      });
      setCurrentScreen("dashboard");
      return;
    }

    console.log(`Audio captured: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
    setCurrentScreen("processing");

    // Upload and transcribe
    transcribeMutation.mutate({
      meetingId: meetingData.id,
      audioBlob,
    });
  };

  const handleMeetingClick = async (meetingId: string) => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Meeting not found");
      const meeting = await res.json() as Meeting;

      setCurrentMeeting(meeting);
      setMeetingData({
        id: meeting.id,
        buildingName: meeting.buildingName,
        attendeesCount: meeting.attendeesCount,
      });

      setCurrentScreen("review");
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la reunión",
        variant: "destructive",
      });
    }
  };

  const handleSendActa = async (recipients: Array<{ id: string; name: string; email: string }>, subject: string, message: string) => {
    if (!currentMeeting?.id) return;

    await sendActaMutation.mutateAsync({
      meetingId: currentMeeting.id,
      recipients,
      subject,
      message,
    });

    // After successful send, go back to dashboard
    handleDone();
  };

  const handleGoToSend = () => {
    setCurrentScreen("send");
  };

  const handleDone = () => {
    setMeetingData(null);
    setCurrentMeeting(null);
    setCurrentScreen("dashboard");
    setLocation("/");
  };

  const handleBack = () => {
    switch (currentScreen) {
      case "recording":
        setCurrentScreen("dashboard");
        break;
      case "processing":
        setCurrentScreen("dashboard");
        break;
      case "review":
        setCurrentScreen("dashboard");
        break;
      case "send":
        setCurrentScreen("review");
        break;
      default:
        setCurrentScreen("dashboard");
    }
  };

  if (currentScreen === "recording" && meetingData) {
    return (
      <RecordingScreen
        buildingName={meetingData.buildingName}
        attendeesCount={meetingData.attendeesCount}
        onStop={handleStopRecording}
        onClose={() => setCurrentScreen("dashboard")}
      />
    );
  }

  if (currentScreen === "processing") {
    return (
      <ProcessingScreen
        buildingName={meetingData?.buildingName || ""}
      />
    );
  }

  if (currentScreen === "review" && meetingData) {
    return (
      <ReviewEditScreen
        buildingName={meetingData.buildingName}
        meeting={currentMeeting}
        onBack={handleBack}
        onNext={handleGoToSend}
      />
    );
  }

  if (currentScreen === "send" && meetingData) {
    return (
      <SendScreen
        buildingName={meetingData.buildingName}
        meeting={currentMeeting}
        onBack={handleBack}
        onSend={handleSendActa}
        onDone={handleDone}
      />
    );
  }

  return (
    <Switch>
      <Route path="/">
        <Dashboard
          onStartRecording={handleStartRecording}
          onMeetingClick={handleMeetingClick}
        />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
