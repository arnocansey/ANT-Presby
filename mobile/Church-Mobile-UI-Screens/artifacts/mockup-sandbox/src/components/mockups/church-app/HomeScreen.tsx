import { Heart, Calendar, Play, Users, Bell, Home, BookOpen, Gift, UserCircle, MapPin, Clock, ChevronRight, Music } from "lucide-react";

export function HomeScreen() {
  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif", maxWidth: 390, margin: "0 auto", position: "relative" }}>
      {/* Status Bar */}
      <div className="flex justify-between items-center px-5 pt-3 pb-1 text-xs text-gray-300">
        <span className="font-semibold">9:41</span>
        <div className="flex gap-1 items-center">
          <div className="flex gap-[2px] items-end">
            <div className="w-[3px] h-[6px] bg-white rounded-sm opacity-40"></div>
            <div className="w-[3px] h-[9px] bg-white rounded-sm opacity-70"></div>
            <div className="w-[3px] h-[12px] bg-white rounded-sm"></div>
          </div>
          <div className="w-6 h-3 border border-white rounded-sm relative ml-1">
            <div className="absolute inset-[2px] right-[6px] bg-white rounded-[1px]"></div>
            <div className="absolute right-[-3px] top-[3px] w-[2px] h-[6px] bg-white rounded-r-sm"></div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center px-5 py-3">
        <div>
          <p className="text-xs text-amber-400 font-medium tracking-widest uppercase">Good Morning</p>
          <h1 className="text-xl font-bold text-white">Grace Fellowship</h1>
        </div>
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0f0f1a]"></div>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="mx-4 rounded-2xl overflow-hidden relative" style={{ height: 180 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600 via-amber-500 to-orange-600"></div>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}></div>
        <div className="relative p-5 h-full flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center bg-white/20 rounded-full px-3 py-1 text-xs font-medium mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              LIVE NOW
            </div>
            <h2 className="text-white font-bold text-lg leading-tight">Sunday Worship Service</h2>
            <p className="text-amber-100 text-sm mt-1">Join us as we worship together</p>
          </div>
          <button className="self-start bg-white text-amber-600 rounded-full px-4 py-2 text-sm font-bold flex items-center gap-2">
            <Play className="w-3 h-3 fill-amber-600" />
            Watch Live
          </button>
        </div>
      </div>

      {/* Next Service */}
      <div className="mx-4 mt-3 bg-white/5 rounded-xl p-4 border border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
          <Clock className="w-5 h-5 text-purple-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-400 font-medium">NEXT SERVICE</p>
          <p className="text-white font-semibold text-sm">Sunday • 10:00 AM & 12:00 PM</p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            123 Faith Avenue, Grace City
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-500" />
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Play, label: "Sermons", color: "bg-blue-500/20 text-blue-400" },
            { icon: Calendar, label: "Events", color: "bg-green-500/20 text-green-400" },
            { icon: Gift, label: "Give", color: "bg-amber-500/20 text-amber-400" },
            { icon: Users, label: "Groups", color: "bg-pink-500/20 text-pink-400" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2">
              <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center`}>
                <item.icon className="w-6 h-6" />
              </div>
              <span className="text-xs text-gray-300 font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Latest Sermon */}
      <div className="px-4 mt-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-300">Latest Sermon</h3>
          <span className="text-xs text-amber-400">See All</span>
        </div>
        <div className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
          <div className="h-28 bg-gradient-to-r from-indigo-600 to-purple-600 relative flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
            <div className="absolute bottom-2 left-3">
              <span className="bg-black/40 text-white text-xs px-2 py-0.5 rounded-full">42:15</span>
            </div>
          </div>
          <div className="p-3">
            <p className="text-xs text-amber-400 font-medium uppercase tracking-wide">Series: Faith & Hope</p>
            <h4 className="text-white font-bold mt-0.5">Walking in the Light of God</h4>
            <p className="text-gray-400 text-xs mt-1">Pastor David Johnson • March 17, 2026</p>
          </div>
        </div>
      </div>

      {/* Upcoming Event */}
      <div className="px-4 mt-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-300">Upcoming Event</h3>
          <span className="text-xs text-amber-400">See All</span>
        </div>
        <div className="flex gap-3 bg-white/5 rounded-xl p-3 border border-white/10 items-center">
          <div className="w-12 h-12 rounded-xl bg-amber-500 flex flex-col items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">MAR</span>
            <span className="text-white text-lg font-black leading-none">22</span>
          </div>
          <div className="flex-1">
            <h4 className="text-white font-semibold text-sm">Easter Prayer Night</h4>
            <p className="text-gray-400 text-xs">7:00 PM • Main Sanctuary</p>
          </div>
          <button className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">RSVP</button>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-[#1a1a2e] border-t border-white/10 flex justify-around py-3 px-2">
        {[
          { icon: Home, label: "Home", active: true },
          { icon: BookOpen, label: "Sermons", active: false },
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
