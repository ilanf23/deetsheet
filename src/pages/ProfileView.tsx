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
  Reply,
  Forward,
  Trash2,
  Loader2,
  Plus,
  Hash,
} from "lucide-react";
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
  category_name: string | null;
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

const ProfileView = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);

  // Determine which profile to view: URL param or logged-in user
  const targetUserId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;

  // Profile data from DB
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);

  // Posts & counts from DB
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  // Topics created by user
  const [userTopics, setUserTopics] = useState<UserTopic[]>([]);
  const [topicCount, setTopicCount] = useState(0);
  const [createTopicOpen, setCreateTopicOpen] = useState(false);

  useEffect(() => {
    if (!targetUserId) return;

    const fetchData = async () => {
      setLoading(true);

      // Fetch profile, posts, comment count, and topics in parallel
      const [profileRes, postsRes, commentsRes, topicsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", targetUserId)
          .single(),
        supabase
          .from("posts")
          .select("id, title, content, created_at, comment_count, score, topic_id, topics(name)")
          .eq("author_id", targetUserId)
          .order("created_at", { ascending: false }),
        supabase
          .from("comments")
          .select("id", { count: "exact", head: true })
          .eq("author_id", targetUserId),
        supabase
          .from("topics")
          .select("id, name, slug, description, created_at")
          .order("created_at", { ascending: false }),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
      }

      if (postsRes.data) {
        const mapped: UserPost[] = postsRes.data.map((p: Record<string, unknown>) => ({
          id: p.id as string,
          title: p.title as string,
          content: p.content as string,
          created_at: p.created_at as string,
          comment_count: p.comment_count as number,
          score: p.score as number,
          topic_name: (p.topics as Record<string, unknown>)?.name as string || "General",
        }));
        setUserPosts(mapped);
        setPostCount(mapped.length);
      }

      if (commentsRes.count !== null) {
        setCommentCount(commentsRes.count);
      }

      if (topicsRes.data) {
        setUserTopics(topicsRes.data as UserTopic[]);
        setTopicCount(topicsRes.data.length);
      }

      setLoading(false);
    };

    fetchData();
  }, [targetUserId]);

  const username =
    (profile?.name as string) ||
    (profile?.username as string) ||
    (isOwnProfile ? user?.user_metadata?.username : null) ||
    (isOwnProfile ? user?.email?.split("@")[0] : null) ||
    "User";
  const email = isOwnProfile ? (user?.email || "") : (profile?.email as string || "");
  const age = calculateAge(
    profile?.birth_year as string | null,
    profile?.birth_month as string | null,
    profile?.birth_day as string | null
  );
  const city = [profile?.city, profile?.state].filter(Boolean).join(", ") || null;
  const educationLabel = profile?.education
    ? EDUCATION_LABELS[profile.education as string] || (profile.education as string)
    : null;
  const joinedDate = profile?.created_at
    ? formatJoinDate(profile.created_at as string)
    : null;

  // Build credentials from profile data dynamically
  const credentials: { icon: string; text: string }[] = [];
  if (postCount > 0) {
    credentials.push({ icon: "pencil", text: `Writer — ${postCount} post${postCount !== 1 ? "s" : ""}` });
  }
  if (profile?.college && profile?.degree) {
    credentials.push({ icon: "graduation", text: `${profile.degree}, ${profile.college}` });
  } else if (profile?.college) {
    credentials.push({ icon: "graduation", text: profile.college as string });
  }
  if (profile?.job) {
    credentials.push({ icon: "briefcase", text: profile.job as string });
  }

  const TABS = [
    { value: "posts", label: "Posts", count: postCount },
    { value: "topics", label: "Topics", count: topicCount },
    { value: "comments", label: "Comments", count: commentCount },
    { value: "favorites", label: "Favorites", count: 0 },
    { value: "following", label: "Following", count: 0 },
    { value: "followers", label: "Followers", count: 0 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-accent/30 to-background">
        <DeetHeader />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <DeetFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-accent/30 to-background overflow-x-hidden">
      <DeetHeader />
      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-5xl overflow-hidden">
          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
            {/* Left column */}
            <div className="min-w-0">
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
                  <div className="flex items-center gap-2">
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
                  </div>
                  <p className="text-sm text-muted-foreground">{email}</p>
                </div>
              </div>

              {/* Personal details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 mb-6 text-sm">
                {profile?.sex && (
                  <div>
                    <span className="text-muted-foreground">Sex</span>
                    <p className="font-medium capitalize">{profile.sex as string}</p>
                  </div>
                )}
                {age !== null && (
                  <div>
                    <span className="text-muted-foreground">Age</span>
                    <p className="font-medium">{age}</p>
                  </div>
                )}
                {city && (
                  <div>
                    <span className="text-muted-foreground">City</span>
                    <p className="font-medium">{city}</p>
                  </div>
                )}
                {educationLabel && (
                  <div>
                    <span className="text-muted-foreground">Education</span>
                    <p className="font-medium">{educationLabel}</p>
                  </div>
                )}
                {profile?.favorite_movie && (
                  <div>
                    <span className="text-muted-foreground">Fav Movie</span>
                    <p className="font-medium">{profile.favorite_movie as string}</p>
                  </div>
                )}
                {profile?.reading && (
                  <div>
                    <span className="text-muted-foreground">Reading</span>
                    <p className="font-medium">{profile.reading as string}</p>
                  </div>
                )}
                {profile?.city_born && (
                  <div>
                    <span className="text-muted-foreground">Hometown</span>
                    <p className="font-medium">{profile.city_born as string}</p>
                  </div>
                )}
                {profile?.college && (
                  <div>
                    <span className="text-muted-foreground">College</span>
                    <p className="font-medium">{profile.college as string}</p>
                  </div>
                )}
                {profile?.job && (
                  <div>
                    <span className="text-muted-foreground">Job</span>
                    <p className="font-medium">{profile.job as string}</p>
                  </div>
                )}
              </div>

              <Separator className="mb-6" />

              {/* Bio */}
              {profile?.bio ? (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    About
                  </h2>
                  <p className="text-sm leading-relaxed">{profile.bio as string}</p>
                </div>
              ) : (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    About
                  </h2>
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
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div className="space-y-6">
              {/* Credentials & Highlights */}
              <Card>
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
            </div>
          </div>

          {/* Tabs section */}
          <div className="mt-8">
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
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <p className="text-sm">No posts yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {userPosts.map((post) => (
                      <Card key={post.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-4 pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                <Badge variant="secondary" className="text-xs font-normal">
                                  {post.topic_name}
                                </Badge>
                                <span>{getTimeAgo(post.created_at)}</span>
                              </div>
                              {post.title && (
                                <h4 className="font-semibold text-sm mb-1 line-clamp-1">
                                  {post.title}
                                </h4>
                              )}
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {post.content}
                              </p>
                            </div>
                          </div>
                          <Separator className="my-3" />
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1 text-muted-foreground"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              {post.comment_count}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1 text-muted-foreground"
                            >
                              <Reply className="h-3.5 w-3.5" />
                              Reply
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1 text-muted-foreground"
                            >
                              <Forward className="h-3.5 w-3.5" />
                              Forward
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1 text-muted-foreground ml-auto"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="topics" className="mt-4">
                {isOwnProfile && (
                  <div className="mb-4">
                    <Button size="sm" onClick={() => setCreateTopicOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Topic
                    </Button>
                    <CreateTopicDialog
                      open={createTopicOpen}
                      onOpenChange={setCreateTopicOpen}
                      onTopicCreated={() => {
                        // Refetch topics
                        supabase
                          .from("topics")
                          .select("id, name, slug, category_name, description, created_at")
                          .eq("created_by", targetUserId!)
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
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <p className="text-sm">No topics created yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {userTopics.map((topic) => (
                      <Card key={topic.id} className="hover:shadow-md transition-shadow">
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
                                {topic.category_name && (
                                  <Badge variant="secondary" className="text-xs font-normal">
                                    {topic.category_name}
                                  </Badge>
                                )}
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

              {["comments", "favorites", "following", "followers"].map(
                (tab) => (
                  <TabsContent key={tab} value={tab} className="mt-4">
                    <Card>
                      <CardContent className="py-12 text-center text-muted-foreground">
                        <p className="text-sm">Coming soon</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )
              )}
            </Tabs>
          </div>
        </div>
      </main>
      <DeetFooter />
    </div>
  );
};

export default ProfileView;
