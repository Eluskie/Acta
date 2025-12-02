import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Check, Loader2 } from "lucide-react";

interface SignatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  defaultName?: string;
  onSave: (signature: string, name: string) => void | Promise<void>;
  isSaving?: boolean;
}

interface Point {
  x: number;
  y: number;
}

export default function SignatureModal({
  open,
  onOpenChange,
  title,
  description,
  defaultName = "",
  onSave,
  isSaving = false,
}: SignatureModalProps) {
  const [name, setName] = useState(defaultName);
  const [hasSigned, setHasSigned] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Initialize canvas when dialog opens
  useEffect(() => {
    if (!open || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Set up canvas context
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Clear canvas with white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctxRef.current = ctx;
  }, [open]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setName(defaultName);
      setHasSigned(false);
      setIsDrawing(false);
    }
  }, [open, defaultName]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point | null => {
    if (!canvasRef.current) return null;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      // Touch event
      if (e.touches.length === 0) return null;
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      // Mouse event
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const point = getCoordinates(e);
    if (!point || !ctxRef.current) return;

    setIsDrawing(true);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(point.x, point.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const point = getCoordinates(e);
    if (!point || !ctxRef.current) return;

    ctxRef.current.lineTo(point.x, point.y);
    ctxRef.current.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setHasSigned(true);
    }
  };

  const handleClear = () => {
    if (!canvasRef.current || !ctxRef.current) return;

    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    // Clear and reset with white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setHasSigned(false);
  };

  const handleSave = async () => {
    if (!canvasRef.current || !hasSigned) return;

    const signatureData = canvasRef.current.toDataURL("image/png");
    await onSave(signatureData, name.trim() || defaultName);
  };

  const canSave = hasSigned && name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="signer-name">Nombre completo</Label>
            <Input
              id="signer-name"
              placeholder="Ej: Juan Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11"
            />
          </div>

          {/* Signature Canvas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Firmar aquí</Label>
              {hasSigned && (
                <div className="flex items-center gap-1.5 text-xs text-green-600">
                  <Check className="w-3.5 h-3.5" />
                  <span>Firmado</span>
                </div>
              )}
            </div>

            <div className="relative">
              <canvas
                ref={canvasRef}
                width={536}
                height={200}
                className="w-full border-2 border-dashed border-border rounded-lg bg-white cursor-crosshair"
                style={{
                  touchAction: "none",
                  userSelect: "none",
                }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {hasSigned && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="absolute top-2 right-2 z-10"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Borrar
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Dibuja tu firma con el ratón o con el dedo en pantallas táctiles
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar firma"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
