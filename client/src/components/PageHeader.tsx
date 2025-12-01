import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  onBack,
  action,
}: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border/40 h-16">
      <div className="flex items-center justify-between h-full px-4 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div className="hidden md:flex">{action}</div>}
      </div>
    </header>
  );
}
