import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Pencil, GraduationCap, Eye, Calendar } from "lucide-react";
import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  entityType: z.string().min(1, "This field is required"),
  sex: z.string().min(1, "Sex is required"),
  birthMonth: z.string().min(1, "Month is required"),
  birthDay: z.string().min(1, "Day is required"),
  birthYear: z.string().min(1, "Year is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const Profile = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState("");
  const [education, setEducation] = useState("");
  const [highSchool, setHighSchool] = useState("");
  const [college, setCollege] = useState("");
  const [degree, setDegree] = useState("");
  const [major, setMajor] = useState("");
  const [job, setJob] = useState("");
  const [favoriteMovie, setFavoriteMovie] = useState("");
  const [reading, setReading] = useState("");
  const [cityBorn, setCityBorn] = useState("");
  const [emailFrequency, setEmailFrequency] = useState("weekly");

  const [prefs, setPrefs] = useState({
    emailOnMessage: true,
    emailOnComment: true,
    emailOnFollow: true,
    emailOnPostEdit: true,
    emailTopPosts: false,
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      entityType: "",
      sex: "",
      birthMonth: "",
      birthDay: "",
      birthYear: "",
      city: "",
      state: "",
      country: "",
    },
  });

  // Load profile from DB
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (data) {
        form.reset({
          name: (data as any).name || "",
          entityType: (data as any).entity_type || "",
          sex: (data as any).sex || "",
          birthMonth: (data as any).birth_month || "",
          birthDay: (data as any).birth_day || "",
          birthYear: (data as any).birth_year || "",
          city: (data as any).city || "",
          state: (data as any).state || "",
          country: (data as any).country || "",
        });
        setBio(data.bio || "");
        setEducation((data as any).education || "");
        setHighSchool((data as any).high_school || "");
        setCollege((data as any).college || "");
        setDegree((data as any).degree || "");
        setMajor((data as any).major || "");
        setJob((data as any).job || "");
        setFavoriteMovie((data as any).favorite_movie || "");
        setReading((data as any).reading || "");
        setCityBorn((data as any).city_born || "");
        setEmailFrequency((data as any).email_frequency || "weekly");
        setPrefs({
          emailOnMessage: (data as any).email_on_message ?? true,
          emailOnComment: (data as any).email_on_comment ?? true,
          emailOnFollow: (data as any).email_on_follow ?? true,
          emailOnPostEdit: (data as any).email_on_post_edit ?? true,
          emailTopPosts: (data as any).email_top_posts ?? false,
        });
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        bio,
        name: values.name,
        entity_type: values.entityType,
        sex: values.sex,
        birth_month: values.birthMonth,
        birth_day: values.birthDay,
        birth_year: values.birthYear,
        city: values.city,
        state: values.state,
        country: values.country,
        city_born: cityBorn,
        education,
        high_school: highSchool,
        college,
        degree,
        major,
        job,
        favorite_movie: favoriteMovie,
        reading,
        email_on_message: prefs.emailOnMessage,
        email_on_comment: prefs.emailOnComment,
        email_on_follow: prefs.emailOnFollow,
        email_on_post_edit: prefs.emailOnPostEdit,
        email_top_posts: prefs.emailTopPosts,
        email_frequency: emailFrequency,
      } as any)
      .eq("id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile saved!", description: "Your preferences have been updated." });
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => String(currentYear - i));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <DeetHeader />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading profile…</p>
        </main>
        <DeetFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DeetHeader />
      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-5xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
              {/* Top section — two-column grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left column — Personal Info */}
                <div className="space-y-4">
                  {/* Profile photo placeholder */}
                  <div className="flex items-start gap-4 mb-2">
                    <div className="relative h-24 w-24 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <User className="h-12 w-12 text-muted-foreground" />
                      <button
                        type="button"
                        className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">* Required</p>
                  </div>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>* Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="entityType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>* This is a</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="person">Person</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>* Sex</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female-gay">Female Gay</SelectItem>
                            <SelectItem value="male-gay">Male Gay</SelectItem>
                            <SelectItem value="female-bi">Female Bi</SelectItem>
                            <SelectItem value="male-bi">Male Bi</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Birth Date — three selects */}
                  <div>
                    <Label className="text-sm font-medium">* Birth Date</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1.5">
                      <FormField
                        control={form.control}
                        name="birthMonth"
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Month" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {MONTHS.map((m, i) => (
                                  <SelectItem key={m} value={String(i + 1)}>
                                    {m}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="birthDay"
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Day" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {days.map((d) => (
                                  <SelectItem key={d} value={d}>
                                    {d}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="birthYear"
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Year" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {years.map((y) => (
                                  <SelectItem key={y} value={y}>
                                    {y}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>* City</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>* State</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select state..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {US_STATES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>* Country</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <Label className="text-sm font-medium">City Born</Label>
                    <Input
                      className="mt-1.5"
                      value={cityBorn}
                      onChange={(e) => setCityBorn(e.target.value)}
                    />
                  </div>
                </div>

                {/* Right column — Education & Interests */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Education:</Label>
                    <Select value={education} onValueChange={setEducation}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select level..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grade-school">Grade School</SelectItem>
                        <SelectItem value="high-school">High School</SelectItem>
                        <SelectItem value="trade-school">Trade School</SelectItem>
                        <SelectItem value="bachelors">Bachelors</SelectItem>
                        <SelectItem value="masters">Masters</SelectItem>
                        <SelectItem value="doctorate">Doctorate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">High School:</Label>
                    <Input className="mt-1.5" value={highSchool} onChange={(e) => setHighSchool(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">College:</Label>
                    <Input className="mt-1.5" value={college} onChange={(e) => setCollege(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Degree:</Label>
                    <Input className="mt-1.5" value={degree} onChange={(e) => setDegree(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Major:</Label>
                    <Input className="mt-1.5" value={major} onChange={(e) => setMajor(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Job:</Label>
                    <Input className="mt-1.5" value={job} onChange={(e) => setJob(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Favorite Movie:</Label>
                    <Input className="mt-1.5" value={favoriteMovie} onChange={(e) => setFavoriteMovie(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">What I'm reading:</Label>
                    <Input className="mt-1.5" value={reading} onChange={(e) => setReading(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Change Password button */}
              <div className="flex justify-center">
                <Button type="button" variant="outline">
                  Change Password
                </Button>
              </div>

              {/* Bottom section — two-column grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left column — Bio & Preferences */}
                <div className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium">Bio:</Label>
                    <Textarea
                      className="mt-1.5 resize-y"
                      rows={6}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>

                  <div>
                    <h3 className="font-heading font-semibold text-lg mb-3">Preferences</h3>
                    <div className="space-y-3">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <Checkbox
                          checked={prefs.emailOnMessage}
                          onCheckedChange={(v) => setPrefs((p) => ({ ...p, emailOnMessage: !!v }))}
                          className="mt-0.5"
                        />
                        <span className="text-sm">Send me an email when someone sends me a message.</span>
                      </label>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <Checkbox
                          checked={prefs.emailOnComment}
                          onCheckedChange={(v) => setPrefs((p) => ({ ...p, emailOnComment: !!v }))}
                          className="mt-0.5"
                        />
                        <span className="text-sm">Send me an email when someone comments on my posting.</span>
                      </label>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <Checkbox
                          checked={prefs.emailOnFollow}
                          onCheckedChange={(v) => setPrefs((p) => ({ ...p, emailOnFollow: !!v }))}
                          className="mt-0.5"
                        />
                        <span className="text-sm">Send me an email when someone follows me.</span>
                      </label>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <Checkbox
                          checked={prefs.emailOnPostEdit}
                          onCheckedChange={(v) => setPrefs((p) => ({ ...p, emailOnPostEdit: !!v }))}
                          className="mt-0.5"
                        />
                        <span className="text-sm">Send me an email when my post has been moved or edited.</span>
                      </label>
                      <div className="flex items-start gap-2">
                        <label className="flex items-start gap-2 cursor-pointer">
                          <Checkbox
                            checked={prefs.emailTopPosts}
                            onCheckedChange={(v) => setPrefs((p) => ({ ...p, emailTopPosts: !!v }))}
                            className="mt-0.5"
                          />
                          <span className="text-sm">Send me emails highlighting some of our top posts.</span>
                        </label>
                        <Select value={emailFrequency} onValueChange={setEmailFrequency}>
                          <SelectTrigger className="w-28 h-8 text-xs shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right column — Credentials & Knows about */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <h3 className="font-heading font-semibold text-lg">Credentials & Highlights</h3>
                      <a href="#" className="text-sm text-primary hover:underline">More</a>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Pencil className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>Former Writer</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>Studied Economics at University of Puget Sound</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>48,400 content views</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>Joined August 2065</span>
                      </div>
                    </CardContent>
                  </Card>

                  <div>
                    <h3 className="font-heading font-semibold text-lg mb-3">Knows about</h3>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "Information Security", color: "bg-blue-500" },
                        { label: "Data Security", color: "bg-green-500" },
                        { label: "Economics", color: "bg-orange-500" },
                        { label: "University of Puget Sound", color: "bg-purple-500" },
                      ].map((topic) => (
                        <Badge key={topic.label} variant="secondary" className="gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${topic.color}`} />
                          {topic.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button type="submit" className="px-8">
                  Save Profile
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
      <DeetFooter />
    </div>
  );
};

export default Profile;
