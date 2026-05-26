import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Pencil,
  GraduationCap,
  Briefcase,
  Award,
  Eye,
  Calendar,
  User,
  MessageSquare,
  Trash2,
  Plus,
  Hash,
  Bookmark,
  UserCircle2,
  MapPin,
  Film,
  BookOpen,
  Building2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DeetHeader from "@/components/DeetHeader";
import DeetFooter from "@/components/DeetFooter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import CreateTopicDialog from "@/components/CreateTopicDialog";
import EditPostDialog from "@/components/EditPostDialog";
import FollowUserButton from "@/components/FollowUserButton";
import { useProfileFollowCounts } from "@/hooks/useUserFollow";
import { useFollowing, useFollowers } from "@/hooks/useFollowLists";
import { buildPostSlug } from "@/lib/postSlug";
import { formatTitle } from "@/lib/formatTitle";

const CREDENTIAL_ICON_MAP: Record<string, React.ReactNode> = {
  pencil: <Pencil className="h-4 w-4" />,
  graduation: <GraduationCap className="h-4 w-4" />,
  briefcase: <Briefcase className="h-4 w-4" />,
  award: <Award className="h-4 w-4" />,
  eye: <Eye className="h-4 w-4" />,
};

interface UserPost {
  id: string;
  title: string;
  content: string;
  created_at: string;
  comment_count: number;
  score: number;
  topic_name: string;
}

