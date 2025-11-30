import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Users, Mic } from "lucide-react";

interface NewMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartRecording?: (data: { buildingName: string; attendeesCount: number }) => void;
}

export default function NewMeetingDialog({
  open,
  onOpenChange,
  onStartRecording,
}: NewMeetingDialogProps) {
  const [buildingName, setBuildingName] = useState("");
  const [attendeesCount, setAttendeesCount] = useState("");

  const handleStart = () => {
    if (buildingName && attendeesCount) {
      onStartRecording?.({
        buildingName,
        attendeesCount: parseInt(attendeesCount, 10),
      });
      setBuildingName("");
      setAttendeesCount("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Nueva Reunión</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="building" className="text-base">
              Nombre del edificio o comunidad
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="building"
                value={buildingName}
                onChange={(e) => setBuildingName(e.target.value)}
                placeholder="Ej: Comunidad Edificio Alameda 42"
                className="pl-11 h-12 text-base"
                data-testid="input-building-name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attendees" className="text-base">
              Número de asistentes
            </Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="attendees"
                type="number"
                min="1"
                value={attendeesCount}
                onChange={(e) => setAttendeesCount(e.target.value)}
                placeholder="Ej: 12"
                className="pl-11 h-12 text-base"
                data-testid="input-attendees-count"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleStart}
            disabled={!buildingName || !attendeesCount}
            className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
            data-testid="button-start-recording"
          >
            <Mic className="w-4 h-4" />
            Comenzar grabación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
