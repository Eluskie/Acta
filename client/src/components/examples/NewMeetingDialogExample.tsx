import { useState } from "react";
import { Button } from "@/components/ui/button";
import NewMeetingDialog from "../NewMeetingDialog";

export default function NewMeetingDialogExample() {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Abrir diálogo</Button>
      <NewMeetingDialog
        open={open}
        onOpenChange={setOpen}
        onStartRecording={(data) => console.log("Start recording:", data)}
      />
    </div>
  );
}
