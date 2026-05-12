import { useState, useEffect, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Pencil,
  GraduationCap,
  Briefcase,
  Award,
  Camera,
  Plus,
  X,
  Linkedin,
  AlertCircle,
  Eye,
} from "lucide-react";
import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useLocation } from "@/contexts/LocationContext";
import { supabase } from "@/integrations/supabase/client";
import LinkedInImportDialog from "@/components/LinkedInImportDialog";
import AvatarCropDialog from "@/components/AvatarCropDialog";
import type { LinkedInProfileData } from "@/types/linkedin";
import { cn } from "@/lib/utils";

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

const CREDENTIAL_ICONS: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: "pencil", label: "Writer", icon: <Pencil className="h-4 w-4" /> },
  { value: "graduation", label: "Education", icon: <GraduationCap className="h-4 w-4" /> },
  { value: "briefcase", label: "Work", icon: <Briefcase className="h-4 w-4" /> },
  { value: "award", label: "Achievement", icon: <Award className="h-4 w-4" /> },
  { value: "eye", label: "Stats", icon: <Eye className="h-4 w-4" /> },
];

const EMAIL_PREFS = [
  { key: "emailOnFollow", label: "Receive notifications about new connections" },
  { key: "emailOnMessage", label: "Receive messages from other users" },
  { key: "emailOnPostEdit", label: "Receive updates about platform features" },
  { key: "emailOnComment", label: "Receive promotional emails and offers" },
] as const;

