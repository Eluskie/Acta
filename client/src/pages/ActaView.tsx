import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import TranscriptEditor, { type TranscriptParagraph } from "@/components/TranscriptEditor";
import AudioPlayer from "@/components/AudioPlayer";
import PageHeader from "@/components/PageHeader";
import type { Meeting } from "@shared/schema";

export default function ActaView() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/acta/:id");
  const actaId = params?.id;

  const [paragraphs, setParagraphs] = useState<TranscriptParagraph[]>([]);
  const [actaContent, setActaContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Fetch meeting data
  const { data: meeting, isLoading, error } = useQuery<Meeting>({
    queryKey: ["/api/meetings", actaId],
    queryFn: async () => {
      const res = await fetch(`/api/meetings/${actaId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Meeting not found");
      return res.json();
    },
    enabled: !!actaId,
  });

  useEffect(() => {
    if (meeting?.transcript && Array.isArray(meeting.transcript)) {
      setParagraphs(meeting.transcript as TranscriptParagraph[]);
    }
  }, [meeting?.transcript]);

  useEffect(() => {
    if (meeting?.actaContent) {
      setActaContent(meeting.actaContent);
    }
  }, [meeting?.actaContent]);

  const handleBack = () => {
    navigate("/");
  };

  const handleNext = () => {
    navigate(`/acta/${actaId}/send`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No se encontró el acta</p>
        <Button onClick={() => navigate("/")}>Volver al inicio</Button>
      </div>
    );
  }

  const buildingName = meeting.buildingName;
  const audioDuration = meeting.duration || 0;
  const meetingDate = meeting.date ? new Date(meeting.date) : new Date();

  const formattedDateLong = meetingDate.toLocaleDateString("es-ES", {
    weekday: 'long',
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Format content: convert markdown-like syntax to HTML
  const formatContent = (content: string): string => {
    if (!content) return '';

    let formatted = content
      // Bold text: **text** -> <strong>text</strong>
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Numbered lists: 1. -> <br/>1.
      .replace(/(\d+\.\s+)/g, '<br/><br/>$1')
      // Headers: ## -> larger text
      .replace(/##\s*([^\n]+)/g, '<h3 class="text-lg font-bold mt-6 mb-3">$1</h3>')
      // Paragraphs: double line breaks
      .replace(/\n\n/g, '</p><p class="mb-4">')
      // Single line breaks
      .replace(/\n/g, '<br/>');

    return `<p class="mb-4">${formatted}</p>`;
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <PageHeader
        title="Acta Oficial"
        subtitle={buildingName}
        onBack={handleBack}
        action={
          <Button
            onClick={handleNext}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-10 px-6"
          >
            Continuar <ChevronRight className="w-4 h-4" />
          </Button>
        }
      />

      {/* A4 Document Container */}
      <ScrollArea className="flex-1">
        <div className="py-6 md:py-12 px-4">
          <div className="w-full max-w-[21cm] mx-auto">
            {/* A4 Paper */}
            <div
              className="bg-card shadow-2xl overflow-hidden w-full border border-border/20"
              style={{
                minHeight: '29.7cm',
                maxWidth: '21cm'
              }}
            >
              {/* Document Content */}
              <div
                className="px-12 md:px-20 py-16 md:py-20"
                style={{
                  fontFamily: 'Georgia, "Times New Roman", Times, serif',
                  fontSize: '11pt',
                  lineHeight: '1.6',
                  minHeight: '29.7cm'
                }}
              >
                {/* Header */}
                <div className="text-center mb-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">
                    ACTA OFICIAL NO. {meeting.id || new Date().getFullYear() + '-' + Math.floor(Math.random() * 100)}
                  </p>
                  <h1 className="text-3xl font-bold text-foreground mb-1">
                    ACTA DE REUNIÓN
                  </h1>
                  <div className="w-48 h-0.5 bg-foreground mx-auto mt-3"></div>
                </div>

                {/* Meeting Info */}
                <div className="my-10 text-justify text-foreground leading-relaxed">
                  <p>
                    En <strong>{buildingName}</strong>, a <strong>{formattedDateLong}</strong>, siendo las{' '}
                    <strong>{meetingDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} horas</strong>, se
                    reúne el comité de administración del Edificio {buildingName}.
                  </p>
                </div>

                {/* Attendees Box */}
                {meeting.attendeesCount && (
                  <div className="my-8 bg-muted/30 border border-border rounded p-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      ASISTENTES
                    </h3>
                    <p className="text-sm text-foreground">
                      Total de asistentes: {meeting.attendeesCount} personas.
                    </p>
                  </div>
                )}

                {/* Content - Editable */}
                <div
                  contentEditable={isEditing}
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    setIsEditing(false);
                    const newContent = e.currentTarget.innerHTML || '';
                    setActaContent(newContent);
                  }}
                  onClick={() => setIsEditing(true)}
                  className="my-8 text-foreground leading-relaxed text-justify"
                  style={{
                    outline: isEditing ? '2px solid hsl(var(--primary))' : 'none',
                    outlineOffset: '-4px',
                    cursor: isEditing ? 'text' : 'pointer',
                    padding: isEditing ? '8px' : '0',
                    borderRadius: '4px',
                    minHeight: '400px'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: actaContent ? (actaContent.startsWith('<') ? actaContent : formatContent(actaContent)) : '<p class="text-muted-foreground italic text-center py-12">Haz clic para editar el contenido del acta...</p>'
                  }}
                />

                {/* Signatures */}
                <div className="mt-32 pt-16 border-t-2 border-border">
                  <div className="grid grid-cols-2 gap-16">
                    <div className="text-center">
                      <div className="h-20 border-b-2 border-border mb-3"></div>
                      <p className="text-xs uppercase font-bold text-muted-foreground tracking-wide">
                        FIRMA PRESIDENTE
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="h-20 border-b-2 border-border mb-3"></div>
                      <p className="text-xs uppercase font-bold text-muted-foreground tracking-wide">
                        FIRMA SECRETARIA
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Hint */}
            {!isEditing && (
              <div className="text-center mt-4 text-sm text-muted-foreground">
                💡 Haz clic en el contenido para editarlo
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Continue Button (Mobile, above audio) */}
      <div className="md:hidden p-4 bg-card border-t border-border">
        <Button
          onClick={handleNext}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-12 text-base font-semibold"
        >
          Continuar <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Audio Player */}
      <div className="p-4 bg-card border-t border-border">
        <div className="max-w-5xl mx-auto">
          <AudioPlayer audioUrl={meeting.audioUrl} duration={audioDuration} />
        </div>
      </div>

      {/* Transcript Section */}
      <div className="border-t border-border bg-card">
        <details className="group">
          <summary className="cursor-pointer px-4 md:px-6 py-4 flex items-center justify-between hover:bg-muted/50 max-w-5xl mx-auto">
            <div>
              <h2 className="font-semibold text-foreground">Transcripción Original</h2>
              <p className="text-sm text-muted-foreground">Consulta la transcripción completa (solo referencia)</p>
            </div>
            <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 md:px-6 pb-6 max-h-[400px] overflow-y-auto max-w-5xl mx-auto">
            {paragraphs.length > 0 ? (
              <div className="bg-muted/30 rounded-lg border border-border p-6">
                <TranscriptEditor
                  paragraphs={paragraphs}
                  onChange={setParagraphs}
                />
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-border">
                <p>No hay transcripción disponible</p>
              </div>
            )}
          </div>
        </details>
      </div>
    </div>
  );
}

