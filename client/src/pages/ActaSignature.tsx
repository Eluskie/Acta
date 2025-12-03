import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, FileSignature, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import type { Meeting } from "@shared/schema";
import posthog from "posthog-js";

export default function ActaSignature() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/acta/:id/signature");
  const actaId = params?.id;
  const { toast } = useToast();

  const [autoSign, setAutoSign] = useState(true);
  const [presidentName, setPresidentName] = useState("");
  const [secretaryName, setSecretaryName] = useState("");
  const [presidentEmail, setPresidentEmail] = useState("");
  const [secretaryEmail, setSecretaryEmail] = useState("");
  const [docusealEmbedUrl, setDocusealEmbedUrl] = useState<string | null>(null);

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

  // Request DocuSeal signatures mutation
  const requestSignatureMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/meetings/${actaId}/request-signature`, {
        presidentEmail: presidentEmail.trim(),
        secretaryEmail: secretaryEmail.trim(),
      });
      return res.json();
    },
    onSuccess: (data) => {
      // Set the embed URL to show DocuSeal iframe
      setDocusealEmbedUrl(data.embedUrl);

      toast({
        title: "¡Solicitud de firma creada!",
        description: "Ahora pueden firmar en DocuSeal",
      });
      posthog.capture('minute_signed', {
        meeting_id: actaId,
        building_name: meeting?.buildingName,
        method: 'docuseal',
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear la solicitud de firma",
        variant: "destructive",
      });
    },
  });

  const handleBack = () => {
    navigate(`/acta/${actaId}`);
  };

  const handleSignNow = async () => {
    // Validate inputs
    if (!presidentName.trim() || !secretaryName.trim()) {
      toast({
        title: "Nombres requeridos",
        description: "Por favor ingresa los nombres del presidente y secretaria",
        variant: "destructive",
      });
      return;
    }

    if (!presidentEmail.trim() || !secretaryEmail.trim()) {
      toast({
        title: "Emails requeridos",
        description: "Por favor ingresa los emails del presidente y secretaria",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(presidentEmail.trim()) || !emailRegex.test(secretaryEmail.trim())) {
      toast({
        title: "Emails inválidos",
        description: "Por favor ingresa emails válidos",
        variant: "destructive",
      });
      return;
    }

    // Request signature from DocuSeal
    await requestSignatureMutation.mutateAsync();
  };

  const handleSendByEmail = () => {
    // Skip signature and go directly to send page
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

  // If DocuSeal embed URL is available, show the iframe
  if (docusealEmbedUrl) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <PageHeader
          title="Firmar Acta con DocuSeal"
          subtitle={meeting.buildingName}
          onBack={() => setDocusealEmbedUrl(null)}
        />

        <div className="flex-1 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full"
          >
            {/* Instructions */}
            <div className="bg-blue-50 border-b border-blue-200 p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">📝 Firmar en DocuSeal</p>
              <p>{presidentName} ({presidentEmail}) y {secretaryName} ({secretaryEmail}) deben firmar el documento.</p>
            </div>

            {/* DocuSeal iframe */}
            <iframe
              src={docusealEmbedUrl}
              className="w-full h-[calc(100vh-200px)] border-0"
              title="DocuSeal Signature"
              allow="camera; microphone"
            />

            {/* Actions */}
            <div className="p-4 border-t border-border bg-card">
              <Button
                onClick={() => navigate(`/acta/${actaId}/send`)}
                className="w-full"
              >
                Ir a Enviar Acta
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader
        title="Firmar Acta"
        subtitle={meeting.buildingName}
        onBack={handleBack}
      />

      <div className="flex-1 flex items-center justify-center p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full"
        >
          <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-6 md:p-10 space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileSignature className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                ¡Acta generada correctamente!
              </h2>
              <p className="text-muted-foreground text-base md:text-lg">
                Por qué firmar ahora es mejor: el 90% de las veces el presidente y secretario están juntos.
                Cierran ya y se olvidan. ¡Sin perseguir firmas después!
              </p>
            </div>

            {/* Auto-sign checkbox */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="auto-sign"
                  checked={autoSign}
                  onCheckedChange={(checked) => setAutoSign(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="auto-sign"
                    className="text-sm font-semibold text-foreground cursor-pointer"
                  >
                    Firmar automáticamente al generar el acta (recomendado)
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    La mejor opción: ambos firman ahora y el acta queda cerrada al instante
                  </p>
                </div>
              </div>
            </div>

            {/* Name and email inputs */}
            {autoSign && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="president-name" className="text-base font-semibold">
                    Nombre del Presidente
                  </Label>
                  <Input
                    id="president-name"
                    type="text"
                    placeholder="Juan Pérez"
                    value={presidentName}
                    onChange={(e) => setPresidentName(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="president-email" className="text-base font-semibold">
                    Email del Presidente
                  </Label>
                  <Input
                    id="president-email"
                    type="email"
                    placeholder="juan.perez@ejemplo.com"
                    value={presidentEmail}
                    onChange={(e) => setPresidentEmail(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secretary-name" className="text-base font-semibold">
                    Nombre de la Secretaria
                  </Label>
                  <Input
                    id="secretary-name"
                    type="text"
                    placeholder="María García"
                    value={secretaryName}
                    onChange={(e) => setSecretaryName(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secretary-email" className="text-base font-semibold">
                    Email de la Secretaria
                  </Label>
                  <Input
                    id="secretary-email"
                    type="email"
                    placeholder="maria.garcia@ejemplo.com"
                    value={secretaryEmail}
                    onChange={(e) => setSecretaryEmail(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>
              </motion.div>
            )}

            {/* Action buttons */}
            <div className="space-y-4 pt-4">
              {autoSign ? (
                <>
                  {/* Primary: Sign now */}
                  <Button
                    onClick={handleSignNow}
                    disabled={
                      !presidentName.trim() ||
                      !presidentEmail.trim() ||
                      !secretaryName.trim() ||
                      !secretaryEmail.trim() ||
                      requestSignatureMutation.isPending
                    }
                    className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                  >
                    {requestSignatureMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Preparando DocuSeal...
                      </>
                    ) : (
                      <>
                        <FileSignature className="w-5 h-5 mr-2" />
                        Firmar con DocuSeal
                      </>
                    )}
                  </Button>

                  {/* Secondary: Send by email */}
                  <button
                    onClick={handleSendByEmail}
                    className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors underline"
                    disabled={requestSignatureMutation.isPending}
                  >
                    Enviar por email para firmar más tarde
                  </button>
                </>
              ) : (
                <Button
                  onClick={handleSendByEmail}
                  className="w-full h-14 text-lg font-bold"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Continuar sin firmar
                </Button>
              )}
            </div>

            {/* Info box */}
            <div className="bg-muted/50 border border-border rounded-lg p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground mb-2">💡 Recomendación profesional</p>
              <p>
                El 90% de los administradores de fincas prefieren cerrar el acta el mismo día.
                Firmar ahora evita recordatorios y garantiza que el documento quede legalizado al instante.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
