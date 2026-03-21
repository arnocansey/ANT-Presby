import { Eye, EyeOff, Mail, Lock, User, Phone, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { useState } from "react";

export function SignUpScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  return (
    <div
      className="min-h-screen bg-[#0b0f1c] text-white flex flex-col"
      style={{ fontFamily: "'Inter', sans-serif", maxWidth: 390, margin: "0 auto" }}
    >
      {/* Status Bar */}
      <div className="flex justify-between items-center px-5 pt-3 pb-1 text-xs text-gray-300">
        <span className="font-semibold">9:41</span>
        <div className="flex gap-[2px] items-end mr-1">
          <div className="w-[3px] h-[6px] bg-white rounded-sm opacity-40"></div>
          <div className="w-[3px] h-[9px] bg-white rounded-sm opacity-70"></div>
          <div className="w-[3px] h-[12px] bg-white rounded-sm"></div>
          <div className="w-6 h-3 border border-white rounded-sm relative ml-1">
            <div className="absolute inset-[2px] right-[6px] bg-white rounded-[1px]"></div>
            <div className="absolute right-[-3px] top-[3px] w-[2px] h-[6px] bg-white rounded-r-sm"></div>
          </div>
        </div>
      </div>

      {/* Back + Progress */}
      <div className="px-5 pt-3 pb-2 flex items-center gap-3">
        <button className="w-8 h-8 rounded-full bg-white/8 border border-white/10 flex items-center justify-center">
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </button>
        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Step 1 of 2</span>
            <span>50%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="px-6 pt-4 pb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4">
          <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
            <path d="M11 2h2v8h8v2h-8v8h-2v-8H3v-2h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-white">Join Our Church</h1>
        <p className="text-gray-400 text-sm mt-1">Create your Grace Fellowship account</p>
      </div>

      {/* Form */}
      <div className="px-6 flex flex-col gap-4">

        {/* Full Name */}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Full Name</label>
          <div className="flex items-center bg-white/6 border border-white/12 rounded-xl px-4 gap-3">
            <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="John Doe"
              readOnly
              className="bg-transparent text-sm text-white placeholder-gray-500 outline-none py-3.5 flex-1"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Email Address</label>
          <div className="flex items-center bg-white/6 border border-amber-500/40 rounded-xl px-4 gap-3 ring-1 ring-amber-500/20">
            <Mail className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <input
              type="email"
              placeholder="you@example.com"
              defaultValue="john.doe@gmail.com"
              readOnly
              className="bg-transparent text-sm text-white placeholder-gray-500 outline-none py-3.5 flex-1"
            />
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Phone Number <span className="normal-case text-gray-600 font-normal">(optional)</span></label>
          <div className="flex items-center bg-white/6 border border-white/12 rounded-xl px-4 gap-3">
            <div className="flex items-center gap-1.5 border-r border-white/10 pr-3 flex-shrink-0">
              <span className="text-sm">🇺🇸</span>
              <span className="text-gray-400 text-sm">+1</span>
            </div>
            <input
              type="tel"
              placeholder="(555) 000-0000"
              readOnly
              className="bg-transparent text-sm text-white placeholder-gray-500 outline-none py-3.5 flex-1"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Password</label>
          <div className="flex items-center bg-white/6 border border-white/12 rounded-xl px-4 gap-3">
            <Lock className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters"
              readOnly
              className="bg-transparent text-sm text-white placeholder-gray-500 outline-none py-3.5 flex-1"
            />
            <button onClick={() => setShowPassword(!showPassword)} className="flex-shrink-0">
              {showPassword
                ? <EyeOff className="w-4 h-4 text-gray-500" />
                : <Eye className="w-4 h-4 text-gray-500" />}
            </button>
          </div>
          {/* Password Strength */}
          <div className="mt-2 flex gap-1.5">
            {[true, true, false, false].map((filled, i) => (
              <div key={i} className={`flex-1 h-1 rounded-full ${filled ? "bg-amber-500" : "bg-white/10"}`}></div>
            ))}
          </div>
          <p className="text-xs text-amber-400 mt-1">Fair — add numbers or symbols to strengthen</p>
        </div>

        {/* How did you hear */}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">How did you hear about us?</label>
          <div className="flex items-center bg-white/6 border border-white/12 rounded-xl px-4 gap-3">
            <select
              className="bg-transparent text-sm text-gray-400 outline-none py-3.5 flex-1 appearance-none"
            >
              <option value="">Select an option...</option>
              <option>Friend or Family</option>
              <option>Social Media</option>
              <option>Church Event</option>
              <option>Website</option>
            </select>
            <ChevronRight className="w-4 h-4 text-gray-500 rotate-90 flex-shrink-0" />
          </div>
        </div>

        {/* Terms */}
        <button
          className="flex items-start gap-3 text-left"
          onClick={() => setAgreed(!agreed)}
        >
          <div className={`w-5 h-5 rounded-md border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${agreed ? "bg-amber-500 border-amber-500" : "border-white/20 bg-white/5"}`}>
            {agreed && <Check className="w-3 h-3 text-white" />}
          </div>
          <p className="text-gray-400 text-xs leading-relaxed">
            I agree to the{" "}
            <span className="text-amber-400 font-semibold">Terms of Service</span>
            {" "}&amp;{" "}
            <span className="text-amber-400 font-semibold">Privacy Policy</span>
            , and consent to receive church communications.
          </p>
        </button>

        {/* Create Account Button */}
        <button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 mt-1 shadow-lg shadow-amber-500/25">
          Create Account
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-gray-500 text-xs">or sign up with</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        {/* Social */}
        <div className="flex gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 bg-white/6 border border-white/12 rounded-xl py-3 text-sm font-semibold text-white/80">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 bg-white/6 border border-white/12 rounded-xl py-3 text-sm font-semibold text-white/80">
            <svg className="w-4 h-4" fill="white" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Apple
          </button>
        </div>
      </div>

      {/* Sign In Link */}
      <div className="px-6 pt-5 pb-8 text-center">
        <p className="text-gray-400 text-sm">
          Already have an account?{" "}
          <button className="text-amber-400 font-bold">Sign In</button>
        </p>
      </div>
    </div>
  );
}
