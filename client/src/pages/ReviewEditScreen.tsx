import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import TranscriptEditor, { type TranscriptParagraph } from "@/components/TranscriptEditor";
import EmailRecipients, { type Recipient } from "@/components/EmailRecipients";
import AudioPlayer from "@/components/AudioPlayer";
import type { Meeting, EmailRecipient } from "@shared/schema";

interface ReviewEditScreenProps {
  buildingName: string;
  meeting?: Meeting | null;
  onBack?: () => void;
  onSend?: (recipients: Array<{ id: string; name: string; email: string }>, actaContent: string) => Promise<void>;
  isSending?: boolean;
}

export default function ReviewEditScreen({
  buildingName,
  meeting,
  onBack,
  onSend,
  isSending = false,
}: ReviewEditScreenProps) {
  const [paragraphs, setParagraphs] = useState<TranscriptParagraph[]>([]);
  const [actaContent, setActaContent] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [subject, setSubject] = useState("");

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

  useEffect(() => {
    if (meeting?.recipients && Array.isArray(meeting.recipients)) {
      const existingRecipients = (meeting.recipients as EmailRecipient[]).map(r => ({
        id: r.id,
        email: r.email,
        name: r.name,
      }));
      setRecipients(existingRecipients);
    }
  }, [meeting?.recipients]);

  useEffect(() => {
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

    setSubject(`Acta de Junta Ordinaria - ${buildingName} - ${formattedDate}`);
  }, [buildingName, meeting?.date]);

  const handleSend = async () => {
    const formattedRecipients = recipients.map(r => ({
      id: r.id,
      name: r.name || "",
      email: r.email,
    }));
    await onSend?.(formattedRecipients, actaContent);
  };

  const audioDuration = meeting?.duration || 0;

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="sticky top-0 z-50 bg-background border-b border-border/40 h-14">
        <div className="max-w-[1600px] mx-auto px-4 h-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              data-testid="button-back"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex flex-col">
              <h1 className="font-semibold text-sm leading-none" data-testid="text-building-name">{buildingName}</h1>
              <p className="text-xs text-muted-foreground mt-1">
                Revisar y enviar acta
              </p>
            </div>
          </div>

          <Button
            onClick={handleSend}
            disabled={isSending || recipients.length === 0 || !actaContent}
            size="sm"
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="button-send-acta"
          >
            {isSending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Enviar Acta
              </>
            )}
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
          {/* 1. Acta Content - Editable */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground tracking-tight mb-1">Acta Generada</h2>
              <p className="text-sm text-muted-foreground">Revisa y edita el contenido del acta antes de enviar</p>
            </div>
            <Textarea
              value={actaContent}
              onChange={(e) => setActaContent(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
              placeholder="El acta se generará automáticamente..."
              data-testid="textarea-acta-content"
            />
          </section>

          {/* 2. Email Recipients */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground tracking-tight mb-1">Destinatarios</h2>
              <p className="text-sm text-muted-foreground">Añade los correos electrónicos de los destinatarios</p>
            </div>
            <EmailRecipients
              recipients={recipients}
              onChange={setRecipients}
            />
            <div className="mt-4">
              <Label htmlFor="subject" className="text-sm font-medium">
                Asunto del correo
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-2"
                data-testid="input-email-subject"
              />
            </div>
          </section>

          {/* 3. Transcript - For Reference */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground tracking-tight mb-1">Transcripción</h2>
              <p className="text-sm text-muted-foreground">Transcripción original de la reunión (solo referencia)</p>
            </div>
            {paragraphs.length > 0 ? (
              <div className="bg-muted/30 rounded-lg border p-6">
                <TranscriptEditor
                  paragraphs={paragraphs}
                  onChange={setParagraphs}
                />
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border">
                <p>No hay transcripción disponible</p>
              </div>
            )}
          </section>
        </div>
      </ScrollArea>

      {/* Audio Player at Bottom */}
      <div className="sticky bottom-0 bg-background border-t p-4">
        <div className="max-w-4xl mx-auto">
          <AudioPlayer audioUrl={meeting?.audioUrl} duration={audioDuration} />
        </div>
      </div>
    </div>
  );
}
