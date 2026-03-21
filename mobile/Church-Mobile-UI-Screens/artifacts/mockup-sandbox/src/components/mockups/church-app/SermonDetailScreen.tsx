import { ChevronLeft, Play, Pause, Heart, Share2, Download, BookOpen, Clock, User, ChevronRight, MessageSquare } from "lucide-react";
import { useState } from "react";

export function SermonDetailScreen() {
  const [playing, setPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [progress, setProgress] = useState(32);

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

      {/* Hero Thumbnail */}
      <div className="relative mx-0">
        <div className="h-52 bg-gradient-to-br from-indigo-900 via-purple-900 to-[#0b0f1c] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #7c3aed 0%, transparent 60%), radial-gradient(circle at 70% 50%, #4f46e5 0%, transparent 60%)" }}></div>
          <div className="relative text-center px-6">
            <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <p className="text-white/60 text-xs uppercase tracking-widest font-semibold">Faith & Hope Series</p>
          </div>
          {/* Back button */}
          <button className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/15 flex items-center justify-center">
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={() => setLiked(!liked)} className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/15 flex items-center justify-center">
              <Heart className={`w-4 h-4 ${liked ? "text-rose-400 fill-rose-400" : "text-white"}`} />
            </button>
            <button className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/15 flex items-center justify-center">
              <Share2 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-5 pt-4 pb-3 border-b border-white/8">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">New</span>
          <span className="text-gray-500 text-xs">March 17, 2026</span>
        </div>
        <h1 className="text-xl font-black text-white leading-tight mb-1">Walking in the Light of God</h1>
        <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            Pastor David Johnson
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            48 min
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            John 8:12
          </div>
        </div>
      </div>

      {/* Audio Player */}
      <div className="mx-4 mt-4 mb-4 bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500">15:22</span>
          <span className="text-xs text-gray-500">48:00</span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-white/10 rounded-full mb-4 relative">
          <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: `${progress}%` }}></div>
          <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md border-2 border-amber-500" style={{ left: `calc(${progress}% - 7px)` }}></div>
        </div>
        {/* Controls */}
        <div className="flex items-center justify-center gap-8">
          <button className="text-gray-400 text-xs font-bold">-15s</button>
          <button
            onClick={() => setPlaying(!playing)}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/30"
          >
            {playing ? <Pause className="w-6 h-6 text-white fill-white" /> : <Play className="w-6 h-6 text-white fill-white ml-0.5" />}
          </button>
          <button className="text-gray-400 text-xs font-bold">+30s</button>
        </div>
        <div className="flex justify-between items-center mt-3">
          <button className="text-gray-500 text-xs">1× speed</button>
          <button className="flex items-center gap-1.5 text-gray-400 text-xs">
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="px-5 mb-4">
        <h3 className="text-sm font-bold text-white mb-2">About This Sermon</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          In this powerful message, Pastor David explores what it means to walk in God's light — letting His truth illuminate our paths, our relationships, and our purpose.
        </p>
        <button className="text-amber-400 text-xs font-semibold mt-1">Read more</button>
      </div>

      {/* Sermon Notes */}
      <div className="px-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-white">Sermon Notes</h3>
          <span className="text-amber-400 text-xs font-semibold">Download PDF</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-gray-400 text-xs italic">Take notes as you listen...</p>
          <div className="mt-3 space-y-1.5">
            {["God is light — 1 John 1:5", "Walking = daily obedience", "Light exposes, cleanses, guides"].map(note => (
              <div key={note} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></div>
                <p className="text-gray-300 text-xs">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-white">Comments</h3>
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <MessageSquare className="w-3.5 h-3.5" />
            24
          </div>
        </div>
        {[
          { name: "Grace A.", text: "This sermon changed my perspective completely. 🙏", color: "bg-teal-500" },
          { name: "Samuel M.", text: "Pastor David always delivers. Powerful word today!", color: "bg-blue-500" },
        ].map(c => (
          <div key={c.name} className="flex gap-2.5 mb-3">
            <div className={`w-8 h-8 rounded-full ${c.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{c.name[0]}</div>
            <div className="flex-1 bg-white/4 border border-white/8 rounded-xl px-3 py-2">
              <p className="text-white text-xs font-semibold">{c.name}</p>
              <p className="text-gray-400 text-xs mt-0.5">{c.text}</p>
            </div>
          </div>
        ))}
        <div className="flex gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">J</div>
          <div className="flex-1 bg-white/6 border border-white/12 rounded-xl px-3 py-2.5">
            <input placeholder="Add a comment..." readOnly className="bg-transparent text-xs text-white placeholder-gray-500 outline-none w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
