import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, FileText, Download, Loader2, FileSignature, Plus, Edit } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import EmailRecipients, { type Recipient } from "@/components/EmailRecipients";
import PageHeader from "@/components/PageHeader";
import SignatureModal from "@/components/SignatureModal";
import type { Meeting, EmailRecipient } from "@shared/schema";

export default function ActaSend() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/acta/:id/send");
  const actaId = params?.id;
  const { toast } = useToast();

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState(
    "Adjunto encontrarán el acta oficial de la reunión realizada el día de hoy. Por favor revisar y confirmar recepción."
  );
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

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

  // Initialize subject when meeting loads
  useEffect(() => {
    if (meeting) {
      setSubject(`Acta Oficial - ${meeting.buildingName} - ${new Date().toLocaleDateString("es-ES")}`);
      
      // Load existing recipients if any
      if (meeting.recipients && Array.isArray(meeting.recipients)) {
        const existingRecipients = (meeting.recipients as EmailRecipient[]).map(r => ({
          id: r.id,
          email: r.email,
          name: r.name,
        }));
        setRecipients(existingRecipients);
      }
    }
  }, [meeting]);

  // Save single signature mutation
  const saveSignatureMutation = useMutation({
    mutationFn: async ({
      signature,
      name,
      type,
    }: {
      signature: string;
      name: string;
      type: "president" | "secretary";
    }) => {
      const updateData: any = {};
      if (type === "president") {
        updateData.presidentSignature = signature;
        updateData.presidentName = name;
      } else {
        updateData.secretarySignature = signature;
        updateData.secretaryName = name;
      }

      // Check if both signatures are present to update status
      const currentMeeting = meeting;
      if (currentMeeting) {
        const hasPresident = type === "president" || currentMeeting.presidentSignature;
        const hasSecretary = type === "secretary" || currentMeeting.secretarySignature;

        if (hasPresident && hasSecretary) {
          updateData.signatureStatus = "signed";
          updateData.signedAt = new Date();
        }
      }

      const res = await apiRequest("PATCH", `/api/meetings/${actaId}`, updateData);
      return res.json();
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
        description: error instanceof Error ? error.message : "No se pudo guardar la firma",
        variant: "destructive",
      });
    },
  });

  // Send acta mutation
  const sendActaMutation = useMutation({
    mutationFn: async ({
      recipients,
      subject,
      message
    }: {
      recipients: Array<{ id: string; name: string; email: string }>;
      subject: string;
      message: string;
    }) => {
      const res = await apiRequest("POST", `/api/meetings/${actaId}/send`, {
        recipients,
        subject,
        message,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({
        title: "Acta enviada",
        description: "El acta ha sido enviada correctamente a todos los destinatarios",
      });
    },
    onError: (error) => {
      toast({
        title: "Error enviando acta",
        description: error instanceof Error ? error.message : "No se pudo enviar el acta",
        variant: "destructive",
      });
    },
  });

  const handleBack = () => {
    navigate(`/acta/${actaId}`);
  };

  const handleDone = () => {
    navigate("/");
  };

  const handleSaveAsDraft = async () => {
    if (recipients.length === 0) {
      // Just go back if no recipients
      navigate("/");
      return;
    }

    try {
      // Save recipients without sending
      const formattedRecipients = recipients.map(r => ({
        id: r.id,
        name: r.name || r.email.split("@")[0],
        email: r.email,
      }));

      await apiRequest("PATCH", `/api/meetings/${actaId}`, {
        recipients: formattedRecipients,
      });

      toast({
        title: "Borrador guardado",
        description: "Los destinatarios han sido guardados. Puedes enviar el acta más tarde.",
      });

      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el borrador",
        variant: "destructive",
      });
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    try {
      const formattedRecipients = recipients.map(r => ({
        id: r.id,
        name: r.name || r.email.split("@")[0],
        email: r.email,
      }));
      await sendActaMutation.mutateAsync({
        recipients: formattedRecipients,
        subject,
        message,
      });
      setIsSending(false);
      setSentSuccess(true);
      setTimeout(() => {
        handleDone();
      }, 2500);
    } catch (error) {
      setIsSending(false);
      console.error("Error sending:", error);
    }
  };

  const handleOpenSignatureModal = (type: "president" | "secretary") => {
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
  };

  const handleDownload = async () => {
    if (!actaId || !meeting) return;

    try {
      const response = await fetch(`/api/meetings/${actaId}/download-pdf`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();

      const dateStr = new Date(meeting.date).toLocaleDateString('es-ES').replace(/\//g, '-');
      const cleanBuildingName = meeting.buildingName.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '').replace(/\s+/g, '_');
      const fileName = `Acta_${cleanBuildingName}_${dateStr}.pdf`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Error",
        description: "No se pudo descargar el PDF",
        variant: "destructive",
      });
    }
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
                onClick={handleDone}
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <PageHeader
        title="Enviar Acta Oficial"
        subtitle="Revisa los destinatarios antes de enviar el documento final"
        onBack={handleBack}
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

            {/* Action Buttons - Reorganized for clarity */}
            <div className="space-y-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground font-medium">
                Acciones disponibles:
              </p>

              {/* Primary: Send Email */}
              <Button
                onClick={handleSend}
                disabled={isSending || recipients.length === 0}
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
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
                    >
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </motion.svg>
                    Enviar por correo
                  </>
                )}
              </Button>

              {/* Secondary: Download PDF - Mobile Only */}
              <Button
                onClick={handleDownload}
                variant="outline"
                className="w-full h-12 text-base font-semibold lg:hidden"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </Button>

              {/* Tertiary: Save as Draft */}
              <Button
                onClick={handleSaveAsDraft}
                variant="ghost"
                className="w-full h-12 text-base font-medium text-muted-foreground hover:text-foreground"
              >
                Guardar y volver más tarde
              </Button>
            </div>
          </div>

          {/* Right: Signatures or PDF Preview */}
          <div className="hidden lg:flex flex-col items-center justify-center border border-border/60 rounded-2xl bg-muted/30 p-8">
            {/* Signatures Section - Replaces document preview */}
            <div className="w-full max-w-[320px] space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <FileSignature className="w-4 h-4" />
                Firmas
              </div>

              {/* President Signature */}
              <div className="border border-border rounded-lg p-3 bg-background">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Presidente</span>
                  {meeting.presidentSignature && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                </div>

                {meeting.presidentSignature ? (
                  <>
                    <img
                      src={meeting.presidentSignature}
                      alt="Firma Presidente"
                      className="w-full h-16 object-contain border border-border/50 rounded bg-white"
                    />
                    <p className="text-xs text-foreground font-medium mt-2">
                      {meeting.presidentName || "Presidente"}
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenSignatureModal("president")}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Añadir firma
                  </Button>
                )}
              </div>

              {/* Secretary Signature */}
              <div className="border border-border rounded-lg p-3 bg-background">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Secretaria</span>
                  {meeting.secretarySignature && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                </div>

                {meeting.secretarySignature ? (
                  <>
                    <img
                      src={meeting.secretarySignature}
                      alt="Firma Secretaria"
                      className="w-full h-16 object-contain border border-border/50 rounded bg-white"
                    />
                    <p className="text-xs text-foreground font-medium mt-2">
                      {meeting.secretaryName || "Secretaria"}
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenSignatureModal("secretary")}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Añadir firma
                  </Button>
                )}
              </div>

              {/* Document Info */}
              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <FileText className="w-5 h-5" />
                  <div>
                    <p className="font-medium text-foreground text-sm">Acta_{buildingName}.pdf</p>
                    <p className="text-xs">
                      {meeting.signatureStatus === "signed" ? "Con firmas" : "Sin firmar"}
                    </p>
                  </div>
                </div>
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



