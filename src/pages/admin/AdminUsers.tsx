import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, ChevronDown, Plus } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import AdminSortSelect from "@/components/admin/AdminSortSelect";

type Profile = Tables<"profiles">;
type RoleRow = Tables<"user_roles">;

type RoleFilter = "all" | "admin" | "moderator" | "user";
type StatusFilter = "all" | "active" | "suspended" | "banned";
type SortKey =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc"
  | "username_asc"
  | "username_desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Date joined — Newest" },
  { value: "oldest", label: "Date joined — Oldest" },
  { value: "name_asc", label: "Name — A to Z" },
  { value: "name_desc", label: "Name — Z to A" },
  { value: "username_asc", label: "Username — A to Z" },
  { value: "username_desc", label: "Username — Z to A" },
];

const PAGE_SIZE = 25;

function StatusPill({ status }: { status: "active" | "suspended" | "banned" }) {
  const palette = {
    active: { bg: "hsl(var(--admin-success-soft))", fg: "hsl(var(--admin-success))" },
    suspended: { bg: "hsl(var(--admin-warning-soft))", fg: "hsl(var(--admin-warning))" },
    banned: { bg: "hsl(var(--admin-danger-soft))", fg: "hsl(var(--admin-danger))" },
  }[status];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded text-[12px]"
      style={{ backgroundColor: palette.bg, color: palette.fg }}
    >
      {status === "active" ? "Active" : status === "suspended" ? "Suspended" : "Banned"}
    </span>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState<(Profile & { _email?: string })[]>([]);
  const [roles, setRoles] = useState<Map<string, "admin" | "moderator" | "user">>(new Map());
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAll = async () => {
    setLoading(true);
    const [usersRes, rolesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, name, username, avatar_url, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (usersRes.error) {
      toast({
        title: "Error loading users",
        description: usersRes.error.message,
        variant: "destructive",
      });
    } else {
      setUsers((usersRes.data ?? []) as Profile[]);
    }
    const map = new Map<string, "admin" | "moderator" | "user">();
    (rolesRes.data as RoleRow[] | null)?.forEach((r) => {
      const role = r.role as "admin" | "moderator" | "user";
      if (!map.has(r.user_id)) map.set(r.user_id, role);
    });
    setRoles(map);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = users.filter((u) => {
      const name = (u.name ?? "").toLowerCase();
      const username = (u.username ?? "").toLowerCase();
      const email = ((u as any).email ?? "").toLowerCase();
      const matches = !q || name.includes(q) || username.includes(q) || email.includes(q);
      if (!matches) return false;
      const role = roles.get(u.id) ?? "user";
      if (roleFilter !== "all" && role !== roleFilter) return false;
      const status: "active" | "suspended" | "banned" = "active";
      if (statusFilter !== "all" && status !== statusFilter) return false;
      return true;
    });

    const sorted = [...rows];
    const cmpStr = (a: string, b: string) =>
      a.localeCompare(b, undefined, { sensitivity: "base" });
    const cmpDate = (a?: string | null, b?: string | null) =>
      new Date(a ?? 0).getTime() - new Date(b ?? 0).getTime();

    switch (sort) {
      case "newest":
        sorted.sort((a, b) => cmpDate(b.created_at, a.created_at));
        break;
      case "oldest":
        sorted.sort((a, b) => cmpDate(a.created_at, b.created_at));
        break;
      case "name_asc":
        sorted.sort((a, b) => cmpStr(a.name ?? "", b.name ?? ""));
        break;
      case "name_desc":
        sorted.sort((a, b) => cmpStr(b.name ?? "", a.name ?? ""));
        break;
      case "username_asc":
        sorted.sort((a, b) => cmpStr(a.username ?? "", b.username ?? ""));
        break;
      case "username_desc":
        sorted.sort((a, b) => cmpStr(b.username ?? "", a.username ?? ""));
        break;
    }
    return sorted;
  }, [users, roles, search, roleFilter, statusFilter, sort]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const visibleStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const visibleEnd = Math.min(page * PAGE_SIZE, total);

  const handleEdit = (id: string) => {
    toast({ title: "Edit user", description: `Profile editor coming soon for ${id.slice(0, 8)}…` });
  };
  const handleBan = (name: string) => {
    toast({ title: "Ban user", description: `${name} would be banned (wire up to user_status table).` });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="h-7 w-7 rounded-full animate-spin border-2"
          style={{ borderColor: "hsl(var(--admin-primary))", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  const totalUsersText = `${users.length} total users`;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <h1
          className="text-[40px] font-bold leading-none tracking-tight"
          style={{ color: "hsl(var(--admin-fg))" }}
        >
          Users
        </h1>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] font-medium"
          style={{ backgroundColor: "hsl(var(--admin-primary))", color: "#ffffff" }}
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>
      <p className="text-[13px]" style={{ color: "hsl(var(--admin-fg-muted))" }}>
        {totalUsersText}
      </p>

      <div className="flex flex-wrap items-end gap-4">
        <div className="relative w-full max-w-[340px]">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: "hsl(var(--admin-fg-muted))" }}
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-[14px] focus:outline-none"
            style={{
              backgroundColor: "hsl(var(--admin-surface))",
              border: "1px solid hsl(var(--admin-border))",
              color: "hsl(var(--admin-fg))",
            }}
          />
        </div>

        <FilterSelect
          label="Role"
          value={roleFilter}
          onChange={(v) => {
            setRoleFilter(v as RoleFilter);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All Roles" },
            { value: "admin", label: "Admin" },
            { value: "moderator", label: "Moderator" },
            { value: "user", label: "User" },
          ]}
        />
        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v as StatusFilter);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
            { value: "suspended", label: "Suspended" },
            { value: "banned", label: "Banned" },
          ]}
        />
        <AdminSortSelect
          label="Sort by"
          value={sort}
          onChange={(v) => {
            setSort(v);
            setPage(1);
          }}
          options={SORT_OPTIONS}
        />
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: "hsl(var(--admin-surface))",
          border: "1px solid hsl(var(--admin-border))",
        }}
      >
        <div
          className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] px-6 py-3 text-[12px]"
          style={{
            color: "hsl(var(--admin-fg-muted))",
            borderBottom: "1px solid hsl(var(--admin-border))",
          }}
        >
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>
        {pageRows.length === 0 ? (
          <div className="px-6 py-12 text-center text-[14px]" style={{ color: "hsl(var(--admin-fg-muted))" }}>
            No users match your filters.
          </div>
        ) : (
          pageRows.map((u) => {
            const role = (roles.get(u.id) ?? "user") as "admin" | "moderator" | "user";
            const status: "active" | "suspended" | "banned" = "active";
            const displayName = u.name ?? u.username ?? "—";
            const email = (u as any).email ?? `${u.username ?? "user"}@example.com`;
            return (
              <div
                key={u.id}
                className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] items-center px-6 py-4 text-[14px]"
                style={{ borderBottom: "1px solid hsl(var(--admin-border))" }}
              >
                <span style={{ color: "hsl(var(--admin-fg))" }}>{displayName}</span>
                <span style={{ color: "hsl(var(--admin-fg-muted))" }}>{email}</span>
                <span style={{ color: "hsl(var(--admin-fg))", textTransform: "capitalize" }}>{role}</span>
                <span>
                  <StatusPill status={status} />
                </span>
                <span className="flex items-center justify-end gap-4">
                  <button
                    onClick={() => handleEdit(u.id)}
                    className="text-[14px]"
                    style={{ color: "hsl(var(--admin-primary))" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleBan(displayName)}
                    className="text-[14px]"
                    style={{ color: "hsl(var(--admin-danger))" }}
                  >
                    Ban
                  </button>
                </span>
              </div>
            );
          })
        )}

        <div
          className="flex items-center justify-between px-6 py-4 text-[13px]"
          style={{ color: "hsl(var(--admin-fg-muted))" }}
        >
          <span>
            Showing {visibleStart}–{visibleEnd} of {total} users
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ color: page === 1 ? "hsl(var(--admin-fg-subtle))" : "hsl(var(--admin-primary))" }}
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className="px-1"
                style={{
                  color: page === i + 1 ? "hsl(var(--admin-fg))" : "hsl(var(--admin-fg-muted))",
                  fontWeight: page === i + 1 ? 600 : 400,
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                color:
                  page === totalPages ? "hsl(var(--admin-fg-subtle))" : "hsl(var(--admin-primary))",
              }}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1.5 min-w-[180px]">
      <span className="text-[13px]" style={{ color: "hsl(var(--admin-fg))" }}>
        {label}
      </span>
      <span className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none pl-3.5 pr-10 py-2.5 rounded-lg text-[14px] focus:outline-none"
          style={{
            backgroundColor: "hsl(var(--admin-surface))",
            border: "1px solid hsl(var(--admin-border))",
            color: "hsl(var(--admin-fg))",
          }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
          style={{ color: "hsl(var(--admin-fg-muted))" }}
        />
      </span>
    </label>
  );
}
