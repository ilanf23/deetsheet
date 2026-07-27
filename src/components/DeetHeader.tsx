import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Menu, X, List, User, UserCircle2, Shield, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminMode } from "@/hooks/useAdminMode";
import SearchBar from "@/components/SearchBar";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessages";

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
  const { data: unreadCount = 0 } = useUnreadMessagesCount();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      <div className="mx-auto flex h-16 items-center justify-between gap-4 px-4 lg:px-10">
        <a href="/" className="flex items-center shrink-0 pl-3">
          <img src="/logo.png" alt="DeetSheet" className="h-[26px] md:h-[55px] -mt-1 md:mt-0" />
        </a>

        <div className="hidden md:flex flex-1 max-w-md mx-4 items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground" title={onTopics ? "Close Topics" : "Topics Directory"} onClick={toggleTopics}>
            {onTopics ? <X className="h-[35px] w-[35px]" /> : <List className="w-[27px] h-[27px]" />}
          </Button>
          <SearchBar />
        </div>

        <nav className="hidden md:flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger className="mr-1 inline-flex items-center gap-1 px-2 py-1 text-sm text-foreground/80 hover:text-foreground transition-colors focus-visible:outline-none">
              About
              <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => navigate("/about")}>About</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/contact")}>Contact</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/investor")}>
                Become an Investor
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="mr-2 inline-flex items-center gap-1 px-2 py-1 text-sm text-foreground/80 hover:text-foreground transition-colors focus-visible:outline-none">
              Guides
              <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => navigate("/inspiration")}>
                Need inspiration?
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/rules")}>
                Rules &amp; Guidelines
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>



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
              <button
                onClick={() => navigate("/inbox")}
                title="Inbox"
                aria-label="Inbox"
                className="relative mr-1 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Mail className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-secondary text-secondary-foreground text-[10px] font-semibold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
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
                    onClick={() => navigate("/inbox")}
                    className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    <span>Inbox</span>
                    {unreadCount > 0 && (
                      <span className="ml-2 min-w-[18px] h-4 px-1 rounded-full bg-secondary text-secondary-foreground text-[10px] font-semibold flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
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
            {onTopics ? <X className="h-[29px] w-[29px]" /> : <List className="h-[34px] w-[34px]" />}
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
          <SearchBar autoFocus onNavigated={() => setSearchOpen(false)} />
        </div>
      )}

    </header>
  );
};

export default DeetHeader;
