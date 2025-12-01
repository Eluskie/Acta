import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, FileText, Download } from "lucide-react";
import { motion } from "framer-motion";
import EmailRecipients, { type Recipient } from "@/components/EmailRecipients";
import PageHeader from "@/components/PageHeader";
import type { Meeting, EmailRecipient } from "@shared/schema";

interface SendScreenProps {
  buildingName: string;
  meeting?: Meeting | null;
  onBack?: () => void;
  onSend?: (recipients: Array<{ id: string; name: string; email: string }>, subject: string, message: string) => Promise<void>;
  onDone?: () => void;
}

export default function SendScreen({
  buildingName,
  meeting,
  onBack,
  onSend,
  onDone,
}: SendScreenProps) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [subject, setSubject] = useState(
    `Acta Oficial - ${buildingName} - ${new Date().toLocaleDateString("es-ES")}`
  );
  const [message, setMessage] = useState(
    "Adjunto encontrarán el acta oficial de la reunión realizada el día de hoy. Por favor revisar y confirmar recepción."
  );
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

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

  const handleSend = async () => {
    setIsSending(true);
    try {
      const formattedRecipients = recipients.map(r => ({
        id: r.id,
        name: r.name || r.email.split("@")[0],
        email: r.email,
      }));
      await onSend?.(formattedRecipients, subject, message);
      setIsSending(false);
      setSentSuccess(true);
      setTimeout(() => {
        onDone?.();
      }, 2500);
    } catch (error) {
      setIsSending(false);
      console.error("Error sending:", error);
    }
  };

  if (sentSuccess) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <PageHeader
          title="Acta Enviada"
          subtitle={buildingName}
        />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="max-w-md w-full text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="w-20 h-20 md:w-24 md:h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 mx-auto text-green-600 dark:text-green-500"
            >
              <Check className="w-10 h-10 md:w-12 md:h-12" strokeWidth={3} />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl md:text-3xl font-bold text-foreground mb-3"
            >
              ¡Acta Enviada!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground text-base md:text-lg mb-8"
            >
              Los destinatarios recibirán el documento en breve.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                onClick={onDone}
                variant="outline"
                className="w-full md:w-auto px-8"
              >
                Volver al Inicio
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  const handleDownload = async () => {
    if (!meeting?.id) return;

    try {
      // Call server endpoint to generate PDF
      const response = await fetch(`/api/meetings/${meeting.id}/download-pdf`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Get the PDF blob from response
      const blob = await response.blob();

      // Generate proper filename
      const fileName = `Acta_${buildingName.replace(/\s+/g, '_')}_${meeting.id}.pdf`;

      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      a.setAttribute('download', fileName); // Ensure download attribute is set

      document.body.appendChild(a);
      a.click();

      // Cleanup after a short delay to ensure download starts
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <PageHeader
        title="Enviar Acta Oficial"
        subtitle="Revisa los destinatarios antes de enviar el documento final"
        onBack={onBack}
      />

      {/* Content */}
      <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left: Form */}
          <div className="space-y-6 bg-card p-6 md:p-8 rounded-2xl shadow-sm border border-border/50">
            <div className="space-y-3">
              <Label className="text-foreground font-semibold text-base">
                Destinatarios
              </Label>
              <EmailRecipients
                recipients={recipients}
                onChange={setRecipients}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="subject" className="text-foreground font-semibold text-base">
                Asunto
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="message" className="text-foreground font-semibold text-base">
                Mensaje
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="text-base resize-none leading-relaxed"
              />
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleSend}
                disabled={isSending || recipients.length === 0}
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
              >
                {isSending ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    Enviando...
                  </>
                ) : (
                  <>
                    <motion.svg
                      className="w-5 h-5 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      whileHover={{
                        x: [0, 3, 0],
                        y: [0, -3, 0],
                        transition: { duration: 0.5, ease: "easeInOut" }
                      }}
                      animate={{
                        x: [0, 2, 0],
                        y: [0, -2, 0],
                        transition: {
                          repeat: Infinity,
                          duration: 2,
                          ease: "easeInOut",
                          repeatDelay: 1
                        }
                      }}
                    >
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </motion.svg>
                    Enviar acta por correo
                  </>
                )}
              </Button>

              {/* Download button - Mobile */}
              <Button
                onClick={handleDownload}
                variant="outline"
                className="w-full h-12 text-base font-semibold lg:hidden"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </Button>
            </div>
          </div>

          {/* Right: PDF Preview */}
          <div className="hidden lg:flex flex-col items-center justify-center border border-border/60 rounded-2xl bg-muted/30 p-8">
            <motion.div
              whileHover={{ y: -5 }}
              className="relative w-full max-w-[320px] aspect-[1/1.414] bg-background shadow-2xl shadow-foreground/10 rounded-lg overflow-hidden border border-border flex flex-col"
            >
              <div className="h-3 bg-primary"></div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="space-y-3 mb-6">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted/60 rounded w-1/2"></div>
                </div>
                <div className="space-y-2 flex-1">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="h-2 bg-muted/60 rounded w-full"></div>
                  ))}
                </div>
                <div className="mt-auto pt-6 border-t border-border/50 flex justify-between">
                  <div className="h-2 bg-muted/60 rounded w-16"></div>
                  <div className="h-2 bg-muted/60 rounded w-16"></div>
                </div>
              </div>
            </motion.div>
            <div className="mt-6 flex items-center gap-3 text-muted-foreground">
              <FileText className="w-5 h-5" />
              <div>
                <p className="font-medium text-foreground">Acta_{buildingName}.pdf</p>
                <p className="text-sm">Documento oficial</p>
              </div>
            </div>

            {/* Download button - Desktop */}
            <Button
              onClick={handleDownload}
              variant="outline"
              className="mt-6 w-full max-w-[320px] h-11 font-semibold"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
