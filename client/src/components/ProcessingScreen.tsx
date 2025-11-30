import { Loader2 } from "lucide-react";

interface ProcessingScreenProps {
  buildingName: string;
}

export default function ProcessingScreen({ buildingName }: ProcessingScreenProps) {
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-8">
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-8">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
      
      <h2 className="text-2xl font-semibold mb-2 text-center" data-testid="text-processing-title">
        Procesando grabación
      </h2>
      
      <p className="text-muted-foreground text-center mb-4 max-w-md" data-testid="text-processing-subtitle">
        {buildingName}
      </p>
      
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground text-center">
          Transcribiendo audio con inteligencia artificial...
        </p>
        <p className="text-xs text-muted-foreground/70 text-center">
          Este proceso puede tardar unos minutos dependiendo de la duración de la grabación
        </p>
      </div>
    </div>
  );
}
