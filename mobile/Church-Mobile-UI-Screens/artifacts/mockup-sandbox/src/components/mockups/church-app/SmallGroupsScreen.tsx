import { ChevronLeft, Search, MapPin, Clock, Users, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";

const groups = [
  { name: "Wednesday Men's Group", day: "Wednesdays", time: "7:00 PM", location: "Room 201", members: 18, max: 25, category: "Men", leader: "Elder Mark Thompson", color: "bg-blue-500", icon: "💪", joined: false },
  { name: "Young Couples Bible Study", day: "Fridays", time: "7:30 PM", location: "Fellowship Hall", members: 12, max: 20, category: "Couples", leader: "James & Linda Owusu", color: "bg-pink-500", icon: "💑", joined: true },
  { name: "Women of Virtue", day: "Tuesdays", time: "6:00 PM", location: "Room 105", members: 22, max: 30, category: "Women", leader: "Sarah Williams", color: "bg-purple-500", icon: "✨", joined: false },
  { name: "Youth Connect Group", day: "Saturdays", time: "4:00 PM", location: "Youth Center", members: 30, max: 40, category: "Youth", leader: "Pastor Kofi Asante", color: "bg-green-500", icon: "🌱", joined: false },
  { name: "Senior Saints Fellowship", day: "Thursdays", time: "10:00 AM", location: "Main Hall", members: 15, max: 30, category: "Seniors", leader: "Deaconess Agnes Brown", color: "bg-amber-500", icon: "🕊️", joined: false },
];

const filters = ["All", "Men", "Women", "Youth", "Couples", "Seniors"];

export function SmallGroupsScreen() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>({});

  const filtered = groups.filter(g => activeFilter === "All" || g.category === activeFilter);
  const toggleJoin = (name: string) => setJoinedMap(m => ({ ...m, [name]: !m[name] }));

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
          <h1 className="text-lg font-black text-white">Small Groups</h1>
          <p className="text-gray-500 text-xs">Find your community</p>
        </div>
      </div>

      {/* Hero banner */}
      <div className="mx-4 mt-4 mb-3 rounded-2xl bg-gradient-to-br from-blue-900/60 to-indigo-900/40 border border-blue-500/20 px-4 py-4 flex items-center gap-4">
        <div className="text-3xl">👥</div>
        <div>
          <p className="text-white font-bold text-sm">Life is better together</p>
          <p className="text-blue-300 text-xs mt-0.5">Join a group and grow in faith with others</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="flex items-center bg-white/6 border border-white/10 rounded-xl px-3 gap-2">
          <Search className="w-4 h-4 text-gray-500" />
          <input placeholder="Search groups..." readOnly className="bg-transparent text-sm text-white placeholder-gray-500 outline-none py-2.5 flex-1" />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-4 mb-3 overflow-x-auto">
        {filters.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 border ${activeFilter === f ? "bg-blue-600 border-blue-600 text-white" : "border-white/15 text-gray-400 bg-white/4"}`}>{f}</button>
        ))}
      </div>

      {/* Group list */}
      <div className="flex-1 px-4 flex flex-col gap-3 pb-6">
        {filtered.map((group) => {
          const isJoined = joinedMap[group.name] ?? group.joined;
          const fillPct = (group.members / group.max) * 100;
          return (
            <div key={group.name} className="bg-white/4 border border-white/8 rounded-2xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-12 h-12 rounded-2xl ${group.color}/20 flex items-center justify-center text-2xl flex-shrink-0`}>{group.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm leading-tight">{group.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">Led by {group.leader}</p>
                </div>
                {isJoined && <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">Joined</span>}
              </div>
              <div className="flex gap-4 mb-3">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {group.day}, {group.time}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin className="w-3 h-3" />
                  {group.location}
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <div className="flex items-center gap-1 text-gray-400"><Users className="w-3 h-3" />{group.members} members</div>
                  <span className="text-gray-500">{group.max - group.members} spots left</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full ${group.color} rounded-full`} style={{ width: `${fillPct}%`, opacity: 0.7 }}></div>
                </div>
              </div>
              <button onClick={() => toggleJoin(group.name)} className={`w-full py-2.5 rounded-xl text-sm font-bold border transition-all ${isJoined ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-blue-500/40 bg-blue-500/10 text-blue-400"}`}>
                {isJoined ? "✓ Joined – View Group" : "Request to Join"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
