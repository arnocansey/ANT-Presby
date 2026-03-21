import { ChevronLeft, Plus, Users, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { useState } from "react";

const weeks = [
  { date: "Mar 16, 2026", service: "Sunday Service", count: 842, prev: 810, type: "Sunday" },
  { date: "Mar 9, 2026", service: "Sunday Service", count: 810, prev: 798, type: "Sunday" },
  { date: "Mar 5, 2026", service: "Midweek Prayer", count: 214, prev: 220, type: "Midweek" },
  { date: "Mar 2, 2026", service: "Sunday Service", count: 798, prev: 775, type: "Sunday" },
  { date: "Feb 23, 2026", service: "Sunday Service", count: 775, prev: 760, type: "Sunday" },
];

const barData = [
  { month: "Oct", val: 710 }, { month: "Nov", val: 740 }, { month: "Dec", val: 820 },
  { month: "Jan", val: 780 }, { month: "Feb", val: 800 }, { month: "Mar", val: 842 },
];
const maxBar = Math.max(...barData.map(b => b.val));

export function AdminAttendanceScreen() {
  const [activeFilter, setActiveFilter] = useState("All");
  const filters = ["All", "Sunday", "Midweek", "Events"];

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
          <p className="text-xs text-cyan-400 font-semibold uppercase tracking-wide">Admin</p>
          <h1 className="text-lg font-black text-white leading-tight">Attendance Tracker</h1>
        </div>
        <button className="flex items-center gap-1.5 bg-cyan-600 text-white text-xs font-bold px-3 py-2 rounded-full">
          <Plus className="w-3.5 h-3.5" />Log
        </button>
      </div>

      {/* Summary cards */}
      <div className="flex gap-3 px-4 pt-3 pb-3">
        {[
          { label: "Last Sunday", value: "842", sub: "+32 vs prev", up: true, color: "text-cyan-400" },
          { label: "Avg (2026)", value: "812", sub: "+5.2% YoY", up: true, color: "text-emerald-400" },
          { label: "Midweek Avg", value: "217", sub: "-3 vs prev", up: false, color: "text-amber-400" },
        ].map(s => (
          <div key={s.label} className="flex-1 bg-white/5 border border-white/8 rounded-xl py-2.5 px-2 flex flex-col items-center text-center">
            <p className={`text-base font-black ${s.color}`}>{s.value}</p>
            <p className="text-gray-500 text-[9px]">{s.label}</p>
            <div className={`flex items-center gap-0.5 text-[9px] mt-0.5 ${s.up ? "text-emerald-400" : "text-red-400"}`}>
              {s.up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="mx-4 mb-4 bg-white/4 border border-white/8 rounded-2xl p-4">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm font-bold text-white">6-Month Trend</p>
          <div className="flex items-center gap-1 text-cyan-400 text-xs">
            <TrendingUp className="w-3 h-3" />Sunday Service
          </div>
        </div>
        <div className="flex items-end gap-2 h-24">
          {barData.map((b, i) => (
            <div key={b.month} className="flex-1 flex flex-col items-center gap-1">
              <p className="text-[9px] text-gray-500">{b.val}</p>
              <div className={`w-full rounded-t-md transition-all ${i === barData.length - 1 ? "bg-cyan-500" : "bg-white/15"}`} style={{ height: `${(b.val / maxBar) * 72}px` }}></div>
              <span className={`text-[9px] ${i === barData.length - 1 ? "text-cyan-400 font-bold" : "text-gray-600"}`}>{b.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 px-4 mb-3">
        {filters.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${activeFilter === f ? "bg-cyan-600 text-white" : "bg-white/5 text-gray-400"}`}>{f}</button>
        ))}
      </div>

      {/* Log list */}
      <div className="flex-1 px-4 flex flex-col gap-2 pb-6">
        {weeks.filter(w => activeFilter === "All" || w.type === activeFilter).map((w, i) => {
          const diff = w.count - w.prev;
          const up = diff >= 0;
          return (
            <div key={i} className="flex items-center gap-3 bg-white/4 border border-white/8 rounded-xl px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">{w.service}</p>
                <p className="text-gray-500 text-xs">{w.date}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-white font-black text-base">{w.count.toLocaleString()}</p>
                <p className={`text-xs font-semibold flex items-center justify-end gap-0.5 ${up ? "text-emerald-400" : "text-red-400"}`}>
                  {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {up ? "+" : ""}{diff}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
