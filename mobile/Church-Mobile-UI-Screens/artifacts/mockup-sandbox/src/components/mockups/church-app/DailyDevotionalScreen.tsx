import { ChevronLeft, ChevronRight, BookOpen, Heart, Share2, Bookmark, Flame } from "lucide-react";
import { useState } from "react";

const devotional = {
  date: "Saturday, March 21, 2026",
  title: "His Mercies Are New Every Morning",
  verse: "The steadfast love of the LORD never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness.",
  reference: "Lamentations 3:22–23",
  body: [
    "Every morning you wake up is a fresh invitation from God. No matter what yesterday looked like — the failures, the regrets, the disappointments — God's mercies have been renewed just for you, today.",
    "Jeremiah wrote these words in the middle of ruins and grief, yet he anchored himself in a truth greater than his circumstances: God is faithful. His love is not based on your performance — it is based on His character.",
    "This morning, take a moment before the noise begins. Sit with the reality that you are loved unconditionally by the Creator of the universe. Let that truth shape how you step into your day.",
  ],
  reflection: "What area of your life needs to receive God's mercy today? What would it look like to start fresh in that area?",
  prayer: "Lord, thank you that your mercies are new this morning. I receive your grace for this day. Help me to extend to others the same mercy you have shown me. Amen.",
};

const streakDays = [
  { day: "M", done: true }, { day: "T", done: true }, { day: "W", done: true },
  { day: "T", done: true }, { day: "F", done: false }, { day: "S", done: true }, { day: "S", done: false },
];

export function DailyDevotionalScreen() {
  const [bookmarked, setBookmarked] = useState(false);
  const [liked, setLiked] = useState(false);
  const [completed, setCompleted] = useState(false);

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
      <div className="flex items-center gap-3 px-4 py-3">
        <button className="w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center">
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </button>
        <div className="flex-1 text-center">
          <p className="text-xs text-amber-400 font-semibold uppercase tracking-wide">Daily Devotional</p>
          <p className="text-gray-500 text-[10px]">{devotional.date}</p>
        </div>
        <button onClick={() => setBookmarked(!bookmarked)} className="w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center">
          <Bookmark className={`w-4 h-4 ${bookmarked ? "text-amber-400 fill-amber-400" : "text-gray-400"}`} />
        </button>
      </div>

      {/* Streak */}
      <div className="mx-4 mb-4 bg-gradient-to-br from-amber-900/30 to-orange-900/20 border border-amber-500/20 rounded-2xl px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-white font-bold text-sm">5-Day Streak</span>
          </div>
          <span className="text-amber-400 text-xs font-semibold">Keep it up! 🎉</span>
        </div>
        <div className="flex gap-1.5 justify-between">
          {streakDays.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${d.done ? "bg-orange-500 text-white" : "bg-white/10 text-gray-500"}`}>
                {d.done ? "✓" : d.day}
              </div>
              <span className="text-[9px] text-gray-500">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Verse */}
      <div className="mx-4 mb-4 bg-gradient-to-br from-blue-900/30 to-indigo-900/20 border border-blue-500/20 rounded-2xl px-5 py-4">
        <div className="flex items-start gap-2 mb-2">
          <BookOpen className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <span className="text-blue-400 text-xs font-semibold uppercase tracking-wide">Today's Scripture</span>
        </div>
        <p className="text-white/90 text-sm leading-relaxed italic mb-2">"{devotional.verse}"</p>
        <p className="text-blue-300 text-xs font-bold">— {devotional.reference}</p>
      </div>

      {/* Title */}
      <div className="px-5 mb-3">
        <h1 className="text-xl font-black text-white leading-tight">{devotional.title}</h1>
      </div>

      {/* Body */}
      <div className="px-5 mb-4 flex flex-col gap-3">
        {devotional.body.map((para, i) => (
          <p key={i} className="text-gray-300 text-sm leading-relaxed">{para}</p>
        ))}
      </div>

      {/* Reflection */}
      <div className="mx-4 mb-4 bg-white/4 border border-white/10 rounded-2xl px-4 py-4">
        <p className="text-amber-400 text-xs font-bold uppercase tracking-wide mb-2">Reflection Question</p>
        <p className="text-gray-200 text-sm leading-relaxed">{devotional.reflection}</p>
        <div className="mt-3 border border-white/10 rounded-xl px-3 py-2">
          <textarea placeholder="Write your reflection here..." readOnly rows={2} className="bg-transparent text-xs text-white placeholder-gray-600 outline-none w-full resize-none" />
        </div>
      </div>

      {/* Prayer */}
      <div className="mx-4 mb-4 bg-rose-500/8 border border-rose-500/15 rounded-2xl px-4 py-4">
        <p className="text-rose-400 text-xs font-bold uppercase tracking-wide mb-2">Prayer</p>
        <p className="text-gray-300 text-sm leading-relaxed italic">{devotional.prayer}</p>
      </div>

      {/* Actions */}
      <div className="px-4 pb-8 flex gap-3">
        <button onClick={() => setLiked(!liked)} className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${liked ? "bg-rose-500/20 border-rose-500/40" : "bg-white/5 border-white/15"}`}>
          <Heart className={`w-5 h-5 ${liked ? "text-rose-400 fill-rose-400" : "text-gray-400"}`} />
        </button>
        <button className="w-12 h-12 rounded-2xl border border-white/15 bg-white/5 flex items-center justify-center">
          <Share2 className="w-5 h-5 text-gray-400" />
        </button>
        <button onClick={() => setCompleted(true)} className={`flex-1 font-black py-3 rounded-2xl text-sm transition-all ${completed ? "bg-emerald-600/20 border border-emerald-500/40 text-emerald-400" : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl shadow-amber-500/25"}`}>
          {completed ? "✓ Completed Today" : "Mark as Complete"}
        </button>
      </div>

      {/* Nav arrows */}
      <div className="flex justify-between items-center px-4 pb-6 text-xs text-gray-500">
        <button className="flex items-center gap-1"><ChevronLeft className="w-3 h-3" />Yesterday</button>
        <button className="flex items-center gap-1">Tomorrow<ChevronRight className="w-3 h-3" /></button>
      </div>
    </div>
  );
}
