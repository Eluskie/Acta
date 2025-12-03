import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Bell, Settings } from "lucide-react";
import { useState } from "react";
import { UserButton, useUser } from "@/lib/clerk";

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { isSignedIn } = useUser();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/40 h-14">
      <div className="flex items-center justify-between h-full px-4 max-w-[1600px] mx-auto">
        {/* Left: Logo */}
        <div className="flex items-center gap-4 w-[200px]">
          <img src="/actalogo.svg" alt="Acta" className="h-4 w-auto" />
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-xl hidden sm:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type="search"
              placeholder="Buscar actas..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-9 h-9 bg-muted/40 border-transparent focus:bg-background focus:border-input transition-all rounded-lg w-full"
              data-testid="input-search"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-2 w-[200px]">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground w-8 h-8">
            <Bell className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground w-8 h-8">
            <Settings className="w-4 h-4" />
          </Button>
          
          {/* Clerk User Button - Shows profile pic with dropdown */}
          {isSignedIn && (
            <>
              <div className="w-px h-4 bg-border mx-1" />
              <UserButton 
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                    userButtonPopoverCard: "shadow-xl border border-border/50",
                    userButtonPopoverActionButton: "hover:bg-muted",
                  }
                }}
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
