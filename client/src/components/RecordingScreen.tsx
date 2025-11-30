import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Pause, Square, Play, Users, Building2 } from "lucide-react";
import AudioWaveform from "./AudioWaveform";
import { cn } from "@/lib/utils";

interface RecordingScreenProps {
  buildingName: string;
  attendeesCount: number;
  onStop?: (duration: number) => void;
  onClose?: () => void;
}

export default function RecordingScreen({
  buildingName,
  attendeesCount,
  onStop,
  onClose,
}: RecordingScreenProps) {
  const [isRecording, setIsRecording] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (isRecording && !isPaused) {
      const interval = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRecording, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePauseResume = useCallback(() => {
    setIsPaused((p) => !p);
  }, []);

  const handleStop = useCallback(() => {
    setIsRecording(false);
    onStop?.(duration);
  }, [duration, onStop]);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">{buildingName}</h2>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{attendeesCount} asistentes</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-3 h-3 rounded-full",
              isRecording && !isPaused ? "bg-recording animate-recording-pulse" : "bg-muted-foreground"
            )}
          />
          <span className="text-sm font-medium text-muted-foreground">
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
        >
          <AudioWaveform
            isRecording={isRecording && !isPaused}
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
