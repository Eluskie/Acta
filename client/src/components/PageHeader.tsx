import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: ReactNode;
}

/**
 * PageHeader - Sticky header for pages
 * 
 * Design decisions:
 * - Uses sans-serif font to keep header compact and readable
 * - Tiempos is reserved for page content headers (h1, h2, etc.)
 * - Responsive sizing: smaller on mobile, larger on desktop
 * - Sticky positioning for persistent navigation
 */
export default function PageHeader({
  title,
  subtitle,
  onBack,
  action,
}: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border/40">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground shrink-0 h-10 w-10 -ml-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-medium text-foreground truncate font-sans leading-tight mb-1">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate leading-tight">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div className="hidden md:flex shrink-0 ml-4">{action}</div>}
      </div>
    </header>
  );
}
