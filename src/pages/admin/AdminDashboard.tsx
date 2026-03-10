import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, LineChart, Line } from "recharts";
import { Users, FileText, MessageSquare, Hash } from "lucide-react";
import { format, parseISO, startOfMonth, startOfWeek } from "date-fns";

interface ActivityItem {
  type: "post" | "comment";
  content: string;
  author_id: string;
  created_at: string;
}

const signupChartConfig: ChartConfig = {
  count: { label: "Signups", color: "hsl(var(--primary))" },
};

const postsChartConfig: ChartConfig = {
  count: { label: "Posts", color: "hsl(var(--primary))" },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, posts: 0, comments: 0, topics: 0 });
  const [signupData, setSignupData] = useState<{ month: string; count: number }[]>([]);
  const [postData, setPostData] = useState<{ week: string; count: number }[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [usersRes, postsRes, commentsRes, topicsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }),
        supabase.from("comments").select("id", { count: "exact", head: true }),
        supabase.from("topics").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        users: usersRes.count ?? 0,
        posts: postsRes.count ?? 0,
        comments: commentsRes.count ?? 0,
        topics: topicsRes.count ?? 0,
      });

      // Signups by month
      const { data: profiles } = await supabase.from("profiles").select("created_at");
      if (profiles) {
        const grouped: Record<string, number> = {};
        profiles.forEach((p) => {
          const key = format(startOfMonth(parseISO(p.created_at)), "yyyy-MM");
          grouped[key] = (grouped[key] || 0) + 1;
        });
        setSignupData(
          Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, count]) => ({ month, count }))
        );
      }

      // Posts by week
      const { data: allPosts } = await supabase.from("posts").select("created_at");
      if (allPosts) {
        const grouped: Record<string, number> = {};
        allPosts.forEach((p) => {
          const key = format(startOfWeek(parseISO(p.created_at)), "yyyy-MM-dd");
          grouped[key] = (grouped[key] || 0) + 1;
        });
        setPostData(
          Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([week, count]) => ({ week, count }))
        );
      }

      // Recent activity
      const [recentPosts, recentComments] = await Promise.all([
        supabase.from("posts").select("title, author_id, created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("comments").select("content, author_id, created_at").order("created_at", { ascending: false }).limit(10),
      ]);

      const merged: ActivityItem[] = [
        ...(recentPosts.data || []).map((p) => ({ type: "post" as const, content: p.title, author_id: p.author_id, created_at: p.created_at })),
        ...(recentComments.data || []).map((c) => ({ type: "comment" as const, content: c.content, author_id: c.author_id, created_at: c.created_at })),
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      setActivity(merged);
      setLoading(false);
    };

    fetchAll();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  const statCards = [
    { label: "Total Users", value: stats.users, icon: Users },
    { label: "Total Posts", value: stats.posts, icon: FileText },
    { label: "Total Comments", value: stats.comments, icon: MessageSquare },
    { label: "Total Topics", value: stats.topics, icon: Hash },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Signups by Month</CardTitle>
          </CardHeader>
          <CardContent>
            {signupData.length > 0 ? (
              <ChartContainer config={signupChartConfig} className="h-[250px] w-full">
                <BarChart data={signupData}>
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No signup data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Posts by Week</CardTitle>
          </CardHeader>
          <CardContent>
            {postData.length > 0 ? (
              <ChartContainer config={postsChartConfig} className="h-[250px] w-full">
                <LineChart data={postData}>
                  <XAxis dataKey="week" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No post data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {activity.map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <Badge variant={item.type === "post" ? "default" : "secondary"}>
                    {item.type}
                  </Badge>
                  <span className="flex-1 truncate">{item.content}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(parseISO(item.created_at), "MMM d, h:mm a")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
