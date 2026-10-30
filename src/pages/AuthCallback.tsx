import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { consumeReturnTo } from "@/lib/authRedirect";
import { toast } from "@/components/ui/sonner";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      const returnTo = consumeReturnTo();
      if (error) {
        console.error("Auth callback error:", error);
        navigate("/login");
        return;
      }
      if (session?.user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", session.user.id)
          .single();
        if (!profile?.username) {
          toast.info("Please choose a username to finish setting up your account.");
          navigate("/profile/edit");
          return;
        }
      }
      navigate(returnTo || "/profile");
    };
    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Verifying your account...</p>
    </div>
  );
};

export default AuthCallback;
