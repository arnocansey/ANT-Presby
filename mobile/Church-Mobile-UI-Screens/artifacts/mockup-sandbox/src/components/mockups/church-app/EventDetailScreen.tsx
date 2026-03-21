import { ChevronLeft, MapPin, Clock, Calendar, Users, Share2, Heart, Bell, ChevronRight, Check } from "lucide-react";
import { useState } from "react";

const attendees = [
  { color: "bg-pink-500", initial: "R" },
  { color: "bg-blue-500", initial: "S" },
  { color: "bg-teal-500", initial: "G" },
  { color: "bg-amber-500", initial: "J" },
  { color: "bg-purple-500", initial: "L" },
];

export function EventDetailScreen() {
  const [rsvp, setRsvp] = useState(false);
  const [reminded, setReminded] = useState(false);

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

      {/* Hero Banner */}
      <div className="relative">
        <div className="h-52 bg-gradient-to-br from-green-900 via-teal-900 to-[#0b0f1c] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #059669 0%, transparent 60%), radial-gradient(circle at 70% 50%, #0d9488 0%, transparent 60%)" }}></div>
          <div className="relative text-center px-8">
            <p className="text-6xl mb-2">🙏</p>
            <span className="bg-green-600/60 text-green-200 text-xs font-bold px-3 py-1 rounded-full">Prayer Night</span>
          </div>
          <button className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/15 flex items-center justify-center">
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <div className="absolute top-4 right-4 flex gap-2">
            <button className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/15 flex items-center justify-center">
              <Share2 className="w-4 h-4 text-white" />
            </button>
            <button className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/15 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 pt-4">
        {/* Title */}
        <h1 className="text-xl font-black text-white mb-1">Easter Prayer Night 2026</h1>
        <p className="text-gray-400 text-sm mb-4">A night of corporate prayer, worship, and seeking God's face together as a church family.</p>

        {/* Countdown */}
        <div className="bg-gradient-to-r from-amber-600/15 to-orange-600/10 border border-amber-500/25 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
          <span className="text-amber-300 text-xs font-semibold">Starts in</span>
          <div className="flex gap-3">
            {[["03", "Days"], ["14", "Hrs"], ["22", "Min"]].map(([v, l]) => (
              <div key={l} className="text-center">
                <p className="text-white font-black text-lg leading-none">{v}</p>
                <p className="text-amber-500/70 text-[9px]">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-3 mb-4">
          {[
            { icon: Calendar, label: "Date", value: "Friday, March 22, 2026" },
            { icon: Clock, label: "Time", value: "7:00 PM – 9:30 PM" },
            { icon: MapPin, label: "Location", value: "Main Sanctuary, Grace Fellowship" },
          ].map(d => (
            <div key={d.label} className="flex items-center gap-3 bg-white/4 border border-white/8 rounded-xl px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center flex-shrink-0">
                <d.icon className="w-4 h-4 text-gray-300" />
              </div>
              <div>
                <p className="text-gray-500 text-[10px] uppercase tracking-wide">{d.label}</p>
                <p className="text-white text-sm font-semibold">{d.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Attendees */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-bold text-white">142 Going</span>
              <span className="text-gray-500 text-xs">· 58 spots left</span>
            </div>
            <span className="text-xs text-amber-400">View All</span>
          </div>
          <div className="flex items-center gap-1">
            {attendees.map((a, i) => (
              <div key={i} className={`w-8 h-8 rounded-full ${a.color} border-2 border-[#0b0f1c] flex items-center justify-center text-white text-xs font-bold -ml-1 first:ml-0`}>{a.initial}</div>
            ))}
            <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-[#0b0f1c] flex items-center justify-center text-gray-400 text-[10px] font-bold -ml-1">+137</div>
          </div>
          {/* Capacity bar */}
          <div className="h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-500 to-teal-500 rounded-full" style={{ width: "71%" }}></div>
          </div>
          <p className="text-gray-500 text-xs mt-1">142 / 200 capacity</p>
        </div>

        {/* Organizer */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">P</div>
          <div>
            <p className="text-gray-500 text-xs">Organized by</p>
            <p className="text-white text-sm font-semibold">Prayer & Worship Team</p>
          </div>
          <button className="ml-auto text-xs text-amber-400 font-semibold">Contact</button>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="px-4 pb-8 flex gap-3">
        <button
          onClick={() => setReminded(!reminded)}
          className={`w-12 h-12 rounded-2xl border flex items-center justify-center flex-shrink-0 ${reminded ? "bg-blue-600/20 border-blue-500/40" : "bg-white/5 border-white/15"}`}
        >
          <Bell className={`w-5 h-5 ${reminded ? "text-blue-400" : "text-gray-400"}`} />
        </button>
        <button
          onClick={() => setRsvp(!rsvp)}
          className={`flex-1 font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 text-base transition-all ${
            rsvp
              ? "bg-emerald-600/20 border border-emerald-500/40 text-emerald-400"
              : "bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-xl shadow-green-500/20"
          }`}
        >
          {rsvp ? <><Check className="w-5 h-5" />You're Going!</> : "RSVP – Reserve My Spot"}
        </button>
      </div>
    </div>
  );
}
