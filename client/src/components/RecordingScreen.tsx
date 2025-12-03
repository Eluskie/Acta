import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Pause, Square, Play, Users, Building2, AlertCircle } from "lucide-react";
import AudioWaveform from "./AudioWaveform";
import { cn } from "@/lib/utils";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { posthog } from "@/lib/posthog";

interface RecordingScreenProps {
  buildingName: string;
  attendeesCount: number;
  onStop?: (duration: number, audioBlob: Blob | null) => void;
  onClose?: () => void;
}

export default function RecordingScreen({
  buildingName,
  attendeesCount,
  onStop,
  onClose,
}: RecordingScreenProps) {
  const hasStartedRef = useRef(false);

  const {
    isRecording,
    isPaused,
    duration,
    audioLevel,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    error,
  } = useAudioRecorder();

  // Auto-start recording when component mounts (only once)
  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      startRecording();
      posthog.capture('recording_started', {
        building_name: buildingName,
        attendees_count: attendeesCount,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      posthog.capture('recording_resumed');
      resumeRecording();
    } else {
      posthog.capture('recording_paused');
      pauseRecording();
    }
  }, [isPaused, pauseRecording, resumeRecording]);

  const handleStop = useCallback(async () => {
    const audioBlob = await stopRecording();
    posthog.capture('recording_stopped', {
      duration_seconds: duration,
      audio_size_bytes: audioBlob?.size || 0,
    });
    onStop?.(duration, audioBlob);
  }, [duration, stopRecording, onStop]);

  if (error) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-center">
          Error de grabación
        </h2>
        <p className="text-muted-foreground text-center mb-8 max-w-md">
          {error}
        </p>
        <Button onClick={onClose} data-testid="button-back-error">
          Volver al inicio
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col font-sans">
      <div className="flex items-center justify-between p-4 border-b border-border/40 h-14">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm leading-none" data-testid="text-building-name">{buildingName}</h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <Users className="w-3 h-3" />
              <span data-testid="text-attendees-count">{attendeesCount} asistentes</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-full">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              isRecording && !isPaused ? "bg-red-500 animate-pulse" : "bg-muted-foreground"
            )}
            data-testid="indicator-recording"
          />
          <span className="text-xs font-medium text-muted-foreground" data-testid="text-recording-status">
            {isPaused ? "En pausa" : isRecording ? "Grabando" : "Detenido"}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div
          className={cn(
            "w-48 h-48 rounded-full flex items-center justify-center mb-8 transition-all duration-300",
            isRecording && !isPaused
              ? "bg-recording/10 animate-recording-pulse"
              : "bg-muted"
          )}
          style={{
            transform: isRecording && !isPaused ? `scale(${1 + audioLevel * 0.15})` : "scale(1)",
          }}
        >
          <AudioWaveform
            isRecording={isRecording && !isPaused}
            audioLevel={audioLevel}
            barCount={24}
            className="w-32"
          />
        </div>

        <div
          className="text-6xl font-bold tabular-nums tracking-tight mb-12"
          data-testid="text-recording-timer"
        >
          {formatTime(duration)}
        </div>

        <div className="flex items-center gap-4">
          <Button
            size="lg"
            variant="outline"
            className="h-16 w-16 rounded-full"
            onClick={handlePauseResume}
            disabled={!isRecording}
            data-testid="button-pause-resume"
          >
            {isPaused ? (
              <Play className="w-6 h-6" />
            ) : (
              <Pause className="w-6 h-6" />
            )}
          </Button>

          <Button
            size="lg"
            variant="destructive"
            className="h-16 w-16 rounded-full"
            onClick={handleStop}
            disabled={!isRecording && !isPaused}
            data-testid="button-stop-recording"
          >
            <Square className="w-6 h-6" />
          </Button>
        </div>
      </div>

      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Pulsa el botón rojo para detener y procesar la grabación
        </p>
      </div>
    </div>
  );
}
