import { Calendar, MapPin, Clock, ChevronRight, Heart, Home, BookOpen, Gift, UserCircle, CreditCard, Smartphone, DollarSign, Check } from "lucide-react";

const events = [
  {
    id: 1,
    title: "Easter Prayer Night",
    date: "March 22",
    day: "22",
    month: "MAR",
    time: "7:00 PM",
    location: "Main Sanctuary",
    type: "Prayer",
    typeColor: "bg-purple-500/20 text-purple-400",
    attendees: 145,
  },
  {
    id: 2,
    title: "Youth Spring Retreat",
    date: "March 28-30",
    day: "28",
    month: "MAR",
    time: "All Day",
    location: "Camp Calvary",
    type: "Youth",
    typeColor: "bg-green-500/20 text-green-400",
    attendees: 62,
  },
  {
    id: 3,
    title: "Community Outreach Day",
    date: "April 5",
    day: "05",
    month: "APR",
    time: "9:00 AM",
    location: "City Park",
    type: "Outreach",
    typeColor: "bg-blue-500/20 text-blue-400",
    attendees: 230,
  },
  {
    id: 4,
    title: "Women's Bible Study",
    date: "April 10",
    day: "10",
    month: "APR",
    time: "6:30 PM",
    location: "Room 201",
    type: "Study",
    typeColor: "bg-pink-500/20 text-pink-400",
    attendees: 38,
  },
];

export function EventsGiveScreen() {
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

      {/* Tab Header */}
      <div className="px-5 py-3">
        <div className="flex bg-white/8 rounded-xl p-1 gap-1">
          <button className="flex-1 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold">Events</button>
          <button className="flex-1 py-2 rounded-lg text-gray-400 text-sm font-medium">Give</button>
        </div>
      </div>

      {/* Upcoming Banner */}
      <div className="mx-4 mb-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 p-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-20 opacity-10" style={{ background: "repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)", backgroundSize: "8px 8px" }}></div>
        <p className="text-purple-200 text-xs font-semibold uppercase tracking-wide mb-1">Next Event</p>
        <h3 className="text-white font-bold text-lg">Easter Prayer Night</h3>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-purple-200 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />March 22 • 7:00 PM</span>
          <span className="text-purple-200 text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />Main Sanctuary</span>
        </div>
        <button className="mt-3 bg-white text-purple-700 text-xs font-bold px-4 py-2 rounded-full">Register Now</button>
      </div>

      {/* Events List */}
      <div className="px-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-300">All Events</h3>
          <button className="flex items-center gap-1 text-xs text-amber-400">
            <Calendar className="w-3 h-3" />
            Calendar View
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {events.map((event) => (
            <div key={event.id} className="flex gap-3 bg-white/5 rounded-xl p-3 border border-white/10 items-center">
              <div className="w-12 h-14 rounded-xl bg-[#1a1a2e] border border-white/10 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-amber-400 text-[10px] font-bold">{event.month}</span>
                <span className="text-white text-xl font-black leading-none">{event.day}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${event.typeColor}`}>{event.type}</span>
                </div>
                <h4 className="text-white font-semibold text-sm leading-tight">{event.title}</h4>
                <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />{event.time} • <MapPin className="w-3 h-3" />{event.location}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">{event.attendees} attending</p>
              </div>
              <button className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <ChevronRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Give Section Preview */}
      <div className="px-4 mt-5">
        <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/10 rounded-2xl p-4 border border-amber-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-white font-bold">Give Online</h3>
              <p className="text-gray-400 text-xs">Tithes, offerings & donations</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {["$25", "$50", "$100"].map((amount) => (
              <button key={amount} className="bg-white/8 border border-white/10 rounded-xl py-2 text-white text-sm font-semibold hover:bg-amber-500/20 hover:border-amber-500/50">
                {amount}
              </button>
            ))}
          </div>
          <button className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
            <DollarSign className="w-4 h-4" />
            Give Now
          </button>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-[#1a1a2e] border-t border-white/10 flex justify-around py-3 px-2">
        {[
          { icon: Home, label: "Home", active: false },
          { icon: BookOpen, label: "Sermons", active: false },
          { icon: Calendar, label: "Events", active: true },
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
