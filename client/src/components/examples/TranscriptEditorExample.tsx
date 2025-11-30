import { useState } from "react";
import TranscriptEditor, { type TranscriptParagraph } from "../TranscriptEditor";

const mockParagraphs: TranscriptParagraph[] = [
  {
    id: "1",
    timestamp: "00:00",
    speaker: "Presidente",
    text: "Buenos días a todos. Damos comienzo a la reunión ordinaria de la comunidad de propietarios del edificio Alameda 42.",
  },
  {
    id: "2",
    timestamp: "00:15",
    speaker: "Secretario",
    text: "Confirmo que hay quórum suficiente con 12 propietarios presentes que representan el 65% de las cuotas de participación.",
  },
  {
    id: "3",
    timestamp: "00:32",
    speaker: "Presidente",
    text: "Perfecto. El primer punto del orden del día es la aprobación del acta de la reunión anterior celebrada el 15 de octubre.",
  },
];

export default function TranscriptEditorExample() {
  const [paragraphs, setParagraphs] = useState(mockParagraphs);

  return (
    <div className="max-w-2xl bg-card p-6 rounded-lg border">
      <h3 className="font-semibold mb-4">Transcripción</h3>
      <TranscriptEditor paragraphs={paragraphs} onChange={setParagraphs} />
    </div>
  );
}
