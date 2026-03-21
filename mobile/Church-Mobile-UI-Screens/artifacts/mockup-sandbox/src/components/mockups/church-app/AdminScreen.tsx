import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  DollarSign,
  MessageSquare,
  Bell,
  Settings,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  LogOut,
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  UserPlus,
  Upload,
  PlusCircle,
} from "lucide-react";

const stats = [
  { label: "Total Members", value: "1,248", change: "+12", up: true, color: "from-blue-600 to-blue-700", icon: Users },
  { label: "Monthly Giving", value: "$24,830", change: "+8.2%", up: true, color: "from-emerald-600 to-emerald-700", icon: DollarSign },
  { label: "Sermon Views", value: "3,941", change: "+21%", up: true, color: "from-purple-600 to-purple-700", icon: BookOpen },
  { label: "Events This Month", value: "7", change: "-2", up: false, color: "from-amber-600 to-amber-700", icon: Calendar },
];

const recentActivity = [
  { icon: UserPlus, text: "New member: Rebecca Osei", time: "2m ago", color: "text-blue-400" },
  { icon: DollarSign, text: "Donation received: $500", time: "14m ago", color: "text-emerald-400" },
  { icon: MessageSquare, text: "Prayer request from J. Mensah", time: "31m ago", color: "text-purple-400" },
  { icon: Upload, text: "Sermon uploaded: \"The Promised Land\"", time: "1h ago", color: "text-amber-400" },
  { icon: CheckCircle, text: "Event confirmed: Easter Night", time: "2h ago", color: "text-green-400" },
];

const pendingItems = [
  { label: "New member approvals", count: 4, status: "warning" },
  { label: "Unread prayer requests", count: 11, status: "alert" },
  { label: "Event registrations", count: 67, status: "info" },
  { label: "Scheduled announcements", count: 2, status: "info" },
];

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Users, label: "Members", active: false },
  { icon: BookOpen, label: "Sermons", active: false },
  { icon: Calendar, label: "Events", active: false },
  { icon: DollarSign, label: "Finance", active: false },
  { icon: Settings, label: "Settings", active: false },
];

export function AdminScreen() {
  return (
    <div
      className="min-h-screen bg-[#0b0f1c] text-white flex flex-col"
      style={{ fontFamily: "'Inter', sans-serif", maxWidth: 390, margin: "0 auto" }}
    >
      {/* Status Bar */}
      <div className="flex justify-between items-center px-5 pt-3 pb-1 text-xs text-gray-300">
        <span className="font-semibold">9:41</span>
        <div className="flex gap-1 items-center">
          <div className="flex gap-[2px] items-end">
            <div className="w-[3px] h-[6px] bg-white rounded-sm opacity-40"></div>
            <div className="w-[3px] h-[9px] bg-white rounded-sm opacity-70"></div>
            <div className="w-[3px] h-[12px] bg-white rounded-sm"></div>
          </div>
          <div className="w-6 h-3 border border-white rounded-sm relative ml-1">
            <div className="absolute inset-[2px] right-[6px] bg-white rounded-[1px]"></div>
            <div className="absolute right-[-3px] top-[3px] w-[2px] h-[6px] bg-white rounded-r-sm"></div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center px-5 py-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <p className="text-xs text-amber-400 font-semibold tracking-widest uppercase">Admin Panel</p>
          </div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-gray-300" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center">15</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-sm font-bold">
            A
          </div>
        </div>
      </div>

      {/* Admin Info Banner */}
      <div className="mx-4 mb-4 rounded-xl bg-gradient-to-r from-[#1a1f35] to-[#1e2540] border border-white/10 px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center font-bold text-white">PA</div>
        <div className="flex-1">
          <p className="text-white font-semibold text-sm">Pastor Admin</p>
          <p className="text-gray-400 text-xs">Super Admin • Grace Fellowship</p>
        </div>
        <button className="flex items-center gap-1 text-red-400 text-xs font-medium">
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>

      {/* Stats Grid */}
      <div className="px-4 mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Overview</h3>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.label} className={`rounded-xl bg-gradient-to-br ${s.color} p-3`}>
              <div className="flex justify-between items-start mb-2">
                <s.icon className="w-5 h-5 text-white/70" />
                <span
                  className={`text-[10px] font-bold flex items-center gap-0.5 ${s.up ? "text-white/90" : "text-red-200"}`}
                >
                  {s.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {s.change}
                </span>
              </div>
              <p className="text-white font-black text-lg leading-none">{s.value}</p>
              <p className="text-white/70 text-[11px] mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Actions */}
      <div className="px-4 mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Needs Attention</h3>
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden divide-y divide-white/8">
          {pendingItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3 px-4 py-3">
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  item.status === "alert"
                    ? "bg-red-400"
                    : item.status === "warning"
                    ? "bg-amber-400"
                    : "bg-blue-400"
                }`}
              ></div>
              <span className="flex-1 text-sm text-white/80">{item.label}</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  item.status === "alert"
                    ? "bg-red-500/20 text-red-400"
                    : item.status === "warning"
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-blue-500/20 text-blue-400"
                }`}
              >
                {item.count}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick Admin Actions */}
      <div className="px-4 mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: UserPlus, label: "Add Member", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
            { icon: Upload, label: "Upload Sermon", color: "bg-purple-500/15 text-purple-400 border-purple-500/20" },
            { icon: PlusCircle, label: "New Event", color: "bg-green-500/15 text-green-400 border-green-500/20" },
            { icon: MessageSquare, label: "Announcement", color: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
            { icon: DollarSign, label: "View Giving", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
            { icon: Settings, label: "Settings", color: "bg-gray-500/15 text-gray-400 border-gray-500/20" },
          ].map((action) => (
            <button
              key={action.label}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${action.color}`}
            >
              <action.icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold text-center leading-tight">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Recent Activity</h3>
          <span className="text-xs text-amber-400">View All</span>
        </div>
        <div className="flex flex-col gap-2">
          {recentActivity.map((item, i) => (
            <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl px-3 py-2.5 border border-white/8">
              <div className={`${item.color} mt-0.5 flex-shrink-0`}>
                <item.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-xs leading-snug">{item.text}</p>
              </div>
              <span className="text-gray-500 text-[10px] flex-shrink-0 mt-0.5">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-[#111827] border-t border-white/10 flex justify-around py-3 px-1">
        {navItems.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1">
            <item.icon className={`w-5 h-5 ${item.active ? "text-amber-400" : "text-gray-500"}`} />
            <span className={`text-[9px] font-medium ${item.active ? "text-amber-400" : "text-gray-500"}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <div className="h-20"></div>
    </div>
  );
}
