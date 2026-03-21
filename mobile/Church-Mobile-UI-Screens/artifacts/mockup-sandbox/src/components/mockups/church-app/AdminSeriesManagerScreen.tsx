import { ChevronLeft, Plus, Edit3, Trash2, BookOpen, ChevronRight, MoreVertical } from "lucide-react";
import { useState } from "react";

const series = [
  { title: "Faith & Hope", count: 8, status: "Active", cover: "🌅", color: "from-amber-600 to-orange-600", started: "Jan 2026" },
  { title: "Grace Unlimited", count: 6, status: "Completed", cover: "✨", color: "from-purple-600 to-indigo-600", started: "Oct 2025" },
  { title: "Family Matters", count: 5, status: "Completed", cover: "🏡", color: "from-pink-600 to-rose-600", started: "Aug 2025" },
  { title: "New Beginnings", count: 4, status: "Completed", cover: "🌱", color: "from-green-600 to-teal-600", started: "Jun 2025" },
  { title: "The Power of Prayer", count: 3, status: "Draft", cover: "🙏", color: "from-blue-600 to-cyan-600", started: "Mar 2026" },
];

export function AdminSeriesManagerScreen() {
  const [activeFilter, setActiveFilter] = useState("All");
  const filters = ["All", "Active", "Draft", "Completed"];

  const filtered = series.filter(s => activeFilter === "All" || s.status === activeFilter);

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
          <p className="text-xs text-violet-400 font-semibold uppercase tracking-wide">Admin · Sermons</p>
          <h1 className="text-lg font-black text-white leading-tight">Series Manager</h1>
        </div>
        <button className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-3 px-4 pt-3 pb-3">
        {[
          { label: "Total Series", value: "12", color: "text-violet-400" },
          { label: "Sermons", value: "84", color: "text-purple-400" },
          { label: "Active", value: "1", color: "text-emerald-400" },
          { label: "Drafts", value: "2", color: "text-amber-400" },
        ].map(s => (
          <div key={s.label} className="flex-1 bg-white/5 border border-white/8 rounded-xl py-2 flex flex-col items-center">
            <p className={`text-base font-black ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-gray-500 text-center leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 px-4 mb-3">
        {filters.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${activeFilter === f ? "bg-violet-600 text-white" : "bg-white/5 text-gray-400"}`}>{f}</button>
        ))}
      </div>

      {/* Series List */}
      <div className="flex-1 px-4 flex flex-col gap-3 pb-6">
        {filtered.map((s) => (
          <div key={s.title} className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden">
            {/* Cover */}
            <div className={`h-16 bg-gradient-to-r ${s.color} flex items-center px-4 gap-3 relative`}>
              <span className="text-3xl">{s.cover}</span>
              <div>
                <h3 className="text-white font-black text-base">{s.title}</h3>
                <p className="text-white/60 text-xs">Started {s.started}</p>
              </div>
              <div className="ml-auto">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.status === "Active" ? "bg-emerald-500 text-white" : s.status === "Draft" ? "bg-amber-500/30 text-amber-300 border border-amber-500/40" : "bg-white/20 text-white/70"}`}>
                  {s.status}
                </span>
              </div>
            </div>
            {/* Body */}
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                <BookOpen className="w-4 h-4" />
                <span className="font-semibold text-white">{s.count}</span> sermons
              </div>
              <div className="flex-1"></div>
              <button className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center">
                <Edit3 className="w-3.5 h-3.5 text-gray-400" />
              </button>
              <button className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center">
                <Plus className="w-3.5 h-3.5 text-gray-400" />
              </button>
              <button className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
            {/* Sermon episode list */}
            <div className="border-t border-white/6 px-4 py-2">
              {[1, 2, 3].map(ep => (
                <div key={ep} className="flex items-center gap-2 py-1.5">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-gray-400 font-bold">{ep}</div>
                  <p className="text-gray-400 text-xs flex-1">Episode {ep} — {s.title}</p>
                  <ChevronRight className="w-3 h-3 text-gray-600" />
                </div>
              ))}
              {s.count > 3 && <p className="text-violet-400 text-xs text-center py-1">+ {s.count - 3} more episodes</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
