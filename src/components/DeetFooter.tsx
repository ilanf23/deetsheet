import { Link } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminMode } from "@/hooks/useAdminMode";

const DeetFooter = () => {
  const { isAdmin } = useAdminAuth();
  const { adminModeActive } = useAdminMode();

  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <a href="/" className="flex items-center shrink-0">
            <img src="/logo.png" alt="DeetSheet" className="h-12 scale-[3] origin-left" />
          </a>
          <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-foreground transition">About</Link>
            <Link to="/faq" className="hover:text-foreground transition">FAQ</Link>
            <Link to="/contact" className="hover:text-foreground transition">Contact</Link>
            <Link to="/terms" className="hover:text-foreground transition">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition">Privacy</Link>
            {isAdmin && adminModeActive && (
              <Link to="/admin" className="hover:text-foreground transition">Admin</Link>
            )}
          </nav>
          <p className="text-xs text-muted-foreground">© 2026 DeetSheet. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default DeetFooter;
