import { ChevronLeft, Upload, Plus, X, Image, Mic, Video, BookOpen, ChevronRight, Check } from "lucide-react";
import { useState } from "react";

const series = ["Faith & Hope", "Grace Unlimited", "Family Matters", "New Beginnings", "+ New Series"];
const pastors = ["Pastor David Johnson", "Pastor Sarah Williams", "Elder Mark Thompson"];

export function AdminAddSermonScreen() {
  const [selectedSeries, setSelectedSeries] = useState("Faith & Hope");
  const [mediaType, setMediaType] = useState<"video" | "audio">("video");
  const [published, setPublished] = useState(false);

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
          <p className="text-xs text-purple-400 font-semibold uppercase tracking-wide">Admin</p>
          <h1 className="text-lg font-black text-white leading-tight">Add New Sermon</h1>
        </div>
        <button className="bg-purple-600 text-white text-xs font-bold px-4 py-2 rounded-full">Save Draft</button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Thumbnail Upload */}
        <div className="mx-4 mt-4 mb-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Sermon Thumbnail</label>
          <div className="h-36 rounded-2xl border-2 border-dashed border-white/15 bg-white/4 flex flex-col items-center justify-center gap-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-indigo-900/20"></div>
            <div className="relative w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Image className="w-5 h-5 text-purple-400" />
            </div>
            <p className="relative text-gray-400 text-xs">Tap to upload thumbnail</p>
            <p className="relative text-gray-600 text-[10px]">JPG, PNG · Max 5MB</p>
          </div>
        </div>

        {/* Media Type */}
        <div className="px-4 mb-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Media Type</label>
          <div className="flex gap-2">
            {(["video", "audio"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setMediaType(type)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold ${
                  mediaType === type
                    ? "bg-purple-600/20 border-purple-500/50 text-purple-400"
                    : "bg-white/4 border-white/10 text-gray-400"
                }`}
              >
                {type === "video" ? <Video className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {type === "video" ? "Video" : "Audio Only"}
              </button>
            ))}
          </div>
        </div>

        {/* File Upload */}
        <div className="px-4 mb-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">
            Upload {mediaType === "video" ? "Video" : "Audio"} File
          </label>
          <div className="h-20 rounded-xl border border-dashed border-white/15 bg-white/4 flex items-center justify-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center">
              <Upload className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300 font-medium">Tap to upload file</p>
              <p className="text-xs text-gray-600">{mediaType === "video" ? "MP4, MOV · Max 2GB" : "MP3, WAV · Max 200MB"}</p>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="px-4 mb-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Sermon Title *</label>
          <div className="bg-white/6 border border-white/12 rounded-xl px-4 py-3.5">
            <input placeholder="e.g. Walking in the Light of God" readOnly className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full" />
          </div>
        </div>

        {/* Scripture Reference */}
        <div className="px-4 mb-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Scripture Reference</label>
          <div className="bg-white/6 border border-white/12 rounded-xl px-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <input placeholder="e.g. John 8:12" readOnly className="bg-transparent text-sm text-white placeholder-gray-500 outline-none py-3.5 flex-1" />
          </div>
        </div>

        {/* Pastor */}
        <div className="px-4 mb-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Speaker / Pastor *</label>
          <div className="bg-white/6 border border-white/12 rounded-xl px-4 flex items-center gap-2">
            <select className="bg-transparent text-sm text-gray-300 outline-none py-3.5 flex-1 appearance-none">
              {pastors.map(p => <option key={p}>{p}</option>)}
            </select>
            <ChevronRight className="w-4 h-4 text-gray-500 rotate-90 flex-shrink-0" />
          </div>
        </div>

        {/* Series */}
        <div className="px-4 mb-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Sermon Series</label>
          <div className="flex flex-wrap gap-2">
            {series.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSeries(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  selectedSeries === s
                    ? "bg-purple-600 border-purple-600 text-white"
                    : "border-white/15 text-gray-400 bg-white/4"
                }`}
              >
                {s === "+ New Series" ? <span className="flex items-center gap-1"><Plus className="w-3 h-3" />{s.slice(2)}</span> : s}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="px-4 mb-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Description</label>
          <div className="bg-white/6 border border-white/12 rounded-xl px-4 py-3">
            <textarea placeholder="Brief summary of the sermon message..." readOnly rows={3} className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full resize-none" />
          </div>
        </div>

        {/* Tags */}
        <div className="px-4 mb-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Tags</label>
          <div className="flex flex-wrap gap-2">
            {["Faith", "Hope", "Prayer"].map(tag => (
              <div key={tag} className="flex items-center gap-1 bg-white/8 border border-white/10 rounded-full px-3 py-1">
                <span className="text-xs text-gray-300">{tag}</span>
                <X className="w-3 h-3 text-gray-500" />
              </div>
            ))}
            <button className="flex items-center gap-1 border border-dashed border-white/20 rounded-full px-3 py-1">
              <Plus className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-500">Add tag</span>
            </button>
          </div>
        </div>

        {/* Publish toggle */}
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <div>
              <p className="text-white text-sm font-semibold">Publish Immediately</p>
              <p className="text-gray-400 text-xs">Make visible to all members</p>
            </div>
            <button onClick={() => setPublished(!published)} className={`w-12 h-6 rounded-full relative flex-shrink-0 ${published ? "bg-purple-500" : "bg-white/15"}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${published ? "left-6" : "left-0.5"}`}></div>
            </button>
          </div>
        </div>

        {/* Date/Time */}
        <div className="px-4 mb-6">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Sermon Date</label>
          <div className="bg-white/6 border border-white/12 rounded-xl px-4 py-3.5 flex items-center justify-between">
            <span className="text-gray-400 text-sm">March 24, 2026</span>
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </div>
        </div>

        {/* Submit */}
        <div className="px-4 pb-8">
          <button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-purple-500/25">
            <Upload className="w-5 h-5" />
            Publish Sermon
          </button>
        </div>
      </div>
    </div>
  );
}
