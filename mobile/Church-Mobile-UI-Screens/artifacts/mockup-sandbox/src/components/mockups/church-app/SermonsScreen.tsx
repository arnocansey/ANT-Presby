import { Play, Search, Home, BookOpen, Calendar, Gift, UserCircle, Heart, Clock, Filter, Bookmark } from "lucide-react";

const sermons = [
  {
    id: 1,
    title: "Walking in the Light of God",
    pastor: "Pastor David Johnson",
    date: "March 17, 2026",
    series: "Faith & Hope",
    duration: "42:15",
    views: "1.2K",
    gradient: "from-indigo-600 to-purple-700",
    saved: true,
  },
  {
    id: 2,
    title: "The Power of Forgiveness",
    pastor: "Pastor Sarah Williams",
    date: "March 10, 2026",
    series: "Grace Unlimited",
    duration: "38:42",
    views: "984",
    gradient: "from-rose-600 to-pink-700",
    saved: false,
  },
  {
    id: 3,
    title: "Trusting God in Hard Times",
    pastor: "Pastor David Johnson",
    date: "March 3, 2026",
    series: "Faith & Hope",
    duration: "45:20",
    views: "1.5K",
    gradient: "from-teal-600 to-cyan-700",
    saved: true,
  },
  {
    id: 4,
    title: "Building a Kingdom Family",
    pastor: "Elder Mark Thompson",
    date: "Feb 24, 2026",
    series: "Family Matters",
    duration: "36:10",
    views: "871",
    gradient: "from-orange-600 to-amber-700",
    saved: false,
  },
];

const series = ["All", "Faith & Hope", "Grace Unlimited", "Family Matters", "New Beginnings"];

export function SermonsScreen() {
  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif", maxWidth: 390, margin: "0 auto" }}>
      {/* Status Bar */}
      <div className="flex justify-between items-center px-5 pt-3 pb-1 text-xs text-gray-300">
        <span className="font-semibold">9:41</span>
        <div className="w-6 h-3 border border-white rounded-sm relative ml-1">
          <div className="absolute inset-[2px] right-[6px] bg-white rounded-[1px]"></div>
          <div className="absolute right-[-3px] top-[3px] w-[2px] h-[6px] bg-white rounded-r-sm"></div>
        </div>
      </div>

      {/* Header */}
      <div className="px-5 py-3">
        <h1 className="text-2xl font-bold text-white">Sermons</h1>
        <p className="text-gray-400 text-xs mt-1">Watch, listen & grow in faith</p>
      </div>

      {/* Search Bar */}
      <div className="px-4 mb-3">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center bg-white/8 border border-white/10 rounded-xl px-3 gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              className="bg-transparent text-sm text-white placeholder-gray-500 outline-none py-2.5 flex-1"
              placeholder="Search sermons..."
              readOnly
            />
          </div>
          <button className="w-11 h-11 bg-amber-500 rounded-xl flex items-center justify-center">
            <Filter className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Series Filter Pills */}
      <div className="flex gap-2 px-4 mb-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {series.map((s, i) => (
          <button
            key={s}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border ${
              i === 0
                ? "bg-amber-500 border-amber-500 text-white"
                : "border-white/15 text-gray-400 bg-white/5"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Featured Sermon */}
      <div className="px-4 mb-4">
        <div className="relative rounded-2xl overflow-hidden">
          <div className="h-48 bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative w-16 h-16 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/40">
              <Play className="w-8 h-8 text-white fill-white" />
            </div>
            <div className="absolute top-3 left-3 bg-amber-500 rounded-full px-3 py-1 text-xs font-bold">FEATURED</div>
            <div className="absolute bottom-3 right-3 bg-black/50 rounded-full px-2 py-0.5 text-xs text-white">42:15</div>
          </div>
          <div className="bg-white/5 p-4 border-x border-b border-white/10 rounded-b-2xl">
            <p className="text-xs text-amber-400 font-semibold uppercase tracking-wide mb-1">Faith & Hope Series</p>
            <h3 className="text-white font-bold text-base leading-tight">Walking in the Light of God</h3>
            <div className="flex items-center justify-between mt-2">
              <div>
                <p className="text-gray-400 text-xs">Pastor David Johnson</p>
                <p className="text-gray-500 text-xs">March 17, 2026</p>
              </div>
              <div className="flex gap-2">
                <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Bookmark className="w-4 h-4 text-amber-400 fill-amber-400" />
                </button>
                <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sermon List */}
      <div className="px-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Recent Messages</h3>
        <div className="flex flex-col gap-3">
          {sermons.slice(1).map((sermon) => (
            <div key={sermon.id} className="flex gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
              <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${sermon.gradient} flex items-center justify-center flex-shrink-0 relative`}>
                <Play className="w-7 h-7 text-white fill-white opacity-90" />
                <div className="absolute bottom-1 right-1 bg-black/50 rounded px-1 text-[9px] text-white">{sermon.duration}</div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-amber-400 font-medium">{sermon.series}</p>
                <h4 className="text-white font-semibold text-sm leading-tight mt-0.5 line-clamp-2">{sermon.title}</h4>
                <p className="text-gray-400 text-xs mt-1">{sermon.pastor}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-gray-500 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{sermon.duration}</span>
                  <span className="text-gray-500 text-xs">{sermon.views} views</span>
                </div>
              </div>
              <button className="self-start mt-1">
                <Bookmark className={`w-4 h-4 ${sermon.saved ? "text-amber-400 fill-amber-400" : "text-gray-500"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-[#1a1a2e] border-t border-white/10 flex justify-around py-3 px-2">
        {[
          { icon: Home, label: "Home", active: false },
          { icon: BookOpen, label: "Sermons", active: true },
          { icon: Calendar, label: "Events", active: false },
          { icon: Gift, label: "Give", active: false },
          { icon: UserCircle, label: "Profile", active: false },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1">
            <item.icon className={`w-5 h-5 ${item.active ? "text-amber-400" : "text-gray-500"}`} />
            <span className={`text-[10px] font-medium ${item.active ? "text-amber-400" : "text-gray-500"}`}>{item.label}</span>
          </div>
        ))}
      </div>
      <div className="h-20"></div>
    </div>
  );
}
