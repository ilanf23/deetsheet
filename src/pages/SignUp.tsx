import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";

const benefits = [
  "Keep Track of all your favorite posts and comments.",
  "Receive notifications to your favorite postings.",
  "Receive notifications to your postings.",
  "Have the option of posting anonymous with a profile.",
  "Exchange personal messages to other registered users.",
  "Your postings become more credible and you become an influential member in the DeetSheet community.",
];

const SignUp = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkInbox, setCheckInbox] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { username },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setCheckInbox(true);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) toast.error("Google sign-in failed");
  };

  if (checkInbox) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <DeetHeader />
        <main className="flex-1 py-8 px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <h1 className="text-primary font-heading text-2xl font-bold">Check Your Inbox!</h1>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                We've sent a verification link to <strong>{email}</strong>. Click the link in your email to activate your account.
              </p>
              <p className="text-xs text-muted-foreground">
                Didn't receive it? Check your spam folder or try signing up again.
              </p>
              <Link to="/login" className="text-primary underline text-sm">Go to Login</Link>
            </CardContent>
          </Card>
        </main>
        <DeetFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DeetHeader />
      <main className="flex-1 py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <h1 className="text-primary font-heading text-2xl md:text-3xl font-bold">
              Join the DeetSheet Community!
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Already have an account?{" "}
              <Link to="/login" className="text-primary underline">Sign in.</Link>
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" placeholder="your_username" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} maxLength={30} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" placeholder="********" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>

              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                  Or sign up with
                </span>
              </div>

              <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                <span className="font-bold text-lg mr-2">G</span> Sign up with Google
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-4">
                By clicking, you agree to DeetSheet{" "}
                <a href="#" className="text-primary underline">Terms</a> and{" "}
                <a href="#" className="text-primary underline">Privacy Policy</a>.
              </p>

              <Button type="submit" className="w-full mt-4" disabled={loading}>
                {loading ? "Creating account..." : "SUBMIT"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="max-w-2xl mx-auto mt-10">
          <h2 className="text-xl font-heading font-bold mb-4">Benefits of creating a profile:</h2>
          <ul className="space-y-2">
            {benefits.map((benefit, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-teal-500 shrink-0" />
                <span className="text-sm">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <DeetFooter />
    </div>
  );
};

export default SignUp;
