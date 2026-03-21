import { Users, MessageCircle, Heart, Mail, Phone, MapPin, Home, BookOpen, Calendar, Gift, UserCircle, ChevronRight, Star, Send, HandHeart, Church } from "lucide-react";

const groups = [
  { name: "Young Adults", members: 24, day: "Fridays", time: "7 PM", leader: "Mike Chen", color: "from-blue-600 to-cyan-600" },
  { name: "Men's Fellowship", members: 18, day: "Saturdays", time: "8 AM", leader: "James Park", color: "from-teal-600 to-green-600" },
  { name: "Women's Circle", members: 31, day: "Thursdays", time: "6:30 PM", leader: "Ruth Adams", color: "from-rose-600 to-pink-600" },
];

export function ConnectScreen() {
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
        <h1 className="text-2xl font-bold text-white">Connect</h1>
        <p className="text-gray-400 text-xs mt-1">Grow together in community</p>
      </div>

      {/* Profile Banner */}
      <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#252540] border border-white/10 p-4 flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
          JD
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold">John Doe</h3>
          <p className="text-gray-400 text-xs">Member since January 2024</p>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-xs text-gray-400 ml-1">Faithful Member</span>
          </div>
        </div>
        <button className="text-amber-400 text-xs font-semibold">Edit</button>
      </div>

      {/* Prayer Request CTA */}
      <div className="mx-4 mb-4 rounded-xl bg-gradient-to-r from-purple-700/40 to-indigo-700/40 border border-purple-500/20 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <HandHeart className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Submit a Prayer Request</h3>
            <p className="text-gray-400 text-xs">Our prayer team is here for you</p>
          </div>
        </div>
        <div className="bg-white/8 rounded-xl px-3 py-2.5 flex items-center gap-2 mb-3 border border-white/10">
          <MessageCircle className="w-4 h-4 text-gray-400" />
          <span className="text-gray-500 text-sm">Share your prayer request...</span>
        </div>
        <button className="w-full bg-purple-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm">
          <Send className="w-4 h-4" />
          Send Prayer Request
        </button>
      </div>

      {/* Small Groups */}
      <div className="px-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-300">Small Groups</h3>
          <span className="text-xs text-amber-400">View All</span>
        </div>
        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <div key={group.name} className="flex gap-3 bg-white/5 rounded-xl p-3 border border-white/10 items-center">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${group.color} flex items-center justify-center flex-shrink-0`}>
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-semibold text-sm">{group.name}</h4>
                <p className="text-gray-400 text-xs">{group.day} • {group.time}</p>
                <p className="text-gray-500 text-xs">{group.members} members • Led by {group.leader}</p>
              </div>
              <button className="bg-amber-500/20 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full">Join</button>
            </div>
          ))}
        </div>
      </div>

      {/* Contact & Directions */}
      <div className="px-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Contact Us</h3>
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden divide-y divide-white/10">
          {[
            { icon: Phone, label: "Call Us", value: "+1 (555) 234-5678", color: "text-green-400" },
            { icon: Mail, label: "Email", value: "info@gracefellowship.org", color: "text-blue-400" },
            { icon: MapPin, label: "Address", value: "123 Faith Ave, Grace City", color: "text-amber-400" },
            { icon: Church, label: "Service Times", value: "Sun 10:00 AM & 12:00 PM", color: "text-purple-400" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 px-4 py-3">
              <div className={`${item.color}`}>
                <item.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-400 text-xs">{item.label}</p>
                <p className="text-white text-sm font-medium truncate">{item.value}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-[#1a1a2e] border-t border-white/10 flex justify-around py-3 px-2">
        {[
          { icon: Home, label: "Home", active: false },
          { icon: BookOpen, label: "Sermons", active: false },
          { icon: Calendar, label: "Events", active: false },
          { icon: Gift, label: "Give", active: false },
          { icon: UserCircle, label: "Profile", active: true },
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
