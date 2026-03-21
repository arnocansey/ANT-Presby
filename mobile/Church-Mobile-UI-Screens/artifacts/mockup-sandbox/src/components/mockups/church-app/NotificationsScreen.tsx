import { ChevronLeft, Bell, Settings, BookOpen, Calendar, Heart, Gift, Users, Check } from "lucide-react";
import { useState } from "react";

const notifications = [
  { id: 1, type: "sermon", icon: BookOpen, color: "bg-purple-500", title: "New Sermon Available", body: "\"Walking in the Light of God\" by Pastor David is now live.", time: "2 min ago", unread: true },
  { id: 2, type: "event", icon: Calendar, color: "bg-green-500", title: "Event Reminder", body: "Easter Prayer Night starts in 3 days. You have an RSVP confirmed.", time: "1h ago", unread: true },
  { id: 3, type: "prayer", icon: Heart, color: "bg-rose-500", title: "Prayer Update", body: "Rebecca shared an update on her prayer request. God answered! 🙌", time: "3h ago", unread: true },
  { id: 4, type: "giving", icon: Gift, color: "bg-amber-500", title: "Giving Receipt", body: "Your $150 tithe for March has been received. Thank you!", time: "1d ago", unread: false },
  { id: 5, type: "group", icon: Users, color: "bg-blue-500", title: "Group Message", body: "Your Wednesday Men's Group has a new message from Elder Mark.", time: "1d ago", unread: false },
  { id: 6, type: "event", icon: Calendar, color: "bg-teal-500", title: "New Event Posted", body: "\"Women's Conference 2026\" has been added. Early bird registration open!", time: "2d ago", unread: false },
  { id: 7, type: "announcement", icon: Bell, color: "bg-indigo-500", title: "Church Announcement", body: "Sunday service will begin 30 minutes earlier this week at 9:30 AM.", time: "3d ago", unread: false },
  { id: 8, type: "giving", icon: Gift, color: "bg-emerald-500", title: "Recurring Gift Processed", body: "Your monthly recurring gift of $50 to the Building Fund was processed.", time: "5d ago", unread: false },
];

export function NotificationsScreen() {
  const [readSet, setReadSet] = useState<Set<number>>(new Set());

  const markRead = (id: number) => setReadSet(s => new Set([...s, id]));
  const markAll = () => setReadSet(new Set(notifications.map(n => n.id)));

  const unreadCount = notifications.filter(n => !n.unread || !readSet.has(n.id) ? false : true).length;
  const actualUnread = notifications.filter(n => n.unread && !readSet.has(n.id)).length;

  return (
    <div className="min-h-screen bg-[#0b0f1c] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif", maxWidth: 390, margin: "0 auto" }}>
      {/* Status Bar */}
      <div className="flex justify-between items-center px-5 pt-3 pb-1 text-xs text-gray-300">
        <span className="font-semibold">9:41</span>
        <div className="w-6 h-3 border border-white rounded-sm relative ml-1">
          <div className="absolute inset-[2px] right-[6px] bg-white rounded-[1px]"></div>
          <div className="absolute right-[-3px] top-[3px] w-[2px] h-[6px] bg-white rounded-r-sm"></div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8">
        <button className="w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center">
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </button>
        <div className="flex-1 flex items-center gap-2">
          <h1 className="text-lg font-black text-white">Notifications</h1>
          {actualUnread > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">{actualUnread}</span>
          )}
        </div>
        <button className="w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center">
          <Settings className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Mark all read */}
      {actualUnread > 0 && (
        <div className="flex justify-end px-4 pt-2 pb-1">
          <button onClick={markAll} className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
            <Check className="w-3 h-3" /> Mark all as read
          </button>
        </div>
      )}

      {/* Notification groups */}
      <div className="flex-1 overflow-y-auto">
        {/* Today */}
        <div className="px-4 pt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Today</p>
          <div className="flex flex-col gap-2">
            {notifications.slice(0, 3).map(n => {
              const isUnread = n.unread && !readSet.has(n.id);
              return (
                <button key={n.id} onClick={() => markRead(n.id)} className={`flex items-start gap-3 p-3 rounded-2xl text-left transition-all ${isUnread ? "bg-white/6 border border-white/10" : "bg-white/3 border border-white/6"}`}>
                  <div className={`w-10 h-10 rounded-xl ${n.color}/20 flex items-center justify-center flex-shrink-0 relative`}>
                    <n.icon className={`w-5 h-5 text-white opacity-80`} />
                    {isUnread && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 border border-[#0b0f1c]"></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold leading-tight ${isUnread ? "text-white" : "text-gray-300"}`}>{n.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{n.body}</p>
                    <p className="text-gray-600 text-[10px] mt-1">{n.time}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Yesterday */}
        <div className="px-4 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Yesterday</p>
          <div className="flex flex-col gap-2">
            {notifications.slice(3, 6).map(n => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-2xl bg-white/3 border border-white/6">
                <div className={`w-10 h-10 rounded-xl ${n.color}/15 flex items-center justify-center flex-shrink-0`}>
                  <n.icon className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-300 leading-tight">{n.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{n.body}</p>
                  <p className="text-gray-600 text-[10px] mt-1">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Earlier */}
        <div className="px-4 pt-4 pb-8">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Earlier</p>
          <div className="flex flex-col gap-2">
            {notifications.slice(6).map(n => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-2xl bg-white/3 border border-white/6">
                <div className={`w-10 h-10 rounded-xl ${n.color}/15 flex items-center justify-center flex-shrink-0`}>
                  <n.icon className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-400 leading-tight">{n.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{n.body}</p>
                  <p className="text-gray-600 text-[10px] mt-1">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
