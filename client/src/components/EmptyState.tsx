import { Button } from "@/components/ui/button";
import { FileText, Mic } from "lucide-react";

interface EmptyStateProps {
  onStartRecording?: () => void;
}

export default function EmptyState({ onStartRecording }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <FileText className="w-12 h-12 text-primary/60" />
      </div>
      
      <h2 className="text-2xl font-semibold mb-3">
        Comienza tu primera acta
      </h2>
      
      <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
        Graba las reuniones de tu comunidad y genera actas oficiales 
        de forma automática. Es fácil, rápido y profesional.
      </p>

      <Button
        size="lg"
        className="h-14 px-8 text-base font-semibold bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
        onClick={onStartRecording}
        data-testid="button-start-first-recording"
      >
        <Mic className="w-5 h-5" />
        Grabar mi primera reunión
      </Button>
    </div>
  );
}
