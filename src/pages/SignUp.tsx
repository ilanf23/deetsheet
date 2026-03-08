import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Facebook } from "lucide-react";
import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

const signUpSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be at most 30 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      ),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignUpFormValues = z.infer<typeof signUpSchema>;

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

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = () => {
    navigate("/profile");
  };

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
              <a href="#" className="text-primary underline">
                Sign in.
              </a>
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="your_username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Social sign-in */}
                <div className="relative my-6">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                    Sign in using:
                  </span>
                </div>

                <div className="flex justify-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-full h-10 w-10"
                  >
                    <Mail className="h-5 w-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-full h-10 w-10"
                  >
                    <span className="font-bold text-lg">G</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-full h-10 w-10"
                  >
                    <Facebook className="h-5 w-5" />
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  By clicking, you agree to DeetSheet{" "}
                  <a href="#" className="text-primary underline">
                    Terms
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-primary underline">
                    Privacy Policy
                  </a>
                  .
                </p>

                <Button type="submit" className="w-full mt-4">
                  SUBMIT
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Benefits section */}
        <div className="max-w-2xl mx-auto mt-10">
          <h2 className="text-xl font-heading font-bold mb-4">
            Benefits of creating a profile:
          </h2>
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
