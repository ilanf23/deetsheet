import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Menu, X, List, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminMode } from "@/hooks/useAdminMode";
import LocationChip from "@/components/LocationChip";

const DeetHeader = () => {
  const navigate = useNavigate();
  const { user, signOut, avatarUrl } = useAuth();
  const { isAdmin } = useAdminAuth();
  const { adminModeActive, toggleAdminMode } = useAdminMode();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "User";

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 items-center justify-between gap-4 px-6 lg:px-10">
        <a href="/" className="flex items-center shrink-0">
          <img src="/logo.png" alt="DeetSheet" className="h-[166px] mt-5" />
        </a>

        <div className="hidden md:flex flex-1 max-w-md mx-4 items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground" title="Topics Directory" onClick={() => navigate("/topics")}>
            <List className="h-5 w-5" />
          </Button>
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

        <nav className="hidden md:flex items-center gap-1">
          <div className="mr-2"><LocationChip /></div>
          {user ? (
            <>
              {isAdmin && (
                <button
                  onClick={toggleAdminMode}
                  title={adminModeActive ? "Disable admin mode" : "Enable admin mode"}
                  className={`relative mr-1 p-1.5 rounded-md transition-colors ${adminModeActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                >
                  <Shield className="h-4 w-4" />
                  {adminModeActive && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
                  )}
                </button>
              )}
              <button onClick={() => navigate("/profile")} className="flex items-center gap-2 mr-2 hover:opacity-80 transition-opacity">
                <Avatar className="h-7 w-7">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={username} />}
                  <AvatarFallback className="text-xs bg-muted">
                    <User className="h-3.5 w-3.5" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{username}</span>
              </button>
              {adminModeActive && isAdmin && (
                <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>Admin Panel</Button>
              )}
              <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>Profile</Button>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>Sign Out</Button>
            </>
          ) : (
            <>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => navigate("/signup")}>Sign Up</Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/login")}>Log In</Button>
            </>
          )}
        </nav>

        <div className="flex md:hidden items-center gap-2">
          <LocationChip />
          <Button variant="ghost" size="icon" title="Topics Directory" onClick={() => navigate("/topics")}>
            <List className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setSearchOpen(!searchOpen)}>
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {searchOpen && (
        <div className="md:hidden border-t p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search topics or posts..." className="pl-10 bg-muted border-0" autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <div className="md:hidden border-t p-4 flex flex-col gap-2 bg-card">
          {user ? (
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">Signed in as {username}</span>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => { navigate("/profile"); setMobileMenuOpen(false); }}>Profile</Button>
                <Button variant="outline" className="flex-1" onClick={() => { signOut(); setMobileMenuOpen(false); }}>Sign Out</Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button className="flex-1 bg-primary text-primary-foreground" onClick={() => { navigate("/signup"); setMobileMenuOpen(false); }}>Sign Up</Button>
              <Button variant="outline" className="flex-1" onClick={() => { navigate("/login"); setMobileMenuOpen(false); }}>Log In</Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default DeetHeader;
