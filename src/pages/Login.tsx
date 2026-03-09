import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      navigate("/");
    }
  };

  const handleGoogleSignIn = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/profile`,
    });
    if (result?.error) {
      toast.error("Google sign-in failed");
    } else if (!result?.redirected) {
      navigate("/profile");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DeetHeader />
      <main className="flex-1 py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <h1 className="text-primary font-heading text-2xl md:text-3xl font-bold">
              Welcome Back!
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary underline">Sign up.</Link>
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-primary underline">Forgot password?</Link>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "LOG IN"}
              </Button>
            </form>

            <div className="relative my-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                Or continue with
              </span>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
              <span className="font-bold text-lg mr-2">G</span> Sign in with Google
            </Button>
          </CardContent>
        </Card>
      </main>
      <DeetFooter />
    </div>
  );
};

export default Login;
