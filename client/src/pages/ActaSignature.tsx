import { useState, useEffect, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, FileSignature, Mail, Trash2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import type { Meeting } from "@shared/schema";

interface Point {
  x: number;
  y: number;
}

export default function ActaSignature() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/acta/:id/signature");
  const actaId = params?.id;
  const { toast } = useToast();

  const [autoSign, setAutoSign] = useState(true);
  const [presidentName, setPresidentName] = useState("Presidente");
  const [secretaryName, setSecretaryName] = useState("Secretaria");
  const [showSignaturePads, setShowSignaturePads] = useState(false);
  const [presidentSigned, setPresidentSigned] = useState(false);
  const [secretarySigned, setSecretarySigned] = useState(false);
  const [isDrawingPresident, setIsDrawingPresident] = useState(false);
  const [isDrawingSecretary, setIsDrawingSecretary] = useState(false);

  // Canvas refs
  const presidentCanvasRef = useRef<HTMLCanvasElement>(null);
  const secretaryCanvasRef = useRef<HTMLCanvasElement>(null);
  const presidentCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const secretaryCtxRef = useRef<CanvasRenderingContext2D | null>(null);

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

  // Initialize canvases
  useEffect(() => {
    if (!showSignaturePads) return;

    const initCanvas = (canvasRef: React.RefObject<HTMLCanvasElement>, ctxRef: React.MutableRefObject<CanvasRenderingContext2D | null>) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctxRef.current = ctx;
    };

    initCanvas(presidentCanvasRef, presidentCtxRef);
    initCanvas(secretaryCanvasRef, secretaryCtxRef);
  }, [showSignaturePads]);

  // Save signatures mutation
  const saveSignaturesMutation = useMutation({
    mutationFn: async ({
      presidentSignature,
      secretarySignature,
      presidentName,
      secretaryName,
    }: {
      presidentSignature: string;
      secretarySignature: string;
      presidentName: string;
      secretaryName: string;
    }) => {
      const res = await apiRequest("POST", `/api/meetings/${actaId}/save-signatures`, {
        presidentSignature,
        secretarySignature,
        presidentName,
        secretaryName,
      });
      return res.json();
    },
    onSuccess: async () => {
      // Invalidate and refetch to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ["/api/meetings", actaId] });
      await queryClient.refetchQueries({ queryKey: ["/api/meetings", actaId] });

      toast({
        title: "¡Acta firmada!",
        description: "Las firmas se han guardado correctamente",
      });

      // Small delay to ensure cache is updated
      setTimeout(() => {
        navigate(`/acta/${actaId}/send`);
      }, 100);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron guardar las firmas",
        variant: "destructive",
      });
    },
  });

  const handleBack = () => {
    navigate(`/acta/${actaId}`);
  };

  const handleSignNow = async () => {
    if (!presidentName.trim() || !secretaryName.trim()) {
      toast({
        title: "Nombres requeridos",
        description: "Por favor ingresa los nombres del presidente y secretaria",
        variant: "destructive",
      });
      return;
    }

    setShowSignaturePads(true);
  };

  // Drawing functions
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvasRef: React.RefObject<HTMLCanvasElement>): Point | null => {
    if (!canvasRef.current) return null;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, type: "president" | "secretary") => {
    e.preventDefault();
    const canvasRef = type === "president" ? presidentCanvasRef : secretaryCanvasRef;
    const ctxRef = type === "president" ? presidentCtxRef : secretaryCtxRef;
    const point = getCoordinates(e, canvasRef);

    if (!point || !ctxRef.current) return;

    if (type === "president") {
      setIsDrawingPresident(true);
    } else {
      setIsDrawingSecretary(true);
    }

    ctxRef.current.beginPath();
    ctxRef.current.moveTo(point.x, point.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, type: "president" | "secretary") => {
    e.preventDefault();
    const isDrawing = type === "president" ? isDrawingPresident : isDrawingSecretary;
    if (!isDrawing) return;

    const canvasRef = type === "president" ? presidentCanvasRef : secretaryCanvasRef;
    const ctxRef = type === "president" ? presidentCtxRef : secretaryCtxRef;
    const point = getCoordinates(e, canvasRef);

    if (!point || !ctxRef.current) return;

    ctxRef.current.lineTo(point.x, point.y);
    ctxRef.current.stroke();
  };

  const stopDrawing = (type: "president" | "secretary") => {
    const isDrawing = type === "president" ? isDrawingPresident : isDrawingSecretary;

    if (isDrawing) {
      if (type === "president") {
        setIsDrawingPresident(false);
        setPresidentSigned(true);
      } else {
        setIsDrawingSecretary(false);
        setSecretarySigned(true);
      }
    }
  };

  const handleSaveSignatures = async () => {
    if (!presidentCanvasRef.current || !secretaryCanvasRef.current) return;

    if (!presidentSigned || !secretarySigned) {
      toast({
        title: "Firmas incompletas",
        description: "Por favor, ambas personas deben firmar",
        variant: "destructive",
      });
      return;
    }

    // Get signatures as base64 data URLs
    const presidentSignature = presidentCanvasRef.current.toDataURL("image/png");
    const secretarySignature = secretaryCanvasRef.current.toDataURL("image/png");

    await saveSignaturesMutation.mutateAsync({
      presidentSignature,
      secretarySignature,
      presidentName,
      secretaryName,
    });
  };

  const handleClearSignature = (type: "president" | "secretary") => {
    const canvasRef = type === "president" ? presidentCanvasRef : secretaryCanvasRef;
    const ctxRef = type === "president" ? presidentCtxRef : secretaryCtxRef;

    if (!canvasRef.current || !ctxRef.current) return;

    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (type === "president") {
      setPresidentSigned(false);
    } else {
      setSecretarySigned(false);
    }
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

  // If showing signature pads
  if (showSignaturePads) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <PageHeader
          title="Firmar Acta"
          subtitle={meeting.buildingName}
          onBack={() => setShowSignaturePads(false)}
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">📝 Instrucciones</p>
              <p>Pasa el dispositivo al presidente y secretaria para que firmen directamente en la pantalla.</p>
            </div>

            {/* President Signature */}
            <div className="bg-card rounded-lg border border-border p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Firma del Presidente</Label>
                  <p className="text-sm text-muted-foreground">{presidentName}</p>
                </div>
                {presidentSigned && (
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="w-5 h-5" />
                    <span className="text-sm font-medium">Firmado</span>
                  </div>
                )}
              </div>

              <div className="relative">
                <canvas
                  ref={presidentCanvasRef}
                  width={600}
                  height={200}
                  className="w-full border-2 border-dashed border-border rounded-lg cursor-crosshair"
                  style={{ touchAction: "none", userSelect: "none" }}
                  onMouseDown={(e) => startDrawing(e, "president")}
                  onMouseMove={(e) => draw(e, "president")}
                  onMouseUp={() => stopDrawing("president")}
                  onMouseLeave={() => stopDrawing("president")}
                  onTouchStart={(e) => startDrawing(e, "president")}
                  onTouchMove={(e) => draw(e, "president")}
                  onTouchEnd={() => stopDrawing("president")}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleClearSignature("president")}
                  className="absolute top-2 right-2"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Borrar
                </Button>
              </div>
            </div>

            {/* Secretary Signature */}
            <div className="bg-card rounded-lg border border-border p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Firma de la Secretaria</Label>
                  <p className="text-sm text-muted-foreground">{secretaryName}</p>
                </div>
                {secretarySigned && (
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="w-5 h-5" />
                    <span className="text-sm font-medium">Firmado</span>
                  </div>
                )}
              </div>

              <div className="relative">
                <canvas
                  ref={secretaryCanvasRef}
                  width={600}
                  height={200}
                  className="w-full border-2 border-dashed border-border rounded-lg cursor-crosshair"
                  style={{ touchAction: "none", userSelect: "none" }}
                  onMouseDown={(e) => startDrawing(e, "secretary")}
                  onMouseMove={(e) => draw(e, "secretary")}
                  onMouseUp={() => stopDrawing("secretary")}
                  onMouseLeave={() => stopDrawing("secretary")}
                  onTouchStart={(e) => startDrawing(e, "secretary")}
                  onTouchMove={(e) => draw(e, "secretary")}
                  onTouchEnd={() => stopDrawing("secretary")}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleClearSignature("secretary")}
                  className="absolute top-2 right-2"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Borrar
                </Button>
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSaveSignatures}
              disabled={!presidentSigned || !secretarySigned || saveSignaturesMutation.isPending}
              className="w-full h-14 text-lg font-bold"
            >
              {saveSignaturesMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Guardando firmas...
                </>
              ) : (
                <>
                  <FileSignature className="w-5 h-5 mr-2" />
                  Guardar firmas y continuar
                </>
              )}
            </Button>
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

            {/* Name inputs */}
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
              </motion.div>
            )}

            {/* Action buttons */}
            <div className="space-y-4 pt-4">
              {autoSign ? (
                <>
                  {/* Primary: Sign now */}
                  <Button
                    onClick={handleSignNow}
                    className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                  >
                    <FileSignature className="w-5 h-5 mr-2" />
                    Firmar y cerrar ahora
                  </Button>

                  {/* Secondary: Send by email */}
                  <button
                    onClick={handleSendByEmail}
                    className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors underline"
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
