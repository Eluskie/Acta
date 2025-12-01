import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  audioUrl?: string | null;
  duration?: number;
  className?: string;
}

export default function AudioPlayer({ audioUrl, duration = 0, className }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const [volume, setVolume] = useState(80);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (isFinite(audio.duration)) {
        setAudioDuration(audio.duration);
      }
      setHasError(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      console.error("Audio failed to load:", audioUrl);
      setHasError(true);
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    // Force load the audio to trigger metadata loading
    audio.load();

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current || !isFinite(value[0]) || !isFinite(audioDuration)) return;
    const seekTime = Math.max(0, Math.min(value[0], audioDuration));
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleSkip = (seconds: number) => {
    if (!audioRef.current || !isFinite(audioDuration)) return;
    const newTime = Math.max(0, Math.min(audioDuration, audioRef.current.currentTime + seconds));
    if (!isFinite(newTime)) return;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  if (!audioUrl) {
    return (
      <div className={cn("bg-card rounded-lg border p-4", className)}>
        <div className="text-center text-sm text-muted-foreground py-4">
          No hay audio disponible para esta reunión
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={cn("bg-card rounded-lg border p-4", className)}>
        <div className="text-center text-sm text-muted-foreground py-4">
          Error al cargar el audio. El archivo puede no estar disponible.
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-card rounded-lg border p-4", className)}>
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}

      <Slider
        value={[currentTime]}
        max={audioDuration || 100}
        step={0.1}
        onValueChange={handleSeek}
        className="mb-4"
        disabled={!audioUrl}
        data-testid="slider-audio-progress"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSkip(-10)}
            disabled={!audioUrl}
            data-testid="button-skip-back"
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            className="h-10 w-10"
            onClick={handlePlayPause}
            disabled={!audioUrl}
            data-testid="button-play-pause"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSkip(10)}
            disabled={!audioUrl}
            data-testid="button-skip-forward"
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          <span className="text-sm tabular-nums text-muted-foreground ml-2">
            {formatTime(currentTime)} / {formatTime(audioDuration)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-muted-foreground" />
          <Slider
            value={[volume]}
            max={100}
            onValueChange={(v) => setVolume(v[0])}
            className="w-24"
            data-testid="slider-volume"
          />
        </div>
      </div>
    </div>
  );
}
