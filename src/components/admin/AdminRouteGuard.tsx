import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export default function AdminRouteGuard({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading, user } = useAdminAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && user && !isAdmin) {
      toast({ title: "Access denied", description: "You do not have admin privileges.", variant: "destructive" });
    }
  }, [isLoading, user, isAdmin, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}
