import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Menu, X, List, ChevronRight, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { categories, topics } from "@/data/seedData";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminMode } from "@/hooks/useAdminMode";

const TocContent = () => {
  const navigate = useNavigate();
  const topicsByCategory = categories.map((cat) => ({
    ...cat,
    topics: topics.filter((t) => t.categoryName === cat.name),
  }));

  return (
    <>
      <div className="p-3 border-b">
        <h3 className="font-semibold text-sm">Table of Contents</h3>
      </div>
      <div className="p-2">
        {topicsByCategory.map((cat) => (
          <div key={cat.id} className="mb-2 last:mb-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
              {cat.name}
            </p>
            {cat.topics.map((topic) => (
              <button
                key={topic.id}
                className="flex items-center justify-between w-full rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors text-left"
                onClick={() => navigate(`/topic/${encodeURIComponent(topic.name)}`)}
              >
                <span>{topic.name}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {topic.postCount} <ChevronRight className="h-3 w-3" />
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </>
  );
};

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
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <a href="/" className="flex items-center shrink-0">
          <img src="/logo.png" alt="DeetSheet" className="h-[144px] mt-5" />
        </a>

        <div className="hidden md:flex flex-1 max-w-md mx-4 items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground" title="Table of Contents">
                <List className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80 max-h-[70vh] overflow-y-auto p-0">
              <TocContent />
            </PopoverContent>
          </Popover>
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
          {user ? (
            <>
              {isAdmin && (
                <div className="flex items-center gap-1.5 mr-2 px-2 py-1 rounded-md bg-muted">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">Admin</span>
                  <Switch
                    checked={adminModeActive}
                    onCheckedChange={toggleAdminMode}
                    className="scale-75"
                  />
                </div>
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
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" title="Table of Contents">
                <List className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 max-h-[60vh] overflow-y-auto p-0">
              <TocContent />
            </PopoverContent>
          </Popover>
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
