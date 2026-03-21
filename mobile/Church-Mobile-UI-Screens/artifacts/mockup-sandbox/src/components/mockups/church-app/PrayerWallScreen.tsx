import { ChevronLeft, Plus, Heart, MessageSquare, Search, Filter, Send } from "lucide-react";
import { useState } from "react";

const prayers = [
  { name: "Rebecca O.", initials: "RO", color: "bg-pink-500", time: "2h ago", category: "Healing", text: "Please pray for my mother's complete recovery from surgery. Trusting God for a miracle.", likes: 24, comments: 8, prayed: false },
  { name: "Samuel M.", initials: "SM", color: "bg-blue-500", time: "5h ago", category: "Family", text: "Asking for prayers over my marriage. God please restore what the enemy has tried to destroy.", likes: 41, comments: 15, prayed: true },
  { name: "Anonymous", initials: "AN", color: "bg-gray-600", time: "1d ago", category: "Work", text: "Believing God for a breakthrough in my career. I've been searching for 6 months. His timing is perfect.", likes: 18, comments: 4, prayed: false },
  { name: "Grace A.", initials: "GA", color: "bg-teal-500", time: "1d ago", category: "Praise", text: "Praising God! My visa was approved after 2 years of waiting. He never fails! 🙌", likes: 87, comments: 32, prayed: false },
  { name: "Kwame A.", initials: "KA", color: "bg-green-500", time: "2d ago", category: "Finances", text: "Trusting God to make a way for my children's school fees. He is Jehovah Jireh.", likes: 29, comments: 7, prayed: true },
];

const categories = ["All", "Healing", "Family", "Work", "Finances", "Praise"];
const catColors: Record<string, string> = { Healing: "text-rose-400 bg-rose-500/15", Family: "text-blue-400 bg-blue-500/15", Work: "text-amber-400 bg-amber-500/15", Finances: "text-emerald-400 bg-emerald-500/15", Praise: "text-purple-400 bg-purple-500/15" };

export function PrayerWallScreen() {
  const [activeTab, setActiveTab] = useState("All");
  const [prayedMap, setPrayedMap] = useState<Record<number, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const togglePrayed = (i: number) => setPrayedMap(p => ({ ...p, [i]: !p[i] }));

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
          <h1 className="text-lg font-black text-white">Prayer Wall</h1>
          <p className="text-gray-500 text-xs">Pray with your church family</p>
        </div>
        <button onClick={() => setShowNew(true)} className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Scripture */}
      <div className="mx-4 mt-3 mb-3 rounded-xl bg-rose-500/8 border border-rose-500/15 px-4 py-2.5 text-center">
        <p className="text-rose-300 text-xs italic">"Pray for each other so that you may be healed." — James 5:16</p>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="flex items-center bg-white/6 border border-white/10 rounded-xl px-3 gap-2">
          <Search className="w-4 h-4 text-gray-500" />
          <input placeholder="Search prayer requests..." readOnly className="bg-transparent text-sm text-white placeholder-gray-500 outline-none py-2.5 flex-1" />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 px-4 mb-3 overflow-x-auto no-scrollbar">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveTab(cat)} className={`px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 border ${activeTab === cat ? "bg-rose-600 border-rose-600 text-white" : "border-white/15 text-gray-400 bg-white/4"}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Prayer Cards */}
      <div className="flex-1 px-4 flex flex-col gap-3 pb-8">
        {prayers.map((p, i) => {
          const isPrayed = prayedMap[i] ?? p.prayed;
          return (
            <div key={i} className="bg-white/4 border border-white/8 rounded-2xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-9 h-9 rounded-full ${p.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{p.initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-bold">{p.name}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${catColors[p.category] || "text-gray-400 bg-gray-500/15"}`}>{p.category}</span>
                  </div>
                  <p className="text-gray-500 text-xs">{p.time}</p>
                </div>
              </div>
              <p className="text-gray-200 text-sm leading-relaxed mb-3">{p.text}</p>
              <div className="flex items-center gap-4">
                <button onClick={() => togglePrayed(i)} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${isPrayed ? "bg-rose-500/20 border-rose-500/40 text-rose-400" : "border-white/15 text-gray-400"}`}>
                  🙏 {isPrayed ? "Praying" : "Pray"} · {p.likes + (isPrayed && !p.prayed ? 1 : 0)}
                </button>
                <button className="flex items-center gap-1.5 text-xs text-gray-500">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {p.comments}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Prayer Modal overlay */}
      {showNew && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end" onClick={() => setShowNew(false)}>
          <div className="w-full bg-[#111827] rounded-t-3xl p-5" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4"></div>
            <h3 className="text-white font-black text-lg mb-3">Share a Prayer Request</h3>
            <textarea rows={4} placeholder="Share what's on your heart..." readOnly className="w-full bg-white/6 border border-white/12 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none resize-none mb-3" />
            <div className="flex gap-3">
              <button className="flex-1 bg-white/8 border border-white/15 text-white font-bold py-3 rounded-xl text-sm">Anonymous</button>
              <button className="flex-[2] bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> Post Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
