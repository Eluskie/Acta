import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface TranscriptParagraph {
  id: string;
  timestamp: string;
  speaker?: string;
  text: string;
}

interface TranscriptEditorProps {
  paragraphs: TranscriptParagraph[];
  onChange?: (paragraphs: TranscriptParagraph[]) => void;
  className?: string;
}

export default function TranscriptEditor({
  paragraphs,
  onChange,
  className,
}: TranscriptEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleTextChange = (id: string, newText: string) => {
    const updated = paragraphs.map((p) =>
      p.id === id ? { ...p, text: newText } : p
    );
    onChange?.(updated);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {paragraphs.map((paragraph) => (
        <div
          key={paragraph.id}
          className="group"
          data-testid={`transcript-paragraph-${paragraph.id}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground font-mono">
              {paragraph.timestamp}
            </span>
            {paragraph.speaker && (
              <span className="text-xs font-medium text-primary">
                {paragraph.speaker}
              </span>
            )}
          </div>
          
          {editingId === paragraph.id ? (
            <Textarea
              value={paragraph.text}
              onChange={(e) => handleTextChange(paragraph.id, e.target.value)}
              onBlur={() => setEditingId(null)}
              className="min-h-[80px] text-base leading-relaxed"
              autoFocus
              data-testid={`input-transcript-${paragraph.id}`}
            />
          ) : (
            <p
              className="text-base leading-relaxed cursor-pointer hover:bg-muted/50 rounded-md p-2 -m-2 transition-colors"
              onClick={() => setEditingId(paragraph.id)}
              data-testid={`text-transcript-${paragraph.id}`}
            >
              {paragraph.text}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
