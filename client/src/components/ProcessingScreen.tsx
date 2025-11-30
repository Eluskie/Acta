import { Loader2 } from "lucide-react";

interface ProcessingScreenProps {
  buildingName: string;
}

export default function ProcessingScreen({ buildingName }: ProcessingScreenProps) {
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-8 font-sans">
      <div className="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center mb-8">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>

      <h2 className="text-xl font-semibold mb-2 text-center tracking-tight" data-testid="text-processing-title">
        Procesando grabación
      </h2>

      <p className="text-muted-foreground text-center mb-8 max-w-md text-sm" data-testid="text-processing-subtitle">
        {buildingName}
      </p>

      <div className="flex flex-col items-center gap-3 max-w-xs mx-auto">
        <p className="text-sm text-foreground/80 text-center font-medium">
          Transcribiendo audio y generando acta...
        </p>
        <p className="text-xs text-muted-foreground/60 text-center leading-relaxed">
          Este proceso puede tardar unos minutos. Estamos transcribiendo el audio y generando el acta oficial automáticamente.
        </p>
      </div>
    </div>
  );
}
