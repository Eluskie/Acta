import { useState, useEffect, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, Loader2, Check, Edit, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import TranscriptEditor, { type TranscriptParagraph } from "@/components/TranscriptEditor";
import AudioPlayer from "@/components/AudioPlayer";
import PageHeader from "@/components/PageHeader";
import SignatureModal from "@/components/SignatureModal";
import type { Meeting } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { posthog } from "@/lib/posthog";

export default function ActaView() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/acta/:id");
  const actaId = params?.id;
  const { toast } = useToast();

  const [paragraphs, setParagraphs] = useState<TranscriptParagraph[]>([]);
  const [actaContent, setActaContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const editStartTimeRef = useRef<number | null>(null);

  // Signature modal state
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [currentSigner, setCurrentSigner] = useState<"president" | "secretary" | null>(null);

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

  // Track page view
  useEffect(() => {
    if (meeting) {
      posthog.capture('acta_viewed', {
        meeting_id: actaId,
        building_name: meeting.buildingName,
        has_signatures: !!(meeting.presidentSignature && meeting.secretarySignature),
      });
    }
  }, [meeting, actaId]);

  // Save signature mutation
  const saveSignatureMutation = useMutation({
    mutationFn: async ({ signature, name, type }: { signature: string; name: string; type: "president" | "secretary" }) => {
      const updateData: any = {};
      if (type === "president") {
        updateData.presidentSignature = signature;
        updateData.presidentName = name;
      } else {
        updateData.secretarySignature = signature;
        updateData.secretaryName = name;
      }

      // Check if both signatures are now present
      const currentMeeting = meeting;
      if (currentMeeting) {
        const hasPresident = type === "president" || currentMeeting.presidentSignature;
        const hasSecretary = type === "secretary" || currentMeeting.secretarySignature;

        if (hasPresident && hasSecretary) {
          updateData.signatureStatus = "signed";
          updateData.signedAt = new Date();
        }
      }

      return apiRequest("PATCH", `/api/meetings/${actaId}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", actaId] });
      setSignatureModalOpen(false);
      setCurrentSigner(null);
      toast({
        title: "Firma guardada",
        description: "La firma se ha guardado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo guardar la firma. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error("Error saving signature:", error);
    },
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

  const handleNext = async () => {
    // Save any pending edits before navigating
    if (contentEditableRef.current) {
      const currentContent = contentEditableRef.current.innerHTML || '';
      // Always save the current content from the DOM to ensure we have the latest edits
      if (currentContent.trim()) {
        await saveActaContent(currentContent);
      }
    } else if (actaContent) {
      // Fallback: save from state if ref is not available
      await saveActaContent(actaContent);
    }
    // Go directly to send page (signatures integrated there)
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

  // Convert HTML back to plain text/markdown for saving
  const htmlToPlainText = (html: string): string => {
    if (!html) return '';
    
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Process each node recursively
    const processNode = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        return text.trim() ? text : '';
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();
        const children = Array.from(node.childNodes)
          .map(processNode)
          .filter(s => s.length > 0)
          .join('');
        
        if (!children.trim()) return '';
        
        switch (tagName) {
          case 'strong':
          case 'b':
            return `**${children.trim()}**`;
          case 'h3':
          case 'h2':
          case 'h1':
            return `## ${children.trim()}\n\n`;
          case 'p':
            const pContent = children.trim();
            return pContent ? `${pContent}\n\n` : '';
          case 'br':
            return '\n';
          case 'div':
            return children;
          default:
            return children;
        }
      }
      
      return '';
    };
    
    let text = Array.from(tempDiv.childNodes)
      .map(processNode)
      .filter(s => s.length > 0)
      .join('');
    
    // Clean up extra whitespace and formatting
    text = text
      .replace(/\*\*\s+/g, '**')      // Remove spaces after **
      .replace(/\s+\*\*/g, '**')      // Remove spaces before **
      .replace(/\n{3,}/g, '\n\n')     // Max 2 consecutive newlines
      .replace(/[ \t]+/g, ' ')        // Multiple spaces to single
      .replace(/\n\s+\n/g, '\n\n')    // Remove lines with only whitespace
      .trim();
    
    return text;
  };

  // Save acta content to backend
  const saveActaContent = async (content: string) => {
    if (!actaId) return;

    // Convert HTML to plain text if needed
    const plainTextContent = content.startsWith('<')
      ? htmlToPlainText(content)
      : content;

    try {
      setIsSaving(true);
      await apiRequest("PATCH", `/api/meetings/${actaId}`, {
        actaContent: plainTextContent,
      });

      // Invalidate query to refresh data
      await queryClient.invalidateQueries({ queryKey: ["/api/meetings", actaId] });
    } catch (error) {
      console.error("Error saving acta content:", error);
      // Don't throw - allow user to continue even if save fails
    } finally {
      setIsSaving(false);
    }
  };

  // Signature handlers
  const handleOpenSignatureModal = (type: "president" | "secretary") => {
    posthog.capture('signature_modal_opened', {
      meeting_id: actaId,
      signer_role: type,
    });
    setCurrentSigner(type);
    setSignatureModalOpen(true);
  };

  const handleSaveSignature = async (signature: string, name: string) => {
    if (!currentSigner) return;

    await saveSignatureMutation.mutateAsync({
      signature,
      name,
      type: currentSigner,
    });

    posthog.capture('signature_added', {
      meeting_id: actaId,
      signer_role: currentSigner,
      signer_name: name,
    });
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
                  ref={contentEditableRef}
                  contentEditable={isEditing}
                  suppressContentEditableWarning
                  onBlur={async (e) => {
                    setIsEditing(false);
                    const newContent = e.currentTarget.innerHTML || '';
                    setActaContent(newContent);
                    // Track edit duration
                    if (editStartTimeRef.current) {
                      const editDuration = (Date.now() - editStartTimeRef.current) / 1000;
                      posthog.capture('acta_edited', {
                        meeting_id: actaId,
                        edit_duration_seconds: Math.round(editDuration),
                        content_length: newContent.length,
                      });
                      editStartTimeRef.current = null;
                    }
                    // Save to backend when editing finishes
                    if (newContent && newContent !== actaContent) {
                      await saveActaContent(newContent);
                    }
                  }}
                  onClick={() => {
                    if (!isEditing) {
                      editStartTimeRef.current = Date.now();
                    }
                    setIsEditing(true);
                  }}
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

                {/* Signatures - Interactive */}
                <div className="mt-32 pt-16 border-t-2 border-border">
                  <div className="grid grid-cols-2 gap-16">
                    {/* President Signature */}
                    <div className="text-center">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">Presidente</span>
                        {meeting?.presidentSignature && (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                      </div>

                      {meeting?.presidentSignature ? (
                        <>
                          <img
                            src={meeting.presidentSignature}
                            alt="Firma Presidente"
                            className="w-full h-20 object-contain border-b-2 border-border mb-3"
                          />
                          <p className="text-xs uppercase font-bold text-muted-foreground tracking-wide">
                            {meeting.presidentName || "FIRMA PRESIDENTE"}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenSignatureModal("president")}
                            className="w-full mt-2 h-8 text-xs"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Editar firma
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="h-20 border-b-2 border-border mb-3"></div>
                          <p className="text-xs uppercase font-bold text-muted-foreground tracking-wide">
                            FIRMA PRESIDENTE
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenSignatureModal("president")}
                            className="w-full mt-2"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Añadir firma
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Secretary Signature */}
                    <div className="text-center">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">Secretaria</span>
                        {meeting?.secretarySignature && (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                      </div>

                      {meeting?.secretarySignature ? (
                        <>
                          <img
                            src={meeting.secretarySignature}
                            alt="Firma Secretaria"
                            className="w-full h-20 object-contain border-b-2 border-border mb-3"
                          />
                          <p className="text-xs uppercase font-bold text-muted-foreground tracking-wide">
                            {meeting.secretaryName || "FIRMA SECRETARIA"}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenSignatureModal("secretary")}
                            className="w-full mt-2 h-8 text-xs"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Editar firma
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="h-20 border-b-2 border-border mb-3"></div>
                          <p className="text-xs uppercase font-bold text-muted-foreground tracking-wide">
                            FIRMA SECRETARIA
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenSignatureModal("secretary")}
                            className="w-full mt-2"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Añadir firma
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Hint */}
            {!isEditing && (
              <div className="text-center mt-4 text-sm text-muted-foreground">
                💡 Haz clic en el contenido para editarlo
                {isSaving && <span className="ml-2">💾 Guardando...</span>}
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

      {/* Signature Modal */}
      <SignatureModal
        open={signatureModalOpen}
        onOpenChange={setSignatureModalOpen}
        title={currentSigner === "president" ? "Firma del Presidente" : "Firma de la Secretaria"}
        description="Dibuja tu firma con el ratón o con el dedo en pantallas táctiles"
        defaultName={
          currentSigner === "president"
            ? meeting?.presidentName || "Presidente"
            : meeting?.secretaryName || "Secretaria"
        }
        onSave={handleSaveSignature}
        isSaving={saveSignatureMutation.isPending}
      />
    </div>
  );
}


