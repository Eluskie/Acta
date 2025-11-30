import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  duration?: number;
  className?: string;
}

export default function AudioPlayer({ duration = 180, className }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    setCurrentTime(value[0]);
  };

  const handleSkip = (seconds: number) => {
    setCurrentTime((prev) => Math.max(0, Math.min(duration, prev + seconds)));
  };

  const waveformBars = Array.from({ length: 100 }, () => Math.random() * 0.7 + 0.3);

  return (
    <div className={cn("bg-card rounded-lg border p-4", className)}>
      <div className="relative h-16 mb-4 flex items-end gap-[1px]">
        {waveformBars.map((height, i) => {
          const position = (i / waveformBars.length) * duration;
          const isPast = position <= currentTime;
          return (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-full transition-colors cursor-pointer",
                isPast ? "bg-primary" : "bg-muted-foreground/20"
              )}
              style={{ height: `${height * 100}%` }}
              onClick={() => setCurrentTime(position)}
            />
          );
        })}
        <div
          className="absolute top-0 w-0.5 h-full bg-accent"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />
      </div>

      <Slider
        value={[currentTime]}
        max={duration}
        step={0.1}
        onValueChange={handleSeek}
        className="mb-4"
        data-testid="slider-audio-progress"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSkip(-10)}
            data-testid="button-skip-back"
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            className="h-10 w-10"
            onClick={handlePlayPause}
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
            data-testid="button-skip-forward"
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          <span className="text-sm tabular-nums text-muted-foreground ml-2">
            {formatTime(currentTime)} / {formatTime(duration)}
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
