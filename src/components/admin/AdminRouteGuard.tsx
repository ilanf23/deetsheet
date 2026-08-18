import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/use-toast";

// Auth gate for admin child routes. Lives *inside* the layout outlet so the
// sidebar/header keep painting while we verify the admin role — only the main
// content area shows a skeleton during the check.
export default function AdminRouteGuard() {
  const { isAdmin, isLoading, user } = useAdminAuth();
  const { toast } = useToast();

  // Latch: once we have admitted an admin we must never render the spinner
  // branch again — doing so unmounts the page (and any dialog the admin is
  // typing in). State + effect (not a ref mutated during render) keeps this
  // concurrent-safe; the `resolvedAdmin` term below covers the very first
  // admitted render, before the effect has run.
  const [admitted, setAdmitted] = useState(false);
  const resolvedAdmin = !isLoading && isAdmin && !!user;

  useEffect(() => {
    if (resolvedAdmin) {
      setAdmitted(true);
      return;
    }
    // Reset on sign-out *and* on a resolved non-admin result, so a revoked or
    // downgraded role ejects on the next resolved render.
    if (!isLoading && (!user || !isAdmin)) setAdmitted(false);
  }, [resolvedAdmin, isLoading, user, isAdmin]);

  useEffect(() => {
    if (!isLoading && user && !isAdmin) {
      toast({ title: "Access denied", description: "You do not have admin privileges.", variant: "destructive" });
    }
  }, [isLoading, user, isAdmin, toast]);

  if (!isLoading && user && !isAdmin) return <Navigate to="/" replace />;
  if (!isLoading && !user) return <Navigate to="/login" replace />;

  if (admitted || resolvedAdmin) return <Outlet />;


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="h-7 w-7 rounded-full animate-spin border-2"
          style={{ borderColor: "hsl(var(--admin-primary))", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}

