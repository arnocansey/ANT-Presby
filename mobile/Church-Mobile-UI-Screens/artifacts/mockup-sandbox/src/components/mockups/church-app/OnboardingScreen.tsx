import { ChevronRight, ArrowRight } from "lucide-react";
import { useState } from "react";

const slides = [
  {
    emoji: "⛪",
    title: "Welcome to\nGrace Fellowship",
    subtitle: "We're so glad you're here. This is a place of grace, community, and hope.",
    gradient: "from-indigo-900 via-[#0b0f1c] to-[#0b0f1c]",
    accent: "text-indigo-400",
    dot: "bg-indigo-400",
  },
  {
    emoji: "🎙️",
    title: "Sermons, Anytime,\nAnywhere",
    subtitle: "Access a full library of messages from our pastors — video and audio, on your schedule.",
    gradient: "from-purple-900 via-[#0b0f1c] to-[#0b0f1c]",
    accent: "text-purple-400",
    dot: "bg-purple-400",
  },
  {
    emoji: "🙏",
    title: "Give. Pray.\nConnect.",
    subtitle: "Give securely, post prayer requests to the wall, and find your small group — all in one place.",
    gradient: "from-teal-900 via-[#0b0f1c] to-[#0b0f1c]",
    accent: "text-teal-400",
    dot: "bg-teal-400",
  },
  {
    emoji: "💛",
    title: "You Belong\nHere",
    subtitle: "Grace Fellowship is more than a church — it's a family. Let's grow in faith together.",
    gradient: "from-amber-900 via-[#0b0f1c] to-[#0b0f1c]",
    accent: "text-amber-400",
    dot: "bg-amber-400",
  },
];

export function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const slide = slides[step];
  const isLast = step === slides.length - 1;

  return (
    <div className={`min-h-screen bg-gradient-to-b ${slide.gradient} text-white flex flex-col transition-all duration-500`} style={{ fontFamily: "'Inter', sans-serif", maxWidth: 390, margin: "0 auto" }}>
      {/* Status Bar */}
      <div className="flex justify-between items-center px-5 pt-3 pb-1 text-xs text-gray-300">
        <span className="font-semibold">9:41</span>
        <div className="w-6 h-3 border border-white rounded-sm relative ml-1">
          <div className="absolute inset-[2px] right-[6px] bg-white rounded-[1px]"></div>
          <div className="absolute right-[-3px] top-[3px] w-[2px] h-[6px] bg-white rounded-r-sm"></div>
        </div>
      </div>

      {/* Skip */}
      <div className="flex justify-end px-5 pt-2">
        {!isLast && (
          <button onClick={() => setStep(slides.length - 1)} className="text-gray-400 text-sm font-semibold">
            Skip
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {/* Big emoji */}
        <div className="w-32 h-32 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-7xl mb-8 shadow-2xl">
          {slide.emoji}
        </div>

        {/* Church logo on first slide */}
        {step === 0 && (
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <span className="text-white font-black text-xs">GF</span>
            </div>
            <span className="text-white font-black text-lg tracking-wide">Grace Fellowship</span>
          </div>
        )}

        <h1 className="text-3xl font-black text-white leading-tight mb-4 whitespace-pre-line">{slide.title}</h1>
        <p className={`text-base leading-relaxed ${slide.accent.replace("text-", "text-").replace("400", "200/70")}`}>{slide.subtitle}</p>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mb-8">
        {slides.map((_, i) => (
          <div key={i} onClick={() => setStep(i)} className={`h-2 rounded-full cursor-pointer transition-all ${i === step ? `${slide.dot} w-6` : "bg-white/20 w-2"}`}></div>
        ))}
      </div>

      {/* Button */}
      <div className="px-6 pb-12">
        {isLast ? (
          <div className="flex flex-col gap-3">
            <button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black py-4 rounded-2xl text-lg flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30">
              Create Account
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="w-full bg-white/8 border border-white/15 text-white font-bold py-4 rounded-2xl text-base">
              I already have an account
            </button>
          </div>
        ) : (
          <button
            onClick={() => setStep(step + 1)}
            className="w-full bg-white/10 border border-white/20 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