const profileSchema = z.object({
  name: z.string().optional().default(""),
  entityType: z.string().optional().default(""),
  sex: z.string().optional().default(""),
  birthMonth: z.string().optional().default(""),
  birthDay: z.string().optional().default(""),
  birthYear: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  country: z.string().optional().default(""),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const SECTIONS = [
  { id: "personal-info", label: "Personal Info" },
  { id: "education", label: "Education & Career" },
  { id: "about-me", label: "About Me" },
  { id: "credentials", label: "Credentials" },
  { id: "email-preferences", label: "Email Preferences" },
  { id: "account", label: "Account & Security" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function getCredentialIcon(value: string) {
  const found = CREDENTIAL_ICONS.find((c) => c.value === value);
  return found ? found.icon : <Pencil className="h-4 w-4" />;
}

const ProfileEdit = () => {
  const { toast } = useToast();
  const { user, refreshProfile } = useAuth();
  const { setLocation, clearLocation } = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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
  const [username, setUsername] = useState<string>("");

  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    emailOnMessage: true,
    emailOnComment: true,
    emailOnFollow: true,
    emailOnPostEdit: true,
    emailTopPosts: true,
  });

  const [credentials, setCredentials] = useState<{ id: string; icon: string; text: string }[]>([]);
  const [showCredentialInput, setShowCredentialInput] = useState(false);
  const [newCredentialText, setNewCredentialText] = useState("");
  const [newCredentialIcon, setNewCredentialIcon] = useState("pencil");
  const [credentialInput, setCredentialInput] = useState("");
  const [expertiseTopics, setExpertiseTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState("");
  const [linkedInDialogOpen, setLinkedInDialogOpen] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("personal-info");

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

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select(
          "username, name, entity_type, sex, birth_month, birth_day, birth_year, city, state, country, bio, education, high_school, college, degree, major, job, favorite_movie, reading, city_born, avatar_url, email_frequency, email_on_message, email_on_comment, email_on_follow, email_on_post_edit, email_top_posts",
        )
        .eq("id", user.id)
        .single();
      if (data) {
        form.reset({
          name: data.name || "",
          entityType: data.entity_type || "",
          sex: data.sex || "",
          birthMonth: data.birth_month || "",
          birthDay: data.birth_day || "",
          birthYear: data.birth_year || "",
          city: data.city || "",
          state: data.state || "",
          country: data.country || "",
        });
        setUsername(data.username || "");
        setBio(data.bio || "");
        setEducation(data.education || "");
        setHighSchool(data.high_school || "");
        setCollege(data.college || "");
        setDegree(data.degree || "");
        setMajor(data.major || "");
        setJob(data.job || "");
        setFavoriteMovie(data.favorite_movie || "");
        setReading(data.reading || "");
        setCityBorn(data.city_born || "");
        setAvatarUrl(data.avatar_url || null);
        setEmailFrequency(data.email_frequency || "weekly");
        setPrefs({
          emailOnMessage: data.email_on_message ?? true,
          emailOnComment: data.email_on_comment ?? true,
          emailOnFollow: data.email_on_follow ?? true,
          emailOnPostEdit: data.email_on_post_edit ?? true,
          emailTopPosts: data.email_top_posts ?? true,
        });
      }
    };
    load();
  }, [user]);

  // Scroll-spy: highlight the sidebar nav item for the section currently in view.
  useEffect(() => {
    const ids = SECTIONS.map((s) => s.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id as SectionId);
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: [0, 0.25, 0.5] },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const formValues = form.watch();

  // Per-section completion. Drives the orange warning indicators in the sidebar.
  const sectionState = useMemo(() => {
    const personalComplete = Boolean(
      formValues.name &&
        formValues.entityType &&
        formValues.sex &&
        formValues.birthMonth &&
        formValues.birthDay &&
        formValues.birthYear &&
        formValues.city &&
        formValues.state,
    );
    const educationComplete = Boolean(education && job);
    const aboutComplete = Boolean(bio.trim());
    const credentialsComplete = credentials.length > 0 || expertiseTopics.length > 0;
    const emailComplete = Object.values(prefs).some(Boolean);
    const accountIssues = 2; // 2FA + password rotation reminders — surface as a default nudge
    return {
      "personal-info": { complete: personalComplete, warning: !personalComplete ? 0 : 0 },
      education: { complete: educationComplete, warning: 0 },
      "about-me": { complete: aboutComplete, warning: 0 },
      credentials: { complete: credentialsComplete, warning: 0 },
      "email-preferences": { complete: emailComplete, warning: emailComplete ? 0 : 1 },
      account: { complete: false, warning: accountIssues },
    } as Record<SectionId, { complete: boolean; warning: number }>;
  }, [formValues, education, job, bio, credentials, expertiseTopics, prefs]);

  const profileIncomplete = !sectionState["personal-info"].complete;

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        avatar_url: avatarUrl,
        name: values.name,
        entity_type: values.entityType,
        sex: values.sex,
        birth_month: values.birthMonth,
        birth_day: values.birthDay,
        birth_year: values.birthYear,
        city: values.city,
        state: values.state,
        country: values.country,
        bio,
        education,
        high_school: highSchool,
        college,
        degree,
        major,
        job,
        favorite_movie: favoriteMovie,
        reading,
        city_born: cityBorn,
        email_frequency: emailFrequency,
        email_on_message: prefs.emailOnMessage,
        email_on_comment: prefs.emailOnComment,
        email_on_follow: prefs.emailOnFollow,
        email_on_post_edit: prefs.emailOnPostEdit,
        email_top_posts: prefs.emailTopPosts,
      });
    if (error) {
      setSaving(false);
      toast({ title: "Error saving profile", description: error.message, variant: "destructive" });
      return;
    }

    const cityTrim = values.city?.trim() ?? "";
    const stateTrim = values.state?.trim() ?? "";
    if (cityTrim && stateTrim) {
      await setLocation(cityTrim, stateTrim);
    } else {
      await clearLocation();
    }

    setSaving(false);
    toast({ title: "Profile saved!", description: "Your preferences have been updated." });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 5MB.", variant: "destructive" });
      return;
    }

    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);

    const objectUrl = URL.createObjectURL(file);
    setCropImageSrc(objectUrl);
    setCropDialogOpen(true);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCroppedUpload = async (blob: Blob) => {
    if (!user) return;
    setCropDialogOpen(false);
    setUploadingAvatar(true);

    const path = `${user.id}/avatar.jpg`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, blob, { upsert: true, contentType: "image/jpeg" });

    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    setAvatarUrl(publicUrl);
    setUploadingAvatar(false);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    await refreshProfile();
    toast({ title: "Avatar updated!" });

    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
    }
  };

  const handleReselect = () => {
    fileInputRef.current?.click();
  };

  const handleCropDialogClose = (open: boolean) => {
    setCropDialogOpen(open);
    if (!open && cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
    }
  };

  const addCredentialFromInput = () => {
    const t = credentialInput.trim();
    if (!t) return;
    setCredentials((prev) => [
      ...prev,
      { id: crypto.randomUUID(), icon: "pencil", text: t },
    ]);
    setCredentialInput("");
  };

  const addCredential = () => {
    if (!newCredentialText.trim()) return;
    setCredentials((prev) => [
      ...prev,
      { id: crypto.randomUUID(), icon: newCredentialIcon, text: newCredentialText.trim() },
    ]);
    setNewCredentialText("");
    setNewCredentialIcon("pencil");
    setShowCredentialInput(false);
  };

  const removeCredential = (id: string) => {
    setCredentials((prev) => prev.filter((c) => c.id !== id));
  };

  const addTopic = () => {
    const t = topicInput.trim();
    if (!t || expertiseTopics.includes(t)) return;
    setExpertiseTopics((prev) => [...prev, t]);
    setTopicInput("");
  };

  const removeTopic = (topic: string) => {
    setExpertiseTopics((prev) => prev.filter((t) => t !== topic));
  };

  const EDUCATION_VALUES = ["grade-school", "high-school", "trade-school", "bachelors", "masters", "doctorate"];

  const handleLinkedInImport = (data: LinkedInProfileData) => {
    if (data.name) form.setValue("name", data.name);
    if (data.city) form.setValue("city", data.city);
    if (data.state && US_STATES.includes(data.state)) form.setValue("state", data.state);
    if (data.country) form.setValue("country", data.country);
    if (data.bio) setBio(data.bio);
    if (data.education && EDUCATION_VALUES.includes(data.education)) setEducation(data.education);
    if (data.highSchool) setHighSchool(data.highSchool);
    if (data.college) setCollege(data.college);
    if (data.degree) setDegree(data.degree);
    if (data.major) setMajor(data.major);
    if (data.job) setJob(data.job);
    if (data.credentials && data.credentials.length > 0) {
      setCredentials(data.credentials.map((c) => ({ id: crypto.randomUUID(), icon: c.icon, text: c.text })));
    }
    if (data.expertiseTopics && data.expertiseTopics.length > 0) {
      setExpertiseTopics(data.expertiseTopics);
    }
    toast({ title: "LinkedIn profile imported!", description: "Your profile fields have been updated." });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => String(currentYear - i));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

  const displayName = formValues.name || username || "Your name";
  const handleText = username ? `@${username}` : user?.email ?? "";
  const initials = (formValues.name || username || "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-muted/40 overflow-x-clip">
      <DeetHeader />
      <main className="flex-1 py-8 px-6 lg:px-10">
        <div className="mx-auto w-full max-w-[1600px]">
          <Form {...form}>
            <form
              id="profile-form"
              onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6"
          >
            {/* ── Sidebar ── */}
            <aside className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)]">
              <div className="bg-card rounded-2xl border p-5 space-y-5 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <Avatar className="h-24 w-24 ring-2 ring-card">
                      {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile avatar" />}
                      <AvatarFallback className="bg-primary/15 text-primary text-lg">
                        {initials || <User className="h-8 w-8" />}
                      </AvatarFallback>
                    </Avatar>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <button
                      type="button"
                      disabled={uploadingAvatar}
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
                      aria-label="Change avatar"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-3 text-base font-semibold text-foreground truncate w-full">
                    {displayName}
                  </div>
                  {handleText && (
                    <div className="text-sm text-muted-foreground truncate w-full">
                      {handleText}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setLinkedInDialogOpen(true)}
                    className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                  >
                    <Linkedin className="h-4 w-4" />
                    Import from LinkedIn
                  </button>
                </div>

                <nav className="space-y-1">
                  {SECTIONS.map((s) => {
                    const isActive = activeSection === s.id;
                    const warning = sectionState[s.id].warning;
                    return (
                      <a
                        key={s.id}
                        href={`#${s.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          const el = document.getElementById(s.id);
                          if (el) {
                            el.scrollIntoView({ behavior: "smooth", block: "start" });
                            setActiveSection(s.id);
                          }
                        }}
                        className={cn(
                          "group flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                          isActive
                            ? "bg-primary/10 text-foreground font-medium"
                            : "text-foreground/80 hover:bg-muted",
                        )}
                      >
                        <span
                          className={cn(
                            "h-4 w-4 rounded shrink-0",
                            isActive ? "bg-primary" : "bg-muted-foreground/25",
                          )}
                        />
                        <span className="flex-1 truncate">{s.label}</span>
                        {warning > 0 && (
                          <span
                            className={cn(
                              "shrink-0 inline-flex items-center justify-center text-[10px] font-semibold text-secondary-foreground bg-secondary rounded-full",
                              warning === 1 ? "h-2 w-2" : "h-4 min-w-4 px-1",
                            )}
                          >
                            {warning > 1 ? warning : ""}
                          </span>
                        )}
                      </a>
                    );
                  })}
                </nav>

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </aside>

            {/* ── Main content ── */}
            <div className="space-y-4 min-w-0">
              {profileIncomplete && (
                <div className="flex items-center gap-2.5 rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-sm">
                  <AlertCircle className="h-4 w-4 text-secondary shrink-0" />
                  <span className="text-foreground/90">
                    Complete your profile to unlock all features
                  </span>
                </div>
              )}

                <div className="space-y-8">
                  {/* ── Personal Information ── */}
                  <section id="personal-info" className="scroll-mt-24 bg-card rounded-2xl border p-6 md:p-8">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-foreground tracking-tight">
                        Personal Information
                      </h2>
                      <div className="mt-2 h-1 w-16 bg-secondary rounded-full" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Manage your profile details and public information.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Your full name" />
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
                            <FormLabel>Account Type</FormLabel>
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
                            <FormLabel>Sex</FormLabel>
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

                      <div>
                        <Label className="text-sm">Date of Birth</Label>
                        <div className="mt-1.5 grid grid-cols-[1fr_64px_80px] gap-2">
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
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="birthDay"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    {...field}
                                    inputMode="numeric"
                                    maxLength={2}
                                    placeholder="DD"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="birthYear"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    {...field}
                                    inputMode="numeric"
                                    maxLength={4}
                                    placeholder="YYYY"
                                  />
                                </FormControl>
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
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Your city" />
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
                            <FormLabel>State</FormLabel>
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
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Your country" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div>
                        <Label className="text-sm">City of Birth</Label>
                        <Input
                          className="mt-1.5"
                          value={cityBorn}
                          onChange={(e) => setCityBorn(e.target.value)}
                          placeholder="Where you were born"
                        />
                      </div>
                    </div>
                  </section>

                  {/* ── Education ── */}
                  <section id="education" className="scroll-mt-24 bg-card rounded-2xl border p-6 md:p-8">
                    <h3 className="text-xl font-semibold text-foreground mb-4">
                      Education
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Education Level</Label>
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
                        <Label className="text-sm">High School</Label>
                        <Input
                          className="mt-1.5"
                          value={highSchool}
                          onChange={(e) => setHighSchool(e.target.value)}
                          placeholder="High school name"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">College</Label>
                        <Input
                          className="mt-1.5"
                          value={college}
                          onChange={(e) => setCollege(e.target.value)}
                          placeholder="College name"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Degree</Label>
                        <Input
                          className="mt-1.5"
                          value={degree}
                          onChange={(e) => setDegree(e.target.value)}
                          placeholder="e.g. B.A., M.S."
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Major</Label>
                        <Input
                          className="mt-1.5"
                          value={major}
                          onChange={(e) => setMajor(e.target.value)}
                          placeholder="Field of study"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Current Role</Label>
                        <Input
                          className="mt-1.5"
                          value={job}
                          onChange={(e) => setJob(e.target.value)}
                          placeholder="Current role or company"
                        />
                      </div>
                    </div>
                  </section>

                  {/* ── About Me ── */}
                  <section id="about-me" className="scroll-mt-24 bg-card rounded-2xl border p-6 md:p-8">
                    <h3 className="text-xl font-semibold text-foreground mb-4">
                      About Me
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <Label className="text-sm">Bio</Label>
                        <Textarea
                          className="mt-1.5 resize-y"
                          rows={5}
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Tell people a little about yourself..."
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">Favorite Movie</Label>
                          <Input
                            className="mt-1.5"
                            value={favoriteMovie}
                            onChange={(e) => setFavoriteMovie(e.target.value)}
                            placeholder="Your favorite movie"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Currently Reading</Label>
                          <Input
                            className="mt-1.5"
                            value={reading}
                            onChange={(e) => setReading(e.target.value)}
                            placeholder="Book you're reading"
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* ── Credentials & Expertise ── */}
                  <section id="credentials" className="scroll-mt-24 bg-card rounded-2xl border p-6 md:p-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-foreground">
                        Credentials & Expertise
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowCredentialInput(true)}
                        className="inline-flex items-center gap-2 text-sm font-medium text-secondary hover:bg-secondary/10 px-3 py-2 rounded-lg transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add Credential
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Credentials</Label>
                        {credentials.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {credentials.map((cred) => (
                              <div
                                key={cred.id}
                                className="group flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                              >
                                <span className="text-muted-foreground shrink-0">
                                  {getCredentialIcon(cred.icon)}
                                </span>
                                <span className="flex-1 truncate">{cred.text}</span>
                                <button
                                  type="button"
                                  onClick={() => removeCredential(cred.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <Input
                          className="mt-1.5"
                          value={credentialInput}
                          onChange={(e) => setCredentialInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCredentialFromInput();
                            }
                          }}
                          placeholder="Add credentials..."
                        />
                      </div>

                      <div>
                        <Label className="text-sm">Expertise</Label>
                        {expertiseTopics.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {expertiseTopics.map((topic) => (
                              <Badge
                                key={topic}
                                className="bg-primary/15 text-primary hover:bg-primary/20 gap-1 pr-1.5"
                              >
                                {topic}
                                <button
                                  type="button"
                                  onClick={() => removeTopic(topic)}
                                  className="ml-0.5 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                        <Input
                          className="mt-1.5"
                          value={topicInput}
                          onChange={(e) => setTopicInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addTopic();
                            }
                          }}
                          placeholder="Add tags..."
                        />
                      </div>
                    </div>

                    {showCredentialInput && (
                      <div className="mt-3 flex items-center gap-2 p-3 rounded-md bg-muted/50 border">
                        <Select value={newCredentialIcon} onValueChange={setNewCredentialIcon}>
                          <SelectTrigger className="w-32 shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CREDENTIAL_ICONS.map((ci) => (
                              <SelectItem key={ci.value} value={ci.value}>
                                <span className="flex items-center gap-2">
                                  {ci.icon}
                                  {ci.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={newCredentialText}
                          onChange={(e) => setNewCredentialText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCredential();
                            }
                          }}
                          placeholder="e.g. Software Engineer at Google"
                          className="flex-1"
                          autoFocus
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={addCredential}
                          disabled={!newCredentialText.trim()}
                        >
                          Add
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowCredentialInput(false);
                            setNewCredentialText("");
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </section>

                  {/* ── Email Preferences ── */}
                  <section id="email-preferences" className="scroll-mt-24 bg-card rounded-2xl border p-6 md:p-8">
                    <h3 className="text-xl font-semibold text-foreground mb-4">
                      Email Preferences
                    </h3>
                    <div className="space-y-3">
                      {EMAIL_PREFS.map((pref) => (
                        <label
                          key={pref.key}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <Checkbox
                            className="h-4 w-4"
                            checked={prefs[pref.key]}
                            onCheckedChange={(v) =>
                              setPrefs((p) => ({ ...p, [pref.key]: !!v }))
                            }
                          />
                          <span className="text-sm text-foreground">{pref.label}</span>
                        </label>
                      ))}
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <Checkbox
                            className="h-4 w-4"
                            checked={prefs.emailTopPosts}
                            onCheckedChange={(v) =>
                              setPrefs((p) => ({ ...p, emailTopPosts: !!v }))
                            }
                          />
                          <span className="text-sm text-foreground">
                            Receive digest summary
                          </span>
                        </label>
                        <Select value={emailFrequency} onValueChange={setEmailFrequency}>
                          <SelectTrigger className="w-32 text-sm">
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
                  </section>

                  {/* ── Account & Security ── */}
                  <section id="account" className="scroll-mt-24 bg-card rounded-2xl border p-6 md:p-8">
                    <button
                      type="button"
                      className="text-sm font-medium text-secondary hover:underline"
                    >
                      Change Password
                    </button>
                  </section>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </main>
      <DeetFooter />
      <LinkedInImportDialog
        open={linkedInDialogOpen}
        onOpenChange={setLinkedInDialogOpen}
        onImport={handleLinkedInImport}
      />
      {cropImageSrc && (
        <AvatarCropDialog
          open={cropDialogOpen}
          onOpenChange={handleCropDialogClose}
          imageSrc={cropImageSrc}
          onCropComplete={handleCroppedUpload}
          onReselect={handleReselect}
        />
      )}
    </div>
  );
};

export default ProfileEdit;
