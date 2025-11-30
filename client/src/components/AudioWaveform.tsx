import { cn } from "@/lib/utils";

interface AudioWaveformProps {
  isPlaying?: boolean;
  isRecording?: boolean;
  className?: string;
  barCount?: number;
}

export default function AudioWaveform({
  isPlaying = false,
  isRecording = false,
  className,
  barCount = 40,
}: AudioWaveformProps) {
  const bars = Array.from({ length: barCount }, (_, i) => {
    const baseHeight = Math.random() * 0.6 + 0.2;
    const delay = (i * 0.05) % 0.8;
    return { height: baseHeight, delay };
  });

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-[2px] h-16",
        className
      )}
      data-testid="audio-waveform"
    >
      {bars.map((bar, index) => (
        <div
          key={index}
          className={cn(
            "w-1 rounded-full transition-all",
            isRecording && "bg-recording",
            isPlaying && "bg-primary",
            !isRecording && !isPlaying && "bg-muted-foreground/30",
            (isPlaying || isRecording) && "animate-waveform"
          )}
          style={{
            height: `${bar.height * 100}%`,
            animationDelay: `${bar.delay}s`,
            animationPlayState: isPlaying || isRecording ? "running" : "paused",
          }}
        />
      ))}
    </div>
  );
}
