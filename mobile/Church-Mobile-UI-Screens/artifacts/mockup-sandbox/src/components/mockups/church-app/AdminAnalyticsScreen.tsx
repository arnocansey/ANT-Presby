import { ChevronLeft, TrendingUp, TrendingDown, Users, BookOpen, Calendar, Gift, BarChart2, Download } from "lucide-react";
import { useState } from "react";

const kpis = [
  { label: "Active Members", value: "1,192", change: "+4.2%", up: true, icon: Users, color: "text-blue-400", bg: "bg-blue-500/15" },
  { label: "Sermon Plays", value: "3,841", change: "+12.5%", up: true, icon: BookOpen, color: "text-purple-400", bg: "bg-purple-500/15" },
  { label: "Event RSVPs", value: "642", change: "-3.1%", up: false, icon: Calendar, color: "text-green-400", bg: "bg-green-500/15" },
  { label: "Giving Rate", value: "64%", change: "+2.0%", up: true, icon: Gift, color: "text-amber-400", bg: "bg-amber-500/15" },
];

const topSermons = [
  { title: "Walking in the Light", plays: 624, trend: "+22%" },
  { title: "Grace Unlimited", plays: 498, trend: "+14%" },
  { title: "The Power of Prayer", plays: 381, trend: "+8%" },
  { title: "Family Matters Pt.3", plays: 274, trend: "+5%" },
];

const engagementBars = [
  { label: "App Opens", pct: 88 }, { label: "Sermons", pct: 72 }, { label: "Events", pct: 51 },
  { label: "Giving", pct: 64 }, { label: "Prayer Wall", pct: 38 }, { label: "Groups", pct: 29 },
];

export function AdminAnalyticsScreen() {
  const [period, setPeriod] = useState("This Month");

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
          <p className="text-xs text-rose-400 font-semibold uppercase tracking-wide">Admin</p>
          <h1 className="text-lg font-black text-white leading-tight">Analytics Overview</h1>
        </div>
        <button className="w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center">
          <Download className="w-4 h-4 text-gray-300" />
        </button>
      </div>

      {/* Period */}
      <div className="flex gap-2 px-4 pt-3 pb-1">
        {["This Week", "This Month", "This Year"].map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex-1 ${period === p ? "bg-rose-600 border-rose-600 text-white" : "border-white/15 text-gray-400 bg-white/4"}`}>{p}</button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 px-4 mt-3 mb-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white/5 border border-white/8 rounded-2xl p-4">
            <div className={`w-9 h-9 rounded-xl ${k.bg} flex items-center justify-center mb-3`}>
              <k.icon className={`w-4 h-4 ${k.color}`} />
            </div>
            <p className={`text-xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{k.label}</p>
            <div className={`flex items-center gap-1 text-xs font-semibold mt-1.5 ${k.up ? "text-emerald-400" : "text-red-400"}`}>
              {k.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {k.change} vs last
            </div>
          </div>
        ))}
      </div>

      {/* Feature Engagement */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-bold text-white">Feature Engagement</h3>
        </div>
        <div className="bg-white/4 border border-white/8 rounded-2xl p-4 flex flex-col gap-3">
          {engagementBars.map(e => (
            <div key={e.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-300">{e.label}</span>
                <span className="text-white font-bold">{e.pct}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500" style={{ width: `${e.pct}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Sermons */}
      <div className="px-4 mb-4">
        <h3 className="text-sm font-bold text-white mb-3">Top Performing Sermons</h3>
        <div className="flex flex-col gap-2">
          {topSermons.map((s, i) => (
            <div key={s.title} className="flex items-center gap-3 bg-white/4 border border-white/8 rounded-xl px-4 py-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${i === 0 ? "bg-amber-500 text-white" : "bg-white/10 text-gray-400"}`}>#{i + 1}</div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{s.title}</p>
                <p className="text-gray-500 text-xs">{s.plays} plays</p>
              </div>
              <span className="text-emerald-400 text-xs font-bold">{s.trend}</span>
            </div>
          ))}
        </div>
      </div>

      {/* New Members This Month */}
      <div className="px-4 mb-8">
        <h3 className="text-sm font-bold text-white mb-3">New Members This Month</h3>
        <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/20 border border-blue-500/20 rounded-2xl px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-4xl font-black text-white">47</p>
            <p className="text-blue-300 text-xs mt-1">new registrations</p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-emerald-400 text-sm font-bold mb-1"><TrendingUp className="w-4 h-4" />+18%</div>
            <p className="text-gray-500 text-xs">vs last month (40)</p>
            <p className="text-gray-500 text-xs mt-1">Retention rate: <span className="text-white font-bold">91%</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
