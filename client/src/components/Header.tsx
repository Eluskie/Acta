import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Bell, Settings, Menu } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border/40 h-14">
      <div className="flex items-center justify-between h-full px-4 max-w-[1600px] mx-auto">
        {/* Left: Logo/Menu */}
        <div className="flex items-center gap-4 w-[200px]">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Menu className="w-5 h-5" />
          </Button>
          <div className="font-semibold text-lg tracking-tight flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">A</span>
            </div>
            Acta
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-xl">
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
          <div className="w-px h-4 bg-border mx-1" />
          <Avatar className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity" data-testid="avatar-user">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              MS
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
