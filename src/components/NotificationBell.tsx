import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  type NotificationRow,
} from "@/hooks/useNotifications";

const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unread = notifications.filter((n) => !n.read_at).length;

  const handleClick = (n: NotificationRow) => {
    if (!n.read_at) markRead.mutate(n.id);
    setOpen(false);
    navigate(n.link || "/profile");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          title="Notifications"
          aria-label="Notifications"
          className="relative mr-1 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-secondary text-secondary-foreground text-[10px] font-semibold flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <span className="text-sm font-semibold leading-none text-foreground">
            Notifications
          </span>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              className="text-xs leading-none text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nothing new right now.
            </p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleClick(n)}
                className={`w-full border-b px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent ${
                  n.read_at ? "" : "bg-primary/5"
                }`}
              >
                <span className="block text-sm leading-snug text-foreground">{n.message}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {formatDistanceToNow(parseISO(n.created_at), { addSuffix: true })}
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
