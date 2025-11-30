import { cn } from "@/lib/utils";

interface SuccessAnimationProps {
  message?: string;
  className?: string;
}

export default function SuccessAnimation({
  message = "Acta enviada correctamente",
  className,
}: SuccessAnimationProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12",
        className
      )}
      data-testid="success-animation"
    >
      <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-6">
        <svg
          className="w-12 h-12 text-success"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path className="animate-checkmark" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-semibold mb-2" data-testid="text-success-message">
        {message}
      </h2>
      
      <p className="text-muted-foreground text-center max-w-md">
        Todos los destinatarios recibirán el acta en su correo electrónico.
      </p>
    </div>
  );
}
