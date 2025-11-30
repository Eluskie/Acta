import AudioWaveform from "../AudioWaveform";

export default function AudioWaveformExample() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-2">Recording state:</p>
        <AudioWaveform isRecording />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Playing state:</p>
        <AudioWaveform isPlaying />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Idle state:</p>
        <AudioWaveform />
      </div>
    </div>
  );
}
