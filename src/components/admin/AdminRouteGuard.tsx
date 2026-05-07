import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/use-toast";

// Auth gate for admin child routes. Lives *inside* the layout outlet so the
// sidebar/header keep painting while we verify the admin role — only the main
// content area shows a skeleton during the check.
export default function AdminRouteGuard() {
  const { isAdmin, isLoading, user } = useAdminAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && user && !isAdmin) {
      toast({ title: "Access denied", description: "You do not have admin privileges.", variant: "destructive" });
    }
  }, [isLoading, user, isAdmin, toast]);

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
