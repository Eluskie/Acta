import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface ActaData {
  buildingName: string;
  address: string;
  date: string;
  time: string;
  attendees: string[];
  agenda: string[];
  resolutions: { title: string; approved: boolean; votes: string }[];
  observations?: string;
}

interface ActaPreviewProps {
  data: ActaData;
  className?: string;
}

export default function ActaPreview({ data, className }: ActaPreviewProps) {
  return (
    <Card className={cn("shadow-lg", className)} data-testid="card-acta-preview">
      <CardContent className="p-8 space-y-6 text-sm leading-relaxed">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-bold uppercase tracking-wide">
            Acta de Junta Ordinaria
          </h2>
          <p className="text-muted-foreground">{data.buildingName}</p>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Fecha:</span>
              <span className="ml-2">{data.date}</span>
            </div>
            <div>
              <span className="font-medium">Hora:</span>
              <span className="ml-2">{data.time}</span>
            </div>
          </div>
          <div>
            <span className="font-medium">Lugar:</span>
            <span className="ml-2">{data.address}</span>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold mb-2">Asistentes ({data.attendees.length})</h3>
          <p className="text-muted-foreground">{data.attendees.join(", ")}</p>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold mb-2">Orden del Día</h3>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            {data.agenda.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold mb-3">Acuerdos Adoptados</h3>
          <div className="space-y-3">
            {data.resolutions.map((resolution, i) => (
              <div key={i} className="p-3 bg-muted/50 rounded-md">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium">{resolution.title}</span>
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      resolution.approved
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    )}
                  >
                    {resolution.approved ? "Aprobado" : "Rechazado"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {resolution.votes}
                </p>
              </div>
            ))}
          </div>
        </div>

        {data.observations && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold mb-2">Observaciones</h3>
              <p className="text-muted-foreground">{data.observations}</p>
            </div>
          </>
        )}

        <Separator />

        <div className="pt-8 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="border-t border-foreground/30 pt-2 mt-12">
                <p className="font-medium">El Presidente</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-foreground/30 pt-2 mt-12">
                <p className="font-medium">El Secretario</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
