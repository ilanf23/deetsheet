import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  useSetUserMessagingEnabled,
  useUserMessagingEnabled,
} from "@/hooks/useSiteSettings";

/**
 * Platform settings. Currently hosts the member-to-member messaging kill
 * switch — admin↔user messaging is never affected by it.
 */
export default function AdminSettings() {
  const { toast } = useToast();
  const { data: enabled = false, isLoading } = useUserMessagingEnabled();
  const setEnabled = useSetUserMessagingEnabled();

  const toggle = async (value: boolean) => {
    try {
      await setEnabled.mutateAsync(value);
      toast({
        title: value ? "Member messaging enabled" : "Member messaging disabled",
        description: value
          ? "Members can now start conversations with each other."
          : "Members can no longer message each other. Team messaging still works.",
      });
    } catch (e: any) {
      toast({
        title: "Couldn't save setting",
        description: e?.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold" style={{ color: "hsl(var(--admin-fg))" }}>
          Settings
        </h1>
        <p className="mt-1 text-[14px]" style={{ color: "hsl(var(--admin-fg-muted))" }}>
          Platform-wide controls.
        </p>
      </div>

      <div
        className="flex items-start justify-between gap-6 rounded-xl p-6"
        style={{
          backgroundColor: "hsl(var(--admin-surface))",
          border: "1px solid hsl(var(--admin-border))",
        }}
      >
        <div>
          <p className="text-[15px] font-semibold" style={{ color: "hsl(var(--admin-fg))" }}>
            Member-to-member messaging
          </p>
          <p
            className="mt-1 max-w-xl text-[13px] leading-relaxed"
            style={{ color: "hsl(var(--admin-fg-muted))" }}
          >
            When off, members cannot start or continue direct conversations with each
            other anywhere on the site. Messages from the DeetSheet team are unaffected.
          </p>
        </div>
        <Switch
          checked={enabled}
          disabled={isLoading || setEnabled.isPending}
          onCheckedChange={toggle}
          aria-label="Toggle member-to-member messaging"
        />
      </div>
    </div>
  );
}
