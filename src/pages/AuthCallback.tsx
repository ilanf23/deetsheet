import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { consumeReturnTo } from "@/lib/authRedirect";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const { error } = await supabase.auth.getSession();
      const returnTo = consumeReturnTo();
      if (error) {
        console.error("Auth callback error:", error);
        navigate("/login");
      } else {
        navigate(returnTo || "/profile");
      }
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
