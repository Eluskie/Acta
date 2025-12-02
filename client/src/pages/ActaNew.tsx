import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import RecordingScreen from "@/components/RecordingScreen";
import ProcessingScreen from "@/components/ProcessingScreen";
import NewMeetingDialog from "@/components/NewMeetingDialog";
import type { Meeting } from "@shared/schema";

type FlowStep = "setup" | "recording" | "processing";

interface MeetingData {
  id?: string;
  buildingName: string;
  attendeesCount: number;
}

export default function ActaNew() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<FlowStep>("setup");
  const [meetingData, setMeetingData] = useState<MeetingData | null>(null);

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
    onSuccess: () => {
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
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", meeting.id] });
      // Navigate to the acta view page
      navigate(`/acta/${meeting.id}`);
    },
    onError: (error) => {
      console.error("Transcription error:", error);
      toast({
        title: "Error de transcripción",
        description: error instanceof Error ? error.message : "No se pudo procesar el audio",
        variant: "destructive",
      });
      navigate("/");
    },
  });

  const handleStartRecording = async (data: { buildingName: string; attendeesCount: number }) => {
    try {
      const meeting = await createMeetingMutation.mutateAsync(data);
      setMeetingData({ ...data, id: meeting.id });
      setStep("recording");
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
      navigate("/");
      return;
    }

    if (!audioBlob || audioBlob.size === 0) {
      toast({
        title: "Error de grabación",
        description: "No se pudo capturar el audio. Por favor, verifique los permisos del micrófono e intente de nuevo.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    console.log(`Audio captured: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
    setStep("processing");

    // Upload and transcribe
    transcribeMutation.mutate({
      meetingId: meetingData.id,
      audioBlob,
    });
  };

  const handleClose = () => {
    navigate("/");
  };

  // Setup step - show the dialog
  if (step === "setup") {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <NewMeetingDialog
          open={true}
          onOpenChange={(open) => {
            // Only navigate away if user cancels (not when transitioning to recording)
            if (!open && step === "setup") {
              navigate("/");
            }
          }}
          onStartRecording={handleStartRecording}
        />
      </div>
    );
  }

  // Recording step
  if (step === "recording" && meetingData) {
    return (
      <RecordingScreen
        buildingName={meetingData.buildingName}
        attendeesCount={meetingData.attendeesCount}
        onStop={handleStopRecording}
        onClose={handleClose}
      />
    );
  }

  // Processing step
  if (step === "processing" && meetingData) {
    return (
      <ProcessingScreen
        buildingName={meetingData.buildingName}
      />
    );
  }

  return null;
}



