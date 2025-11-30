import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Send, FileText, Download, Loader2 } from "lucide-react";
import EmailRecipients, { type Recipient } from "@/components/EmailRecipients";
import SuccessAnimation from "@/components/SuccessAnimation";
import type { Meeting, EmailRecipient } from "@shared/schema";

interface SendScreenProps {
  buildingName: string;
  date: string;
  meeting?: Meeting | null;
  onBack?: () => void;
  onSend?: (recipients: Array<{ id: string; name: string; email: string }>) => Promise<void>;
  onDone?: () => void;
  isSending?: boolean;
}

export default function SendScreen({
  buildingName,
  date,
  meeting,
  onBack,
  onSend,
  onDone,
  isSending: externalIsSending = false,
}: SendScreenProps) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [subject, setSubject] = useState(
    `Acta de Junta Ordinaria - ${buildingName} - ${date}`
  );
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    if (meeting?.recipients && Array.isArray(meeting.recipients)) {
      const existingRecipients = (meeting.recipients as EmailRecipient[]).map(r => ({
        id: r.id,
        email: r.email,
        name: r.name,
      }));
      setRecipients(existingRecipients);
    }
    
    if (meeting?.status === "sent") {
      setIsSent(true);
    }
  }, [meeting?.recipients, meeting?.status]);

  const handleSend = async () => {
    setIsSending(true);
    try {
      const formattedRecipients = recipients.map(r => ({
        id: r.id,
        name: r.name || "",
        email: r.email,
      }));
      await onSend?.(formattedRecipients);
      setIsSent(true);
    } catch (error) {
      console.error("Error sending:", error);
    } finally {
      setIsSending(false);
    }
  };

  const isLoading = isSending || externalIsSending;

  if (isSent) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl tracking-tight">Acta</span>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <SuccessAnimation />
            <Button
              size="lg"
              onClick={onDone}
              className="mt-8 h-12 px-8"
              data-testid="button-done"
            >
              Volver al inicio
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
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
              <h1 className="font-semibold">Enviar Acta</h1>
              <p className="text-sm text-muted-foreground">{buildingName}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <Card className="shadow-lg overflow-hidden" data-testid="card-pdf-preview">
          <div className="bg-primary/5 p-6 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Acta_Junta_Ordinaria.pdf</h3>
                <p className="text-sm text-muted-foreground">
                  {buildingName} • {date}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2" data-testid="button-download-pdf">
              <Download className="w-4 h-4" />
              Descargar
            </Button>
          </div>
          <CardContent className="p-6">
            <div className="aspect-[8.5/11] bg-white rounded-lg border shadow-inner overflow-auto p-4">
              {meeting?.actaContent ? (
                <pre className="whitespace-pre-wrap font-sans text-xs text-gray-800" data-testid="text-acta-preview">
                  {meeting.actaContent}
                </pre>
              ) : (
                <p className="text-muted-foreground text-sm text-center mt-20">
                  Vista previa del documento PDF
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="recipients" className="text-base font-medium">
              Destinatarios
            </Label>
            <EmailRecipients
              recipients={recipients}
              onChange={setRecipients}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject" className="text-base font-medium">
              Asunto del correo
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-12 text-base"
              data-testid="input-email-subject"
            />
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            onClick={handleSend}
            disabled={recipients.length === 0 || isLoading}
            className="h-14 px-10 text-base font-semibold bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
            data-testid="button-send-acta"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Enviar Acta
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
