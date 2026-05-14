import { useEffect, useState } from "react";
import { Outlet, NavLink, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutGrid,
  Users,
  FileText,
  MessageSquare,
  Hash,
  Flag,
  History,
  Mail,
  FileEdit,
  Inbox,
  ArrowLeft,
  LogOut,
} from "lucide-react";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/admin/review", label: "Review", icon: Inbox, badgeKey: "review" as const },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/posts", label: "Posts", icon: FileText },
  { to: "/admin/comments", label: "Comments", icon: MessageSquare },
  { to: "/admin/topics", label: "Topics", icon: Hash },
  { to: "/admin/reports", label: "Reports", icon: Flag },
  { to: "/admin/contact-messages", label: "Contact Messages", icon: Mail },
  { to: "/admin/site-pages", label: "Site Pages", icon: FileEdit },
  { to: "/admin/audit", label: "Audit Log", icon: History },
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [t, p] = await Promise.all([
        supabase.from("topics").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      if (!cancelled) setPendingCount((t.count ?? 0) + (p.count ?? 0));
    };
    load();
    const id = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [location.pathname]);

  return (
    <div className="admin-shell min-h-screen flex">
      <aside
        className="w-[268px] shrink-0 flex flex-col"
        style={{
          backgroundColor: "hsl(var(--admin-surface))",
          borderRight: "1px solid hsl(var(--admin-border))",
        }}
      >
        <div className="px-6 pt-6 pb-5" style={{ borderBottom: "1px solid hsl(var(--admin-border))" }}>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px]"
            style={{ color: "hsl(var(--admin-fg-muted))" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to site
          </Link>
          <h2
            className="mt-3 text-[19px] font-bold tracking-tight"
            style={{ color: "hsl(var(--admin-fg))" }}
          >
            Admin Portal
          </h2>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-[14px] transition-colors`
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      backgroundColor: "hsl(var(--admin-primary))",
                      color: "#ffffff",
                      fontWeight: 600,
                    }
                  : {
                      color: "hsl(var(--admin-fg))",
                    }
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className="h-[17px] w-[17px]"
                    style={{ color: isActive ? "#ffffff" : "hsl(var(--admin-fg))" }}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.badgeKey === "review" && pendingCount > 0 && (
                    <span
                      className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold"
                      style={{
                        backgroundColor: isActive ? "#ffffff" : "hsl(var(--secondary))",
                        color: isActive ? "hsl(var(--admin-primary))" : "hsl(var(--secondary-foreground))",
                      }}
                    >
                      {pendingCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div
          className="px-6 py-5 space-y-2"
          style={{ borderTop: "1px solid hsl(var(--admin-border))" }}
        >
          <p
            className="text-[13px] truncate"
            style={{ color: "hsl(var(--admin-fg-muted))" }}
          >
            {user?.email ?? "—"}
          </p>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 text-[13px]"
            style={{ color: "hsl(var(--admin-fg-muted))" }}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="flex items-center gap-2 px-8 py-5"
          style={{ borderBottom: "1px solid hsl(var(--admin-border))" }}
        >
          <LayoutGrid className="h-5 w-5" style={{ color: "hsl(var(--admin-fg))" }} />
          <span className="text-[15px] font-semibold" style={{ color: "hsl(var(--admin-fg))" }}>
            DeetSheet Admin
          </span>
        </header>
        <main className="flex-1 px-10 py-8 overflow-x-hidden min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
