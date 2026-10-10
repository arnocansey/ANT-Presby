'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/useApi';
import { APP_NAME } from '@/lib/app-config';

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  type: string;
  entity_type?: string | null;
  entity_id?: number | null;
  is_read: boolean;
  created_at: string;
};

export default function NotificationBell() {
  const router = useRouter();
  const { data, isLoading, isError } = useNotifications(1, 10);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const notifications = (data?.notifications || []) as NotificationItem[];
  const unreadCount = data?.unread_count || 0;

  const previousUnreadRef = React.useRef<number>(0);

  React.useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  React.useEffect(() => {
    if (previousUnreadRef.current < unreadCount && Notification.permission === 'granted') {
      const diff = unreadCount - previousUnreadRef.current;
      new Notification(`${APP_NAME} updates`, {
        body: `${diff} new notification${diff > 1 ? 's' : ''}`,
      });
    }
    previousUnreadRef.current = unreadCount;
  }, [unreadCount]);

  const openEntity = (notification: NotificationItem) => {
    if (notification.entity_type === 'event' && notification.entity_id) {
      router.push(`/events/${notification.entity_id}`);
      return;
    }
    if (notification.entity_type === 'prayer') {
      router.push('/dashboard');
      return;
    }
    if (notification.entity_type === 'live') {
      router.push('/live');
      return;
    }
    if (notification.entity_type === 'news' && notification.entity_id) {
      router.push(`/news/${notification.entity_id}`);
      return;
    }
    if (notification.entity_type === 'album' && notification.entity_id) {
      router.push(`/gallery/${notification.entity_id}`);
      return;
    }
    if (notification.entity_type === 'devotional' && notification.entity_id) {
      router.push(`/devotionals/${notification.entity_id}`);
      return;
    }
    if (notification.entity_type === 'group' && notification.entity_id) {
      router.push(`/groups/${notification.entity_id}`);
      return;
    }
    router.push('/dashboard');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          aria-label={unreadCount > 0 ? `Open notifications, ${unreadCount} unread` : 'Open notifications'}
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-1 -top-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger-solid px-1 text-[10px] font-bold text-danger-solid-foreground"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
        <DropdownMenuLabel className="flex items-center justify-between gap-3">
          Notifications
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            className="inline-flex min-h-11 items-center gap-1 rounded px-1 text-xs font-semibold text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Mark all read
          </button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <DropdownMenuItem disabled className="text-muted">
            Loading notifications…
          </DropdownMenuItem>
        ) : isError ? (
          <DropdownMenuItem disabled className="text-muted">
            Notifications couldn&apos;t load right now
          </DropdownMenuItem>
        ) : notifications.length === 0 ? (
          <DropdownMenuItem disabled className="text-muted">
            No notifications yet
          </DropdownMenuItem>
        ) : null}

        {notifications.map((notification) => (
          <DropdownMenuItem
            key={notification.id}
            onClick={() => {
              if (!notification.is_read) {
                markRead.mutate(notification.id);
              }
              openEntity(notification);
            }}
            className="cursor-pointer items-start gap-2 py-2"
          >
            {/* Unread is shown by a dot as well as by colour. */}
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.is_read ? 'bg-transparent' : 'bg-primary'}`}
              aria-hidden="true"
            />
            <div className="w-full min-w-0">
              <p className={`text-sm font-semibold ${notification.is_read ? 'text-muted' : 'text-foreground'}`}>
                {!notification.is_read && <span className="sr-only">Unread: </span>}
                {notification.title}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-muted">{notification.message}</p>
              <p className="mt-1 text-[11px] text-muted">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
