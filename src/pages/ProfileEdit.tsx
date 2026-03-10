import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Pencil,
  GraduationCap,
  Briefcase,
  Award,
  BookOpen,
  Eye,
  Camera,
  Plus,
  X,
  MapPin,
  Heart,
  Mail,
  Lock,
  Tag,
  Save,
  Linkedin,
} from "lucide-react";
import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
import LinkedInImportDialog from "@/components/LinkedInImportDialog";
import AvatarCropDialog from "@/components/AvatarCropDialog";
import type { LinkedInProfileData } from "@/types/linkedin";

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
  { key: "emailOnMessage", label: "Send me an email when someone sends me a message." },
  { key: "emailOnComment", label: "Email me when someone comments on my posting." },
  { key: "emailOnFollow", label: "Email me when someone follows me." },
  { key: "emailOnPostEdit", label: "Send me an email when my post has been moved or edited." },
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

const SectionHeader = ({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
      {title}
    </h3>
  </div>
);

function getCredentialIcon(value: string) {
  const found = CREDENTIAL_ICONS.find((c) => c.value === value);
  return found ? found.icon : <Pencil className="h-4 w-4" />;
}

const ProfileEdit = () => {
  const { toast } = useToast();
  const { user, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
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

  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    emailOnMessage: true,
    emailOnComment: true,
    emailOnFollow: true,
    emailOnPostEdit: true,
    emailTopPosts: false,
  });

  const [credentials, setCredentials] = useState<{ id: string; icon: string; text: string }[]>([]);
  const [showCredentialInput, setShowCredentialInput] = useState(false);
  const [newCredentialText, setNewCredentialText] = useState("");
  const [newCredentialIcon, setNewCredentialIcon] = useState("pencil");
  const [expertiseTopics, setExpertiseTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState("");
  const [linkedInDialogOpen, setLinkedInDialogOpen] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

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

  // Load existing profile from DB
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
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
          emailTopPosts: data.email_top_posts ?? false,
        });
      }
      setProfileLoaded(true);
    };
    load();
  }, [user]);

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
    setSaving(false);
    if (error) {
      toast({ title: "Error saving profile", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile saved!", description: "Your preferences have been updated." });
    }
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

    // Revoke previous object URL if any
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);

    const objectUrl = URL.createObjectURL(file);
    setCropImageSrc(objectUrl);
    setCropDialogOpen(true);

    // Reset input so the same file can be re-selected
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
    await refreshProfile();
    toast({ title: "Avatar updated!" });

    // Clean up object URL
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-accent/30 to-background overflow-x-hidden">
      <DeetHeader />
      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* ── Section 1: Profile Hero ── */}
              <div className="relative">
                <div className="h-28 rounded-xl bg-gradient-to-r from-primary to-primary/70" />
                <div className="flex flex-col items-center -mt-12">
                  <div className="relative">
                    <Avatar className="h-24 w-24 ring-4 ring-card">
                      {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile avatar" />}
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        <User className="h-10 w-10" />
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
                      className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setLinkedInDialogOpen(true)}
                      className="gap-2"
                    >
                      <Linkedin className="h-4 w-4" />
                      Import from LinkedIn
                    </Button>
                  </div>
                  <div className="mt-3 w-full max-w-xs">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-center block">Name</FormLabel>
                          <FormControl>
                            <Input {...field} className="text-center" placeholder="Your full name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* ── Section 2: Personal Details ── */}
              <Card className="border-l-4 border-l-primary">
                <CardContent className="pt-5">
                  <SectionHeader icon={MapPin} title="Personal Details" />
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="entityType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>This is a</FormLabel>
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
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Birth Date</Label>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    </div>

                  </div>
                </CardContent>
              </Card>

              {/* ── Section 3: Education & Career ── */}
              <Card className="border-l-4 border-l-secondary">
                <CardContent className="pt-5">
                  <SectionHeader icon={GraduationCap} title="Education & Career" />
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Education</Label>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium">High School</Label>
                        <Input
                          className="mt-1.5"
                          value={highSchool}
                          onChange={(e) => setHighSchool(e.target.value)}
                          placeholder="High school name"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">College</Label>
                        <Input
                          className="mt-1.5"
                          value={college}
                          onChange={(e) => setCollege(e.target.value)}
                          placeholder="College name"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium">Degree</Label>
                        <Input
                          className="mt-1.5"
                          value={degree}
                          onChange={(e) => setDegree(e.target.value)}
                          placeholder="e.g. B.A., M.S."
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Major</Label>
                        <Input
                          className="mt-1.5"
                          value={major}
                          onChange={(e) => setMajor(e.target.value)}
                          placeholder="Field of study"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Job</Label>
                      <Input
                        className="mt-1.5"
                        value={job}
                        onChange={(e) => setJob(e.target.value)}
                        placeholder="Current role or company"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ── Section 4: About Me ── */}
              <Card className="border-l-4 border-l-primary">
                <CardContent className="pt-5">
                  <SectionHeader icon={Heart} title="About Me" />
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Bio</Label>
                      <Textarea
                        className="mt-1.5 resize-y"
                        rows={4}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell people a little about yourself..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ── Section 5: Credentials & Expertise ── */}
              <Card className="border-l-4 border-l-secondary">
                <CardContent className="pt-5">
                  <SectionHeader icon={Award} title="Credentials & Expertise" />

                  {/* Credentials */}
                  <div className="mb-4">
                    <Label className="text-sm font-medium">Credentials</Label>
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
                            <span className="flex-1">{cred.text}</span>
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

                    {showCredentialInput ? (
                      <div className="mt-2 flex items-center gap-2">
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
                          variant="ghost"
                          onClick={() => {
                            setShowCredentialInput(false);
                            setNewCredentialText("");
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowCredentialInput(true)}
                        className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-md border-2 border-dashed border-primary/40 text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add Credential
                      </button>
                    )}
                  </div>

                  <Separator className="my-4" />

                  {/* Expertise / Topics */}
                  <div>
                    <Label className="text-sm font-medium">Expertise / Topics</Label>
                    {expertiseTopics.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
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
                    <div className="mt-2 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Input
                        value={topicInput}
                        onChange={(e) => setTopicInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTopic();
                          }
                        }}
                        placeholder="Type a topic and press Enter"
                        className="flex-1"
                      />
                    </div>
                    {expertiseTopics.length === 0 && (
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Add topics you're knowledgeable about
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ── Section 6: Email Preferences ── */}
              <Card className="border-l-4 border-l-primary">
                <CardContent className="pt-5">
                  <SectionHeader icon={Mail} title="Email Preferences" />
                  <div className="space-y-2.5">
                    {EMAIL_PREFS.map((pref) => (
                      <label key={pref.key} className="flex items-start gap-2 cursor-pointer">
                        <Checkbox
                          checked={prefs[pref.key]}
                          onCheckedChange={(v) =>
                            setPrefs((p) => ({ ...p, [pref.key]: !!v }))
                          }
                          className="mt-0.5"
                        />
                        <span className="text-xs">{pref.label}</span>
                      </label>
                    ))}
                    <div className="flex items-start gap-2">
                      <label className="flex items-start gap-2 cursor-pointer flex-1">
                        <Checkbox
                          checked={prefs.emailTopPosts}
                          onCheckedChange={(v) =>
                            setPrefs((p) => ({ ...p, emailTopPosts: !!v }))
                          }
                          className="mt-0.5"
                        />
                        <span className="text-xs">
                          Send me email highlighting some of our top posts.
                        </span>
                      </label>
                      <Select value={emailFrequency} onValueChange={setEmailFrequency}>
                        <SelectTrigger className="w-28 h-8 text-xs shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ── Section 7: Account ── */}
              <Card className="border-l-4 border-l-secondary">
                <CardContent className="pt-5">
                  <SectionHeader icon={Lock} title="Account" />
                  <Button type="button" variant="outline" className="gap-2">
                    <Lock className="h-4 w-4" />
                    Change Password
                  </Button>
                </CardContent>
              </Card>

              {/* ── Save Button ── */}
              <div className="flex justify-center pt-2 pb-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="px-10 py-5 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 gap-2"
                >
                  <Save className="h-5 w-5" />
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
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
