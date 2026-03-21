import { ChevronLeft, Search, Filter, UserPlus, ChevronRight, MoreVertical, Check, X, Clock } from "lucide-react";
import { useState } from "react";

const members = [
  { name: "Rebecca Osei", email: "rebecca@email.com", joined: "Mar 18, 2026", role: "Member", status: "pending", initials: "RO", color: "bg-pink-500" },
  { name: "Samuel Mensah", email: "samuel@email.com", joined: "Mar 10, 2026", role: "Member", status: "active", initials: "SM", color: "bg-blue-500" },
  { name: "Grace Addo", email: "grace@email.com", joined: "Feb 28, 2026", role: "Small Group Leader", status: "active", initials: "GA", color: "bg-teal-500" },
  { name: "James Owusu", email: "james@email.com", joined: "Feb 14, 2026", role: "Member", status: "active", initials: "JO", color: "bg-amber-500" },
  { name: "Linda Boateng", email: "linda@email.com", joined: "Jan 30, 2026", role: "Volunteer", status: "active", initials: "LB", color: "bg-purple-500" },
  { name: "Kwame Asante", email: "kwame@email.com", joined: "Jan 15, 2026", role: "Deacon", status: "active", initials: "KA", color: "bg-green-500" },
  { name: "Ama Darko", email: "ama@email.com", joined: "Dec 5, 2025", role: "Member", status: "inactive", initials: "AD", color: "bg-rose-500" },
];

const tabs = ["All", "Pending", "Active", "Inactive"];

export function AdminMembersScreen() {
  const [activeTab, setActiveTab] = useState("All");

  const filtered = members.filter(m => {
    if (activeTab === "All") return true;
    return m.status === activeTab.toLowerCase();
  });

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
          <p className="text-xs text-blue-400 font-semibold uppercase tracking-wide">Admin</p>
          <h1 className="text-lg font-black text-white leading-tight">Members</h1>
        </div>
        <button className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
          <UserPlus className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 px-4 pt-3 pb-3">
        {[
          { label: "Total", value: "1,248", color: "text-blue-400" },
          { label: "Active", value: "1,192", color: "text-emerald-400" },
          { label: "Pending", value: "4", color: "text-amber-400" },
          { label: "Inactive", value: "52", color: "text-gray-400" },
        ].map(s => (
          <div key={s.label} className="flex-1 bg-white/5 border border-white/8 rounded-xl py-2 flex flex-col items-center">
            <p className={`text-base font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center bg-white/6 border border-white/10 rounded-xl px-3 gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input placeholder="Search members..." readOnly className="bg-transparent text-sm text-white placeholder-gray-500 outline-none py-2.5 flex-1" />
          </div>
          <button className="w-10 h-10 bg-white/8 border border-white/10 rounded-xl flex items-center justify-center">
            <Filter className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 mb-3">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${activeTab === tab ? "bg-blue-600 text-white" : "bg-white/5 text-gray-400"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Pending Approvals Banner */}
      {(activeTab === "All" || activeTab === "Pending") && (
        <div className="mx-4 mb-3 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3 flex items-center gap-3">
          <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-amber-300 text-xs flex-1 font-medium">4 new members awaiting approval</p>
          <button className="text-amber-400 text-xs font-bold">Review</button>
        </div>
      )}

      {/* Member List */}
      <div className="flex-1 px-4 flex flex-col gap-2 pb-6">
        {filtered.map((member) => (
          <div key={member.name} className="bg-white/4 border border-white/8 rounded-xl px-3 py-3 flex items-center gap-3">
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full ${member.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
              {member.initials}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white text-sm font-semibold truncate">{member.name}</p>
                {member.status === "pending" && (
                  <span className="bg-amber-500/20 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">NEW</span>
                )}
                {member.status === "inactive" && (
                  <span className="bg-gray-500/20 text-gray-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">INACTIVE</span>
                )}
              </div>
              <p className="text-gray-500 text-xs truncate">{member.email}</p>
              <p className="text-gray-600 text-[10px]">{member.role} · Joined {member.joined}</p>
            </div>
            {/* Actions */}
            {member.status === "pending" ? (
              <div className="flex gap-1.5 flex-shrink-0">
                <button className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-emerald-400" />
                </button>
                <button className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <X className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ) : (
              <button className="flex-shrink-0">
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
