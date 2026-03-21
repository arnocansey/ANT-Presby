import { ChevronLeft, Bell, Send, Users, CheckCircle, Image, Link } from "lucide-react";
import { useState } from "react";

const audiences = [
  { label: "All Members", count: "1,248", icon: "👥" },
  { label: "Small Group Leaders", count: "18", icon: "⭐" },
  { label: "Volunteers", count: "64", icon: "🙋" },
  { label: "Youth", count: "112", icon: "🌱" },
];

const types = [
  { label: "General", color: "bg-blue-500" },
  { label: "Urgent", color: "bg-red-500" },
  { label: "Event", color: "bg-green-500" },
  { label: "Prayer", color: "bg-rose-500" },
  { label: "Finance", color: "bg-amber-500" },
];

export function AdminSendAnnouncementScreen() {
  const [selectedAudience, setSelectedAudience] = useState("All Members");
  const [selectedType, setSelectedType] = useState("General");
  const [pushEnabled, setPushEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [sent, setSent] = useState(false);

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
          <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wide">Admin</p>
          <h1 className="text-lg font-black text-white leading-tight">Send Announcement</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Title */}
        <div className="px-4 mt-4 mb-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Announcement Title *</label>
          <div className="bg-white/6 border border-white/12 rounded-xl px-4 py-3.5">
            <input placeholder="e.g. Sunday Service Update" readOnly className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full" />
          </div>
        </div>

        {/* Type */}
        <div className="px-4 mb-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Type</label>
          <div className="flex gap-2 flex-wrap">
            {types.map(t => (
              <button key={t.label} onClick={() => setSelectedType(t.label)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${selectedType === t.label ? `${t.color} border-transparent text-white` : "border-white/15 text-gray-400 bg-white/4"}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${selectedType === t.label ? "bg-white" : t.color}`}></div>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div className="px-4 mb-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Message Body *</label>
          <div className="bg-white/6 border border-white/12 rounded-xl px-4 py-3">
            <textarea placeholder="Write your announcement..." readOnly rows={4} className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full resize-none" />
          </div>
          <p className="text-right text-gray-600 text-xs mt-1">0 / 500</p>
        </div>

        {/* Attach Image / Link */}
        <div className="px-4 mb-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Attachments (Optional)</label>
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/4 border border-dashed border-white/15 rounded-xl text-xs text-gray-400 font-semibold">
              <Image className="w-4 h-4" />Add Image
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/4 border border-dashed border-white/15 rounded-xl text-xs text-gray-400 font-semibold">
              <Link className="w-4 h-4" />Add Link
            </button>
          </div>
        </div>

        {/* Audience */}
        <div className="px-4 mb-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Send To</label>
          <div className="flex flex-col gap-2">
            {audiences.map(a => (
              <button key={a.label} onClick={() => setSelectedAudience(a.label)} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left ${selectedAudience === a.label ? "border-indigo-500/50 bg-indigo-500/10" : "border-white/10 bg-white/4"}`}>
                <span className="text-xl">{a.icon}</span>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${selectedAudience === a.label ? "text-indigo-300" : "text-white"}`}>{a.label}</p>
                  <p className="text-gray-500 text-xs">{a.count} recipients</p>
                </div>
                {selectedAudience === a.label && <CheckCircle className="w-4 h-4 text-indigo-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Delivery */}
        <div className="px-4 mb-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Delivery Method</label>
          {[
            { label: "Push Notification", desc: "Send to members' devices", state: pushEnabled, set: setPushEnabled },
            { label: "In-App Message", desc: "Show in Notifications tab", state: inAppEnabled, set: setInAppEnabled },
          ].map(d => (
            <div key={d.label} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-2">
              <div>
                <p className="text-white text-sm font-semibold">{d.label}</p>
                <p className="text-gray-400 text-xs">{d.desc}</p>
              </div>
              <button onClick={() => d.set(!d.state)} className={`w-12 h-6 rounded-full relative flex-shrink-0 ${d.state ? "bg-indigo-500" : "bg-white/15"}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${d.state ? "left-6" : "left-0.5"}`}></div>
              </button>
            </div>
          ))}
        </div>

        {/* Preview box */}
        <div className="px-4 mb-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Notification Preview</label>
          <div className="bg-white/8 border border-white/12 rounded-2xl px-4 py-3 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Grace Fellowship</p>
              <p className="text-gray-400 text-xs mt-0.5">Your announcement text will appear here...</p>
              <p className="text-gray-600 text-[10px] mt-1">now</p>
            </div>
          </div>
        </div>

        {/* Send */}
        <div className="px-4 pb-8 flex gap-3">
          <button className="flex-1 bg-white/8 border border-white/15 text-white font-bold py-4 rounded-2xl text-sm">
            Schedule
          </button>
          <button onClick={() => setSent(true)} className={`flex-[2] font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-base shadow-xl transition-all ${sent ? "bg-emerald-600/20 border border-emerald-500/40 text-emerald-400" : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-500/25"}`}>
            {sent ? <><CheckCircle className="w-5 h-5" />Sent!</> : <><Send className="w-5 h-5" />Send Now</>}
          </button>
        </div>
      </div>
    </div>
  );
}
