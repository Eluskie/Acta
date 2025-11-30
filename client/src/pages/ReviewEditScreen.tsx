import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import TranscriptEditor, { type TranscriptParagraph } from "@/components/TranscriptEditor";
import ActaPreview from "@/components/ActaPreview";
import AudioPlayer from "@/components/AudioPlayer";
import type { Meeting } from "@shared/schema";

interface ReviewEditScreenProps {
  buildingName: string;
  meeting?: Meeting | null;
  onBack?: () => void;
  onGenerate?: () => void;
  isGenerating?: boolean;
}

export default function ReviewEditScreen({
  buildingName,
  meeting,
  onBack,
  onGenerate,
  isGenerating = false,
}: ReviewEditScreenProps) {
  const [paragraphs, setParagraphs] = useState<TranscriptParagraph[]>([]);

  useEffect(() => {
    if (meeting?.transcript && Array.isArray(meeting.transcript)) {
      setParagraphs(meeting.transcript as TranscriptParagraph[]);
    }
  }, [meeting?.transcript]);

  const formattedDate = meeting?.date 
    ? new Date(meeting.date).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  const actaData = {
    buildingName: meeting?.buildingName || buildingName,
    address: "",
    date: formattedDate,
    time: meeting?.date 
      ? new Date(meeting.date).toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
    attendees: [],
    agenda: [],
    resolutions: [],
    observations: meeting?.actaContent || "",
  };

  const audioDuration = meeting?.duration || 0;

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
              <h1 className="font-semibold" data-testid="text-building-name">{buildingName}</h1>
              <p className="text-sm text-muted-foreground">
                Revisar y editar transcripción
              </p>
            </div>
          </div>

          <Button
            onClick={onGenerate}
            disabled={isGenerating || paragraphs.length === 0}
            className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
            data-testid="button-generate-acta"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Generar Acta
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="flex-1 lg:w-[60%] border-r">
          <ScrollArea className="h-[calc(100vh-64px-120px)]">
            <div className="p-6">
              <h2 className="font-semibold mb-4">Transcripción</h2>
              {paragraphs.length > 0 ? (
                <TranscriptEditor
                  paragraphs={paragraphs}
                  onChange={setParagraphs}
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No hay transcripción disponible</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="lg:w-[40%] bg-muted/30">
          <ScrollArea className="h-[calc(100vh-64px-120px)]">
            <div className="p-6">
              <h2 className="font-semibold mb-4">Vista previa del Acta</h2>
              {meeting?.actaContent ? (
                <div className="bg-white dark:bg-background rounded-lg border p-6 prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm" data-testid="text-acta-content">
                    {meeting.actaContent}
                  </pre>
                </div>
              ) : (
                <ActaPreview data={actaData} />
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="sticky bottom-0 bg-background border-t p-4">
        <div className="max-w-7xl mx-auto">
          <AudioPlayer duration={audioDuration} />
        </div>
      </div>
    </div>
  );
}
