import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import TranscriptEditor, { type TranscriptParagraph } from "@/components/TranscriptEditor";
import ActaPreview from "@/components/ActaPreview";
import AudioPlayer from "@/components/AudioPlayer";

interface ReviewEditScreenProps {
  buildingName: string;
  onBack?: () => void;
  onGenerate?: () => void;
}

// todo: remove mock data
const mockTranscript: TranscriptParagraph[] = [
  {
    id: "1",
    timestamp: "00:00",
    speaker: "Presidente",
    text: "Buenos días a todos. Damos comienzo a la reunión ordinaria de la comunidad de propietarios del edificio Alameda 42.",
  },
  {
    id: "2",
    timestamp: "00:15",
    speaker: "Secretario",
    text: "Confirmo que hay quórum suficiente con 12 propietarios presentes que representan el 65% de las cuotas de participación.",
  },
  {
    id: "3",
    timestamp: "00:32",
    speaker: "Presidente",
    text: "Perfecto. El primer punto del orden del día es la aprobación del acta de la reunión anterior celebrada el 15 de octubre.",
  },
  {
    id: "4",
    timestamp: "00:48",
    speaker: "Vecino 1",
    text: "Propongo aprobar el acta tal como está redactada. No tengo ninguna objeción.",
  },
  {
    id: "5",
    timestamp: "01:02",
    speaker: "Presidente",
    text: "¿Alguien más tiene algún comentario sobre el acta anterior? Viendo que no hay objeciones, se aprueba por unanimidad.",
  },
  {
    id: "6",
    timestamp: "01:18",
    speaker: "Secretario",
    text: "Queda constancia de la aprobación unánime del acta de la reunión del 15 de octubre.",
  },
];

const mockActaData = {
  buildingName: "Comunidad de Propietarios Edificio Alameda 42",
  address: "Calle Alameda 42, 28001 Madrid",
  date: "28 de noviembre de 2025",
  time: "18:30",
  attendees: [
    "Juan García (Presidente)",
    "María López (Secretaria)",
    "Antonio Martínez",
    "Carmen Ruiz",
    "Pedro Sánchez",
    "Ana Fernández",
  ],
  agenda: [
    "Lectura y aprobación del acta anterior",
    "Estado de cuentas y aprobación de presupuesto 2026",
    "Reparación de la fachada",
    "Ruegos y preguntas",
  ],
  resolutions: [
    {
      title: "Aprobación del acta de la reunión anterior",
      approved: true,
      votes: "Unanimidad (12 votos a favor)",
    },
    {
      title: "Aprobación del presupuesto 2026",
      approved: true,
      votes: "Mayoría (10 votos a favor, 2 abstenciones)",
    },
    {
      title: "Derrama para reparación de fachada",
      approved: true,
      votes: "Mayoría cualificada (11 votos a favor, 1 en contra)",
    },
  ],
  observations: "Se acuerda realizar una reunión extraordinaria en enero para revisar el avance de las obras de fachada.",
};

export default function ReviewEditScreen({
  buildingName,
  onBack,
  onGenerate,
}: ReviewEditScreenProps) {
  // todo: remove mock functionality
  const [paragraphs, setParagraphs] = useState(mockTranscript);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold">{buildingName}</h1>
              <p className="text-sm text-muted-foreground">
                Revisar y editar transcripción
              </p>
            </div>
          </div>

          <Button
            onClick={onGenerate}
            className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
            data-testid="button-generate-acta"
          >
            <FileText className="w-4 h-4" />
            Generar Acta
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="flex-1 lg:w-[60%] border-r">
          <ScrollArea className="h-[calc(100vh-64px-120px)]">
            <div className="p-6">
              <h2 className="font-semibold mb-4">Transcripción</h2>
              <TranscriptEditor
                paragraphs={paragraphs}
                onChange={setParagraphs}
              />
            </div>
          </ScrollArea>
        </div>

        <div className="lg:w-[40%] bg-muted/30">
          <ScrollArea className="h-[calc(100vh-64px-120px)]">
            <div className="p-6">
              <h2 className="font-semibold mb-4">Vista previa del Acta</h2>
              <ActaPreview data={mockActaData} />
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="sticky bottom-0 bg-background border-t p-4">
        <div className="max-w-7xl mx-auto">
          <AudioPlayer duration={245} />
        </div>
      </div>
    </div>
  );
}