interface UserTopic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffMonths / 12)}y ago`;
}

function calculateAge(birthYear?: string | null, birthMonth?: string | null, birthDay?: string | null): number | null {
  if (!birthYear) return null;
  const year = parseInt(birthYear);
  const month = birthMonth ? parseInt(birthMonth) - 1 : 0;
  const day = birthDay ? parseInt(birthDay) : 1;
  const birth = new Date(year, month, day);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function formatJoinDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const EDUCATION_LABELS: Record<string, string> = {
  "grade-school": "Grade School",
  "high-school": "High School",
  "trade-school": "Trade School",
  bachelors: "Bachelors",
  masters: "Masters",
  doctorate: "Doctorate",
};

// Profile columns this page actually reads. Selecting only what we render
// shaves a meaningful chunk of bytes off each profile fetch.
const PROFILE_COLUMNS =
  "id, name, username, avatar_url, bio, sex, orientation, birth_year, birth_month, birth_day, hide_age, city, state, country, education, high_school, college, degree, major, job, entity_type, favorite_movie, reading, city_born, created_at";

function formatProfileValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function formatTitleValue(value: unknown): string | null {
  const trimmed = formatProfileValue(value);
  if (!trimmed) return null;
  return trimmed
    .split(/[\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type DetailGroup = {
  title: string;
  items: { label: string; value: string | number | null }[];
};

const ProfileView = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("posts");
  const [moreInfoExpanded, setMoreInfoExpanded] = useState(false);

  // Determine which profile to view: URL param or logged-in user
  const targetUserId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;

  // Profile data from DB. We don't gate the page on a single `loading` flag
  // anymore — each section paints as soon as its query resolves so the user
  // sees structure (avatar slot, name slot, tabs) on first paint.
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);

  // Posts & counts from DB
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  // Topics list — fetched lazily the first time the Topics tab is opened.
  const [userTopics, setUserTopics] = useState<UserTopic[]>([]);
  const [topicCount, setTopicCount] = useState(0);
  const [topicsRequested, setTopicsRequested] = useState(false);
  const [createTopicOpen, setCreateTopicOpen] = useState(false);
  const [editPostId, setEditPostId] = useState<string | null>(null);
  const [postsRefreshKey, setPostsRefreshKey] = useState(0);

  // Follow data — denormalized counts on profile + full lists for the tabs.
  // The full lists do heavy multi-table joins, so we only enable them when
  // the user actually opens the Following / Followers tab. The cheap counts
  // hook drives the badge above the tabs.
  const [followingRequested, setFollowingRequested] = useState(false);
  const [followersRequested, setFollowersRequested] = useState(false);
  const { data: followCounts } = useProfileFollowCounts(targetUserId);
  const { data: followingData } = useFollowing(targetUserId, { enabled: followingRequested });
  const { data: followersData } = useFollowers(targetUserId, { enabled: followersRequested });
  const followingTotal = followingData?.total ?? followCounts?.followingCount ?? 0;
  const followerTotal = followersData?.length ?? followCounts?.followerCount ?? 0;

  // Mark heavy tab queries as requested the first time the tab is activated.
  useEffect(() => {
    if (activeTab === "following") setFollowingRequested(true);
    if (activeTab === "followers") setFollowersRequested(true);
    if (activeTab === "topics") setTopicsRequested(true);
  }, [activeTab]);

  useEffect(() => {
    if (!targetUserId) return;

    // Profile, posts, and comment-count load eagerly — they drive the always-
    // visible header, posts tab (default), and tab counters. Topics and
    // follow lists are deferred until their tabs are actually opened.
    void supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", targetUserId)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data as unknown as Record<string, unknown>);
      });

    void supabase
      .from("posts")
      .select("id, title, content, created_at, comment_count, score, topic_id, topics(name)")
      .eq("author_id", targetUserId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        const mapped: UserPost[] = data.map((p: Record<string, unknown>) => ({
          id: p.id as string,
          title: p.title as string,
          content: p.content as string,
          created_at: p.created_at as string,
          comment_count: p.comment_count as number,
          score: p.score as number,
          topic_name: ((p.topics as Record<string, unknown>)?.name as string) || "General",
        }));
        setUserPosts(mapped);
        setPostCount(mapped.length);
      });

    void supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("author_id", targetUserId)
      .then(({ count }) => {
        if (count !== null) setCommentCount(count);
      });
  }, [targetUserId, postsRefreshKey]);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDeletePost = async (postId: string) => {
    const { error } = await supabase
      .from("posts")
      .update({ status: "deleted" })
      .eq("id", postId);
    if (error) {
      toast({
        title: "Couldn't delete post",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setUserPosts((prev) => prev.filter((p) => p.id !== postId));
    setPostCount((c) => Math.max(0, c - 1));
    queryClient.invalidateQueries({ queryKey: ["recent-posts"] });
    queryClient.invalidateQueries({ queryKey: ["posts-by-topic"] });
    queryClient.invalidateQueries({ queryKey: ["topics"] });
    toast({ title: "Post deleted" });
  };

  // Topics fetch fires the first time the user opens the Topics tab.
  useEffect(() => {
    if (!topicsRequested) return;
    void supabase
      .from("topics")
      .select("id, name, slug, description, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        setUserTopics(data as UserTopic[]);
        setTopicCount(data.length);
      });
  }, [topicsRequested]);

  const username =
    (profile?.name as string) ||
    (profile?.username as string) ||
    (isOwnProfile ? user?.user_metadata?.username : null) ||
    (isOwnProfile ? user?.email?.split("@")[0] : null) ||
    "User";
  const email = isOwnProfile ? (user?.email || "") : "";
  const hideAge = Boolean((profile as any)?.hide_age) && !isOwnProfile;
  const age = hideAge ? null : calculateAge(
    profile?.birth_year as string | null,
    profile?.birth_month as string | null,
    profile?.birth_day as string | null
  );
  const city = [profile?.city, profile?.state, profile?.country].filter(Boolean).join(", ") || null;
  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const fullBirthday = (() => {
    if (hideAge) return null;
    const y = profile?.birth_year as string | null | undefined;
    const m = profile?.birth_month as string | null | undefined;
    const d = profile?.birth_day as string | null | undefined;
    if (!y && !m && !d) return null;
    const mn = m ? MONTH_NAMES[parseInt(m) - 1] : null;
    return [mn, d, y].filter(Boolean).join(" ").replace(/ (\d{4})$/, ", $1");
  })();
  const educationLabel = profile?.education
    ? EDUCATION_LABELS[profile.education as string] || (profile.education as string)
    : null;
  const joinedDate = profile?.created_at
    ? formatJoinDate(profile.created_at as string)
    : null;

  const profileLoaded = profile !== null;
  const hasEducation = Boolean(
    profile?.education || profile?.high_school || profile?.college || profile?.degree || profile?.major
  );
  const hasWork = Boolean(profile?.job || profile?.entity_type);
  const hasInterests = Boolean(profile?.favorite_movie || profile?.reading);
  const showOwnEmptyState = isOwnProfile && profileLoaded;
  const collegeLine = [
    profile?.degree,
    profile?.major ? `in ${profile.major as string}` : null,
  ].filter(Boolean).join(" ") || null;
  const detailGroups: DetailGroup[] = [
    {
      title: "Personal",
      items: [
        { label: "Sex", value: formatTitleValue(profile?.sex) },
        { label: "Orientation", value: formatTitleValue((profile as any)?.orientation) },
        { label: "Age", value: age !== null ? `${age} years old` : null },
        { label: "Birthday", value: fullBirthday },
        { label: "Lives in", value: city },
        { label: "Born in", value: formatProfileValue(profile?.city_born) },
        { label: "Account type", value: formatTitleValue(profile?.entity_type) },
      ],
    },
    {
      title: "Education",
      items: [
        { label: "Education level", value: educationLabel },
        { label: "High school", value: formatProfileValue(profile?.high_school) },
        { label: "College", value: formatProfileValue(profile?.college) },
        { label: "Degree", value: formatProfileValue(profile?.degree) },
        { label: "Major", value: formatProfileValue(profile?.major) },
      ],
    },
    {
      title: "Career",
      items: [{ label: "Job", value: formatProfileValue(profile?.job) }],
    },
    {
      title: "Interests",
      items: [
        { label: "Favorite movie", value: formatProfileValue(profile?.favorite_movie) },
        { label: "Reading", value: formatProfileValue(profile?.reading) },
      ],
    },
  ]
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.value !== null && item.value !== ""),
    }))
    .filter((group) => group.items.length > 0);
  const hasAboutContent = Boolean(profile?.bio) || detailGroups.length > 0;

  // Build credentials from profile data dynamically
  const credentials: { icon: string; text: string }[] = [];
  if (postCount > 0) {
    credentials.push({ icon: "pencil", text: `Writer — ${postCount} post${postCount !== 1 ? "s" : ""}` });
  }
  if (profile?.college) {
    const collegeText = profile?.degree
      ? `${profile.degree}${profile?.major ? ` in ${profile.major as string}` : ""}, ${profile.college as string}`
      : (profile.college as string);
    credentials.push({ icon: "graduation", text: collegeText });
  }
  if (profile?.high_school) {
    credentials.push({ icon: "graduation", text: profile.high_school as string });
  }
  if (profile?.job) {
    credentials.push({ icon: "briefcase", text: profile.job as string });
  }
  if (profile?.entity_type && (profile.entity_type as string).toLowerCase() !== "person") {
    credentials.push({ icon: "award", text: `Organization — ${profile.entity_type as string}` });
  }

  const TABS = [
    { value: "posts", label: "Posts", count: postCount },
    { value: "topics", label: "Topics", count: topicCount },
    { value: "comments", label: "Comments", count: commentCount },
    { value: "favorites", label: "Favorites", count: 0 },
    { value: "following", label: "Following", count: followingTotal },
    { value: "followers", label: "Followers", count: followerTotal },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <DeetHeader />
      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-5xl">
          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-x-8 gap-y-6">
            {/* Top content */}
            <div className="min-w-0 lg:col-start-1 lg:row-start-1">
              {/* Avatar + basic info */}
              <div className="flex items-start gap-5 mb-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 ring-4 ring-card">
                    {profile?.avatar_url && (
                      <AvatarImage src={profile.avatar_url as string} alt="Profile avatar" />
                    )}
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      <User className="h-10 w-10" />
                    </AvatarFallback>
                  </Avatar>
                  {isOwnProfile && (
                    <button
                      onClick={() => navigate("/profile/edit")}
                      className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold truncate">{username}</h1>
                    {isOwnProfile && (
                      <button
                        onClick={() => navigate("/profile/edit")}
                        className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                        title="Edit profile"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {!isOwnProfile && targetUserId && (
                      <FollowUserButton targetUserId={targetUserId} />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{email}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <button
                      type="button"
                      onClick={() => setActiveTab("followers")}
                      className="hover:underline"
                    >
                      <span className="font-semibold tabular-nums">{followerTotal}</span>
                      <span className="text-muted-foreground ml-1">
                        {followerTotal === 1 ? "follower" : "followers"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("following")}
                      className="hover:underline"
                    >
                      <span className="font-semibold tabular-nums">{followingTotal}</span>
                      <span className="text-muted-foreground ml-1">following</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick facts strip — single line of who/where */}
              {(profile?.sex || age !== null || city || profile?.city_born || fullBirthday || profile?.entity_type) && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-6 text-sm text-muted-foreground">
                  {profile?.sex && (
                    <span className="capitalize">{profile.sex as string}</span>
                  )}
                  {(profile as any)?.orientation && (
                    <span className="capitalize">{(profile as any).orientation as string}</span>
                  )}
                  {age !== null && <span>{age} years old</span>}
                  {fullBirthday && <span>Born {fullBirthday}</span>}
                  {city && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {city}
                    </span>
                  )}
                  {profile?.city_born && (
                    <span>From {profile.city_born as string}</span>
                  )}
                  {profile?.entity_type && (
                    <span className="inline-flex items-center gap-1 capitalize">
                      <Building2 className="h-3.5 w-3.5" />
                      {profile.entity_type as string}
                    </span>
                  )}
                </div>
              )}

              <Separator className="mb-6" />

              {/* About / Bio */}
              <section className="mb-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  About
                </h2>
                {profile?.bio ? (
                  <p className="text-sm leading-relaxed">{profile.bio as string}</p>
                ) : profileLoaded && !hasAboutContent ? (
                  <p className="text-sm text-muted-foreground italic">
                    No bio yet.
                    {isOwnProfile && (
                      <>
                        {" "}
                        <button
                          onClick={() => navigate("/profile/edit")}
                          className="text-primary hover:underline"
                        >
                          Add one
                        </button>
                      </>
                    )}
                  </p>
                ) : null}
                {(detailGroups.length > 0 || hasWork || hasInterests || showOwnEmptyState) && (
                  <button
                    type="button"
                    onClick={() => setMoreInfoExpanded((v) => !v)}
                    aria-expanded={moreInfoExpanded}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-5"
                  >
                    More Info...
                    {moreInfoExpanded ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                )}
                {moreInfoExpanded && detailGroups.length > 0 && (
                  <div className="mt-3 space-y-5">
                    {detailGroups.map((group) => (
                      <div key={group.title} className="border-t pt-4">
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {group.title}
                        </h3>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                          {group.items.map((item) => (
                            <div key={`${group.title}-${item.label}`} className="min-w-0">
                              <dt className="text-xs text-muted-foreground">{item.label}</dt>
                              <dd className="mt-0.5 font-medium text-foreground break-words">
                                {item.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Work — single card, self-hides when empty (gated by more info toggle) */}
              {moreInfoExpanded && (hasWork || showOwnEmptyState) && (
                <div className="mb-6">
                  {hasWork ? (
                    <Card className="bg-card">
                      <CardContent className="pt-5">
                        <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          <h3 className="text-xs font-semibold uppercase tracking-wider">
                            Work
                          </h3>
                        </div>
                        <div className="space-y-2 text-sm">
                          {profile?.job && (
                            <p className="font-medium">{profile.job as string}</p>
                          )}
                          {profile?.entity_type && (
                            <p className="inline-flex items-center gap-1 text-muted-foreground text-xs capitalize">
                              <Building2 className="h-3.5 w-3.5" />
                              {profile.entity_type as string}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : showOwnEmptyState ? (
                    <Card className="bg-card border-dashed">
                      <CardContent className="pt-5">
                        <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          <h3 className="text-xs font-semibold uppercase tracking-wider">
                            Work
                          </h3>
                        </div>
                        <button
                          onClick={() => navigate("/profile/edit")}
                          className="text-sm text-primary hover:underline"
                        >
                          Add your work
                        </button>
                      </CardContent>
                    </Card>
                  ) : null}
                </div>
              )}

              {/* Interests — only when at least one field exists (gated by more info toggle) */}
              {moreInfoExpanded && hasInterests && (
                <section className="mb-6">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    A little about me
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {profile?.favorite_movie && (
                      <Badge variant="secondary" className="font-normal gap-1.5 py-1 px-2.5">
                        <Film className="h-3.5 w-3.5" />
                        <span className="text-muted-foreground">Fav movie:</span>
                        <span className="font-medium">{profile.favorite_movie as string}</span>
                      </Badge>
                    )}
                    {profile?.reading && (
                      <Badge variant="secondary" className="font-normal gap-1.5 py-1 px-2.5">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span className="text-muted-foreground">Reading:</span>
                        <span className="font-medium">{profile.reading as string}</span>
                      </Badge>
                    )}
                  </div>
                </section>
              )}
              {moreInfoExpanded && !hasInterests && showOwnEmptyState && (
                <section className="mb-6">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    A little about me
                  </h2>
                  <button
                    onClick={() => navigate("/profile/edit")}
                    className="text-sm text-primary hover:underline"
                  >
                    Add a favorite movie or what you're reading
                  </button>
                </section>
              )}
            </div>

            {/* Right sidebar */}
            <aside className="space-y-6 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-20 lg:self-start">
              {/* Credentials & Highlights */}
              <Card className="bg-card">
                <CardContent className="pt-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Credentials & Highlights
                  </h3>
                  <div className="space-y-3">
                    {credentials.map((cred, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-sm">
                        <span className="text-primary shrink-0">
                          {CREDENTIAL_ICON_MAP[cred.icon] || (
                            <Pencil className="h-4 w-4" />
                          )}
                        </span>
                        <span>{cred.text}</span>
                      </div>
                    ))}
                    {joinedDate && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <span className="text-primary shrink-0">
                          <Calendar className="h-4 w-4" />
                        </span>
                        <span>Joined {joinedDate}</span>
                      </div>
                    )}
                    {credentials.length === 0 && !joinedDate && (
                      <p className="text-sm text-muted-foreground italic">
                        No credentials yet.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Knows About — only show if profile has expertise (future: from DB) */}
            </aside>

          {/* Tabs section */}
          <div className="mt-8 min-w-0 lg:col-span-2 lg:row-start-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 gap-0">
                {TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm font-medium"
                  >
                    {tab.label}
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      {tab.count}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="posts" className="mt-4">
                {userPosts.length === 0 ? (
                  <Card className="bg-card">
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <p className="text-sm">No posts yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {userPosts.map((post) => {
                      const postHref = `/topic/${encodeURIComponent(post.topic_name)}/post/${buildPostSlug(post.title || post.content, post.id) || post.id}`;
                      return (
                        <Card key={post.id} className="group bg-card hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                {post.title && (
                                  <a
                                    href={postHref}
                                    className="block font-semibold text-base text-primary hover:underline truncate mb-1"
                                  >
                                    {formatTitle(post.title)}
                                  </a>
                                )}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                                  <a
                                    href={`/topic/${encodeURIComponent(post.topic_name)}`}
                                    className="text-primary hover:underline"
                                  >
                                    {post.topic_name}
                                  </a>
                                  <span aria-hidden>·</span>
                                  <span>{getTimeAgo(post.created_at)}</span>
                                  <span aria-hidden>·</span>
                                  <button
                                    type="button"
                                    onClick={() => navigate(`${postHref}#comments`)}
                                    className="inline-flex items-center gap-1 hover:text-foreground"
                                  >
                                    <MessageSquare className="h-3 w-3" />
                                    <span className="tabular-nums">{post.comment_count}</span>
                                  </button>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 break-words">
                                  {post.content}
                                </p>
                              </div>
                              {isOwnProfile && (
                                <div className="flex items-center gap-0.5 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={() => setEditPostId(post.id)}
                                    title="Edit"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        title="Delete"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          The post will be removed from public view. This cannot be undone from your profile.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeletePost(post.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="topics" className="mt-4">
                {isOwnProfile && (
                  <div className="mb-4">
                    <Button size="sm" onClick={() => setCreateTopicOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Suggest a Topic
                    </Button>
                    <CreateTopicDialog
                      open={createTopicOpen}
                      onOpenChange={setCreateTopicOpen}
                      onTopicCreated={() => {
                        // Refetch topics
                        supabase
                          .from("topics")
                          .select("id, name, slug, description, created_at")
                          .order("created_at", { ascending: false })
                          .then(({ data }) => {
                            if (data) {
                              setUserTopics(data as UserTopic[]);
                              setTopicCount(data.length);
                            }
                          });
                      }}
                    />
                  </div>
                )}
                {userTopics.length === 0 ? (
                  <Card className="bg-card">
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <p className="text-sm">No topics created yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {userTopics.map((topic) => (
                      <Card key={topic.id} className="bg-card hover:shadow-md transition-shadow">
                        <CardContent className="pt-4 pb-3">
                          <div className="flex items-start gap-3">
                            <Hash className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <a
                                  href={`/topic/${encodeURIComponent(topic.name)}`}
                                  className="font-semibold text-sm hover:underline"
                                >
                                  {topic.name}
                                </a>
                              </div>
                              {topic.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {topic.description}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                Created {getTimeAgo(topic.created_at)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {["comments", "favorites"].map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-4">
                  <Card className="bg-card">
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <p className="text-sm">Coming soon</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}

              <TabsContent value="following" className="mt-4">
                {followingTotal === 0 ? (
                  <Card className="bg-card">
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <p className="text-sm">
                        {isOwnProfile ? "You aren't" : `${username} isn't`} following anything yet.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-8">
                    {followingData?.users.length ? (
                      <section>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                          <UserCircle2 className="h-4 w-4" />
                          People ({followingData.users.length})
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {followingData.users.map((u) => (
                            <Card key={u.id} className="bg-card hover:shadow-md transition-shadow">
                              <CardContent className="py-3 px-4">
                                <a
                                  href={`/profile/${u.id}`}
                                  className="flex items-center gap-3 min-w-0"
                                >
                                  <Avatar className="h-10 w-10 shrink-0">
                                    {u.avatarUrl && <AvatarImage src={u.avatarUrl} />}
                                    <AvatarFallback>
                                      <User className="h-5 w-5 text-muted-foreground" />
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-sm text-primary hover:underline truncate">
                                      {u.name || u.username || "User"}
                                    </p>
                                    {u.username && u.name && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        @{u.username}
                                      </p>
                                    )}
                                  </div>
                                </a>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </section>
                    ) : null}

                    {followingData?.topics.length ? (
                      <section>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          Topics ({followingData.topics.length})
                        </h3>
                        <div className="space-y-3">
                          {followingData.topics.map((t) => (
                            <Card key={t.id} className="bg-card hover:shadow-md transition-shadow">
                              <CardContent className="py-3 px-4">
                                <a
                                  href={`/topic/${encodeURIComponent(t.name)}`}
                                  className="font-semibold text-sm text-primary hover:underline"
                                >
                                  {t.name}
                                </a>
                                {t.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                                    {t.description}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </section>
                    ) : null}

                    {followingData?.posts.length ? (
                      <section>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                          <Bookmark className="h-4 w-4" />
                          Posts ({followingData.posts.length})
                        </h3>
                        <div className="space-y-3">
                          {followingData.posts.map((p) => (
                            <Card key={p.id} className="bg-card hover:shadow-md transition-shadow">
                              <CardContent className="py-3 px-4">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                  <a
                                    href={`/topic/${encodeURIComponent(p.topicName)}`}
                                    className="text-primary hover:underline"
                                  >
                                    {p.topicName}
                                  </a>
                                  {p.authorUsername && (
                                    <>
                                      <span>·</span>
                                      <a
                                        href={`/profile/${p.authorId}`}
                                        className="text-primary hover:underline"
                                      >
                                        @{p.authorUsername}
                                      </a>
                                    </>
                                  )}
                                  <span>·</span>
                                  <span>followed {getTimeAgo(p.followedAt)}</span>
                                </div>
                                <a
                                  href={`/topic/${encodeURIComponent(p.topicName)}/post/${buildPostSlug(p.title, p.id) || p.rank}`}
                                  className="font-semibold text-sm text-primary hover:underline"
                                >
                                  {p.rank}. {p.title}
                                </a>
                                {p.content && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                    {p.content}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                                  <span className="tabular-nums">
                                    ★ {p.averageRating.toFixed(1)} ({p.ratingCount})
                                  </span>
                                  <span className="tabular-nums">
                                    {p.commentCount} comment{p.commentCount === 1 ? "" : "s"}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </section>
                    ) : null}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="followers" className="mt-4">
                {followerTotal === 0 ? (
                  <Card className="bg-card">
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <p className="text-sm">
                        {isOwnProfile ? "You don't" : `${username} doesn't`} have any followers yet.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {followersData?.map((u) => (
                      <Card key={u.id} className="bg-card hover:shadow-md transition-shadow">
                        <CardContent className="py-3 px-4">
                          <a
                            href={`/profile/${u.id}`}
                            className="flex items-center gap-3 min-w-0"
                          >
                            <Avatar className="h-10 w-10 shrink-0">
                              {u.avatarUrl && <AvatarImage src={u.avatarUrl} />}
                              <AvatarFallback>
                                <User className="h-5 w-5 text-muted-foreground" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm text-primary hover:underline truncate">
                                {u.name || u.username || "User"}
                              </p>
                              {u.username && u.name && (
                                <p className="text-xs text-muted-foreground truncate">
                                  @{u.username}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Followed {getTimeAgo(u.followedAt)}
                              </p>
                            </div>
                          </a>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          </div>
        </div>
      </main>
      <DeetFooter />
      <EditPostDialog
        postId={editPostId}
        open={!!editPostId}
        onOpenChange={(open) => {
          if (!open) setEditPostId(null);
        }}
        onSaved={() => setPostsRefreshKey((k) => k + 1)}
      />
    </div>
  );
};

export default ProfileView;
