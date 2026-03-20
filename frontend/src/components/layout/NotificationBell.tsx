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
  const { data } = useNotifications(1, 10);
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
    if (notification.entity_type === 'news' && notification.entity_id) {
      router.push(`/news/${notification.entity_id}`);
      return;
    }
    router.push('/dashboard');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label="Open notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:text-sky-800 dark:text-cyan-300"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length === 0 && (
          <DropdownMenuItem disabled className="text-ui-subtle">
            No notifications yet
          </DropdownMenuItem>
        )}

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
            <div className="w-full">
              <p className={`text-sm font-semibold ${notification.is_read ? 'text-ui-muted' : 'text-slate-900 dark:text-slate-50'}`}>
                {notification.title}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-ui-subtle">{notification.message}</p>
              <p className="mt-1 text-[11px] text-ui-subtle">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
