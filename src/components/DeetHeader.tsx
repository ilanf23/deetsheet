import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Menu, X, List, User, UserCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminMode } from "@/hooks/useAdminMode";

const DeetHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const onTopics = location.pathname === "/topics";
  const toggleTopics = () => {
    if (onTopics) navigate(-1);
    else navigate("/topics");
  };
  const { user, signOut, avatarUrl } = useAuth();
  const { isAdmin } = useAdminAuth();
  const { adminModeActive, toggleAdminMode } = useAdminMode();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "User";

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const shouldUseDark = savedTheme === "dark";

    document.documentElement.classList.toggle("dark", shouldUseDark);
    setIsDarkMode(shouldUseDark);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((current) => {
      const next = !current;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 items-center justify-between gap-4 px-6 lg:px-10">
        <a href="/" className="flex items-center shrink-0">
          <img src="/logo.png" alt="DeetSheet" className="h-4 md:h-[33px] -mt-1 md:mt-0" />
        </a>

        <div className="hidden md:flex flex-1 max-w-md mx-4 items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground" title={onTopics ? "Close Topics" : "Topics Directory"} onClick={toggleTopics}>
            {onTopics ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
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
          <button
            onClick={() => navigate("/about")}
            className="mr-2 px-2 py-1 text-sm text-foreground/80 hover:text-foreground transition-colors"
          >
            About
          </button>

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
              <HoverCard openDelay={150} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <button
                    onClick={() => navigate("/profile")}
                    className="mr-2 flex items-center gap-2 rounded-full hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    title="View your profile"
                    aria-label="View your profile"
                  >
                    <Avatar className="h-7 w-7">
                      {avatarUrl && <AvatarImage src={avatarUrl} alt={username} />}
                      <AvatarFallback className="text-xs bg-muted">
                        <User className="h-3.5 w-3.5" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-foreground/80">{username}</span>
                  </button>
                </HoverCardTrigger>
                <HoverCardContent align="end" className="w-44 p-1">
                  <button
                    type="button"
                    onClick={() => navigate("/profile")}
                    className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/contact")}
                    className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    Contact
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/investor")}
                    className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    Become an Investor
                  </button>
                  <button
                    type="button"
                    onClick={toggleDarkMode}
                    className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    {isDarkMode ? "Light mode" : "Dark mode"}
                  </button>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    Log out
                  </button>
                </HoverCardContent>
              </HoverCard>
              {adminModeActive && isAdmin && (
                <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>Admin Panel</Button>
              )}
            </>
          ) : (
            <>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => navigate("/signup")}>Sign Up</Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/login")}>Log In</Button>
            </>
          )}
        </nav>

        <div className="flex md:hidden items-center gap-2">
          <Button variant="ghost" size="icon" title={onTopics ? "Close Topics" : "Topics Directory"} onClick={toggleTopics}>
            {onTopics ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setSearchOpen(!searchOpen)}>
            <Search className="h-5 w-5" />
          </Button>
          <button
            onClick={() => navigate(user ? "/profile" : "/login")}
            className="rounded-full hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            title={user ? "View your profile" : "Log in"}
            aria-label={user ? "View your profile" : "Log in"}
          >
            {user && avatarUrl ? (
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} alt={username} />
                <AvatarFallback className="text-xs bg-muted">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <UserCircle2 className="h-7 w-7 text-muted-foreground" strokeWidth={1.75} />
            )}
          </button>
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

    </header>
  );
};

export default DeetHeader;
