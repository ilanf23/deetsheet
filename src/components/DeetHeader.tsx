import { useState } from "react";
import { Search, Plus, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DeetHeader = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground font-heading">D</span>
          </div>
          <span className="text-xl font-bold font-heading text-foreground hidden sm:block">
            DeetSheet
          </span>
        </a>

        {/* Desktop search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search topics or posts..."
              className="pl-10 bg-muted border-0 focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            About
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
            <Plus className="h-4 w-4" />
            Create Post
          </Button>
          <Button size="sm" className="ml-2 bg-primary text-primary-foreground hover:bg-primary/90">
            Sign Up
          </Button>
          <Button variant="outline" size="sm">
            Log In
          </Button>
        </nav>

        {/* Mobile buttons */}
        <div className="flex md:hidden items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setSearchOpen(!searchOpen)}>
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile search */}
      {searchOpen && (
        <div className="md:hidden border-t p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search topics or posts..."
              className="pl-10 bg-muted border-0"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t p-4 flex flex-col gap-2 bg-card">
          <Button variant="ghost" className="justify-start text-muted-foreground">About</Button>
          <Button variant="ghost" className="justify-start gap-2 text-muted-foreground">
            <Plus className="h-4 w-4" /> Create Post
          </Button>
          <div className="flex gap-2 mt-2">
            <Button className="flex-1 bg-primary text-primary-foreground">Sign Up</Button>
            <Button variant="outline" className="flex-1">Log In</Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default DeetHeader;
