import { useState, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Recipient {
  id: string;
  email: string;
  name?: string;
}

interface EmailRecipientsProps {
  recipients: Recipient[];
  onChange?: (recipients: Recipient[]) => void;
  className?: string;
}

export default function EmailRecipients({
  recipients,
  onChange,
  className,
}: EmailRecipientsProps) {
  const [inputValue, setInputValue] = useState("");

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const addEmail = (email: string) => {
    const trimmedEmail = email.trim().replace(/[,\s]$/, "");
    if (trimmedEmail && validateEmail(trimmedEmail)) {
      const newRecipient: Recipient = {
        id: Date.now().toString(),
        email: trimmedEmail,
        name: trimmedEmail.split("@")[0],
      };
      onChange?.([...recipients, newRecipient]);
      setInputValue("");
      return true;
    }
    return false;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Enter, Space, or Comma adds the email
    if (e.key === "Enter" || e.key === " " || e.key === ",") {
      e.preventDefault();
      addEmail(inputValue);
    } else if (e.key === "Backspace" && !inputValue && recipients.length > 0) {
      onChange?.(recipients.slice(0, -1));
    }
  };

  // Auto-add email when user clicks away (e.g., clicks Send button)
  const handleBlur = () => {
    if (inputValue.trim()) {
      addEmail(inputValue);
    }
  };

  const removeRecipient = (id: string) => {
    onChange?.(recipients.filter((r) => r.id !== id));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg border min-h-[52px]">
        {recipients.map((recipient) => (
          <Badge
            key={recipient.id}
            variant="secondary"
            className="gap-1 pl-3 pr-1.5 py-1.5 text-sm"
            data-testid={`badge-recipient-${recipient.id}`}
          >
            <span>{recipient.email}</span>
            <button
              onClick={() => removeRecipient(recipient.id)}
              className="ml-1 hover:bg-muted rounded-full p-0.5"
              data-testid={`button-remove-recipient-${recipient.id}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </Badge>
        ))}
        <Input
          type="email"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={recipients.length === 0 ? "Añadir correo electrónico..." : ""}
          className="flex-1 min-w-[200px] border-0 bg-transparent p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/60"
          data-testid="input-add-recipient"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Pulsa <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">Enter</kbd>, <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">Espacio</kbd> o simplemente haz clic fuera para añadir
      </p>
    </div>
  );
}
