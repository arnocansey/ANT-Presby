import { ChevronLeft, Mail, Phone, MessageSquare, Edit3, Gift, Calendar, BookOpen, Users, ChevronRight, Check, X } from "lucide-react";

const giving = [
  { label: "Tithe", amount: "$150", date: "Mar 1" },
  { label: "Building Fund", amount: "$50", date: "Feb 15" },
  { label: "Tithe", amount: "$150", date: "Feb 1" },
];

export function AdminMemberDetailScreen() {
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
        <div className="flex-1">
          <p className="text-xs text-blue-400 font-semibold uppercase tracking-wide">Admin · Members</p>
          <h1 className="text-lg font-black text-white leading-tight">Member Detail</h1>
        </div>
        <button className="w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center">
          <Edit3 className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Profile Hero */}
      <div className="mx-4 mt-4 mb-4 bg-gradient-to-br from-[#1c2340] to-[#1a1f38] border border-white/10 rounded-3xl p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-black text-2xl flex-shrink-0 shadow-lg shadow-teal-500/30">GA</div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black text-white">Grace Addo</h2>
          <p className="text-gray-400 text-sm">grace.addo@email.com</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className="bg-teal-500/20 text-teal-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">Small Group Leader</span>
            <span className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">Active</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-2 px-4 mb-4">
        {[
          { label: "Joined", value: "Feb 28", icon: Calendar, color: "text-blue-400" },
          { label: "Sermons", value: "34", icon: BookOpen, color: "text-purple-400" },
          { label: "Given", value: "$820", icon: Gift, color: "text-emerald-400" },
          { label: "Groups", value: "2", icon: Users, color: "text-amber-400" },
        ].map(s => (
          <div key={s.label} className="flex-1 bg-white/5 border border-white/8 rounded-xl py-2.5 flex flex-col items-center gap-1">
            <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
            <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
            <p className="text-gray-600 text-[9px]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="px-4 mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">Contact</h3>
        <div className="flex flex-col gap-2">
          {[
            { icon: Mail, value: "grace.addo@email.com", label: "Email" },
            { icon: Phone, value: "+233 54 123 4567", label: "Phone" },
          ].map(c => (
            <div key={c.label} className="flex items-center gap-3 bg-white/4 border border-white/8 rounded-xl px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center flex-shrink-0">
                <c.icon className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-500 text-[10px]">{c.label}</p>
                <p className="text-white text-sm font-medium truncate">{c.value}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </div>
          ))}
        </div>
      </div>

      {/* Role Management */}
      <div className="px-4 mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">Role & Permissions</h3>
        <div className="bg-white/4 border border-white/8 rounded-2xl divide-y divide-white/6">
          {[
            { role: "Member", active: true },
            { role: "Small Group Leader", active: true },
            { role: "Volunteer", active: false },
            { role: "Deacon/Deaconess", active: false },
          ].map(r => (
            <div key={r.role} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-300">{r.role}</span>
              {r.active ? (
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-emerald-400" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-white/8 flex items-center justify-center">
                  <X className="w-3 h-3 text-gray-600" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Giving History */}
      <div className="px-4 mb-4">
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Giving History</h3>
          <span className="text-xs text-amber-400">Full Report</span>
        </div>
        <div className="flex flex-col gap-2">
          {giving.map((g, i) => (
            <div key={i} className="flex items-center gap-3 bg-white/4 border border-white/8 rounded-xl px-4 py-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center"><Gift className="w-3.5 h-3.5 text-emerald-400" /></div>
              <div className="flex-1"><p className="text-white text-sm font-semibold">{g.label}</p><p className="text-gray-500 text-xs">{g.date}</p></div>
              <p className="text-emerald-400 font-bold text-sm">{g.amount}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-8 flex gap-3">
        <button className="flex items-center gap-2 flex-1 bg-white/8 border border-white/15 text-white font-bold py-3.5 rounded-2xl justify-center text-sm">
          <MessageSquare className="w-4 h-4" /> Message
        </button>
        <button className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-3.5 rounded-2xl text-sm">
          Edit Profile
        </button>
      </div>
    </div>
  );
}
