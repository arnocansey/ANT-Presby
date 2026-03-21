import { ChevronLeft, Settings, Edit3, BookOpen, Calendar, Heart, Users, Gift, Bell, ChevronRight, LogOut } from "lucide-react";

const recentGifts = [
  { label: "Tithe", amount: "$150", date: "Mar 1" },
  { label: "Building Fund", amount: "$50", date: "Feb 15" },
  { label: "Missions", amount: "$25", date: "Feb 1" },
];

const badges = [
  { label: "Faithful Giver", icon: "🎁", color: "from-amber-600 to-orange-600" },
  { label: "Prayer Warrior", icon: "🙏", color: "from-rose-600 to-pink-600" },
  { label: "Small Group Leader", icon: "👥", color: "from-blue-600 to-indigo-600" },
  { label: "New Member", icon: "⭐", color: "from-teal-600 to-cyan-600" },
];

export function MemberProfileScreen() {
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
      <div className="flex items-center justify-between px-4 py-3">
        <button className="w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center">
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </button>
        <h1 className="text-base font-black text-white">My Profile</h1>
        <button className="w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center">
          <Settings className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Profile Card */}
      <div className="mx-4 mb-4 bg-gradient-to-br from-[#1c2340] to-[#1a1f38] border border-white/10 rounded-3xl p-5 text-center relative">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-3xl mx-auto mb-3 shadow-xl shadow-amber-500/30">
          J
        </div>
        <button className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
          <Edit3 className="w-3.5 h-3.5 text-gray-400" />
        </button>
        <h2 className="text-xl font-black text-white">John Doe</h2>
        <p className="text-gray-400 text-sm">john.doe@email.com</p>
        <p className="text-gray-600 text-xs mt-1">Member since January 2024</p>
        <div className="flex justify-center gap-2 mt-3">
          <span className="bg-amber-500/20 text-amber-400 text-xs font-semibold px-3 py-1 rounded-full">Member</span>
          <span className="bg-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full">Small Group Leader</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 px-4 mb-4">
        {[
          { label: "Sermons Watched", value: "48", icon: BookOpen, color: "text-purple-400" },
          { label: "Events Attended", value: "12", icon: Calendar, color: "text-green-400" },
          { label: "Prayers Prayed", value: "93", icon: Heart, color: "text-rose-400" },
        ].map(s => (
          <div key={s.label} className="flex-1 bg-white/5 border border-white/8 rounded-xl py-3 flex flex-col items-center gap-1">
            <s.icon className={`w-4 h-4 ${s.color}`} />
            <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
            <p className="text-gray-500 text-[9px] text-center leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="px-4 mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">My Badges</h3>
        <div className="grid grid-cols-4 gap-2">
          {badges.map(b => (
            <div key={b.label} className="flex flex-col items-center gap-1.5">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${b.color} flex items-center justify-center text-xl shadow-lg`}>{b.icon}</div>
              <p className="text-gray-400 text-[9px] text-center leading-tight">{b.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Giving Summary */}
      <div className="px-4 mb-4">
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Recent Giving</h3>
          <span className="text-amber-400 text-xs">View All</span>
        </div>
        <div className="bg-white/4 border border-white/8 rounded-2xl divide-y divide-white/6">
          {recentGifts.map((g, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5">
              <div>
                <p className="text-white text-sm font-semibold">{g.label}</p>
                <p className="text-gray-500 text-xs">{g.date}</p>
              </div>
              <p className="text-emerald-400 font-bold text-sm">{g.amount}</p>
            </div>
          ))}
        </div>
      </div>

      {/* My Groups */}
      <div className="px-4 mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">My Small Groups</h3>
        {["Wednesday Men's Group", "Young Couples Bible Study"].map(g => (
          <div key={g} className="flex items-center gap-3 bg-white/4 border border-white/8 rounded-xl px-4 py-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center"><Users className="w-4 h-4 text-blue-400" /></div>
            <p className="text-white text-sm flex-1 font-medium">{g}</p>
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </div>
        ))}
      </div>

      {/* Settings Menu */}
      <div className="px-4 mb-8">
        {[
          { icon: Bell, label: "Notification Preferences" },
          { icon: Gift, label: "Giving History & Receipts" },
          { icon: LogOut, label: "Sign Out", danger: true },
        ].map(item => (
          <div key={item.label} className={`flex items-center gap-3 px-4 py-3.5 border-b border-white/6 ${item.danger ? "text-red-400" : "text-gray-300"}`}>
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium flex-1">{item.label}</span>
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </div>
        ))}
      </div>
    </div>
  );
}
