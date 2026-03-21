import { ChevronLeft, ChevronRight, MapPin, Clock, Users, Image, Upload, Plus, X, Calendar } from "lucide-react";
import { useState } from "react";

const categories = ["Prayer", "Youth", "Outreach", "Study", "Worship", "Fellowship", "Conference"];
const locations = ["Main Sanctuary", "Fellowship Hall", "Room 201", "Outdoor Grounds", "Camp Calvary", "Online/Virtual"];

export function AdminAddEventScreen() {
  const [selectedCat, setSelectedCat] = useState("Prayer");
  const [isOnline, setIsOnline] = useState(false);
  const [requireRsvp, setRequireRsvp] = useState(true);

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
          <p className="text-xs text-green-400 font-semibold uppercase tracking-wide">Admin</p>
          <h1 className="text-lg font-black text-white leading-tight">Add New Event</h1>
        </div>
        <button className="bg-green-700/60 text-green-300 text-xs font-bold px-4 py-2 rounded-full border border-green-600/40">Save Draft</button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Banner Upload */}
        <div className="mx-4 mt-4 mb-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Event Banner</label>
          <div className="h-36 rounded-2xl border-2 border-dashed border-white/15 bg-white/4 flex flex-col items-center justify-center gap-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-teal-900/20"></div>
            <div className="relative w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Image className="w-5 h-5 text-green-400" />
            </div>
            <p className="relative text-gray-400 text-xs">Tap to upload banner image</p>
            <p className="relative text-gray-600 text-[10px]">Recommended: 1200×630px</p>
          </div>
        </div>

        {/* Event Title */}
        <div className="px-4 mb-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Event Title *</label>
          <div className="bg-white/6 border border-white/12 rounded-xl px-4 py-3.5">
            <input placeholder="e.g. Easter Prayer Night" readOnly className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full" />
          </div>
        </div>

        {/* Category */}
        <div className="px-4 mb-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Category</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  selectedCat === cat
                    ? "bg-green-600 border-green-600 text-white"
                    : "border-white/15 text-gray-400 bg-white/4"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Date & Time */}
        <div className="px-4 mb-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Date & Time *</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-white/6 border border-white/12 rounded-xl px-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <input placeholder="Mar 22, 2026" readOnly className="bg-transparent text-sm text-white placeholder-gray-500 outline-none py-3.5 flex-1 w-0" />
            </div>
            <div className="flex-1 bg-white/6 border border-white/12 rounded-xl px-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <input placeholder="7:00 PM" readOnly className="bg-transparent text-sm text-white placeholder-gray-500 outline-none py-3.5 flex-1 w-0" />
            </div>
          </div>
        </div>

        {/* End Time */}
        <div className="px-4 mb-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">End Time</label>
          <div className="bg-white/6 border border-white/12 rounded-xl px-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <input placeholder="9:00 PM (optional)" readOnly className="bg-transparent text-sm text-white placeholder-gray-500 outline-none py-3.5 flex-1" />
          </div>
        </div>

        {/* Online toggle */}
        <div className="px-4 mb-3">
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <div>
              <p className="text-white text-sm font-semibold">Online / Virtual Event</p>
              <p className="text-gray-400 text-xs">Provide a link instead of location</p>
            </div>
            <button onClick={() => setIsOnline(!isOnline)} className={`w-12 h-6 rounded-full relative flex-shrink-0 ${isOnline ? "bg-green-500" : "bg-white/15"}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${isOnline ? "left-6" : "left-0.5"}`}></div>
            </button>
          </div>
        </div>

        {/* Location */}
        <div className="px-4 mb-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">
            {isOnline ? "Meeting Link" : "Location *"}
          </label>
          {isOnline ? (
            <div className="bg-white/6 border border-white/12 rounded-xl px-4 py-3.5">
              <input placeholder="https://zoom.us/j/..." readOnly className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full" />
            </div>
          ) : (
            <div className="bg-white/6 border border-white/12 rounded-xl px-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <select className="bg-transparent text-sm text-gray-300 outline-none py-3.5 flex-1 appearance-none">
                {locations.map(l => <option key={l}>{l}</option>)}
              </select>
              <ChevronRight className="w-4 h-4 text-gray-500 rotate-90 flex-shrink-0" />
            </div>
          )}
        </div>

        {/* Capacity */}
        <div className="px-4 mb-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Max Capacity</label>
          <div className="bg-white/6 border border-white/12 rounded-xl px-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <input type="number" placeholder="Leave blank for unlimited" readOnly className="bg-transparent text-sm text-white placeholder-gray-500 outline-none py-3.5 flex-1" />
          </div>
        </div>

        {/* RSVP toggle */}
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <div>
              <p className="text-white text-sm font-semibold">Require RSVP</p>
              <p className="text-gray-400 text-xs">Members must register to attend</p>
            </div>
            <button onClick={() => setRequireRsvp(!requireRsvp)} className={`w-12 h-6 rounded-full relative flex-shrink-0 ${requireRsvp ? "bg-green-500" : "bg-white/15"}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${requireRsvp ? "left-6" : "left-0.5"}`}></div>
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="px-4 mb-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Description</label>
          <div className="bg-white/6 border border-white/12 rounded-xl px-4 py-3">
            <textarea placeholder="Describe what this event is about..." readOnly rows={3} className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full resize-none" />
          </div>
        </div>

        {/* Contact Person */}
        <div className="px-4 mb-6">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Event Contact Person</label>
          <div className="bg-white/6 border border-white/12 rounded-xl px-4 py-3.5">
            <input placeholder="Name or email for inquiries" readOnly className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full" />
          </div>
        </div>

        {/* Submit */}
        <div className="px-4 pb-8 flex gap-3">
          <button className="flex-1 bg-white/8 border border-white/15 text-white font-bold py-4 rounded-2xl text-sm">
            Preview
          </button>
          <button className="flex-[2] bg-gradient-to-r from-green-600 to-teal-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-green-500/20">
            <Upload className="w-4 h-4" />
            Publish Event
          </button>
        </div>
      </div>
    </div>
  );
}
