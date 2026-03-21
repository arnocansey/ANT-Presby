import {
  Heart,
  ChevronRight,
  CreditCard,
  Smartphone,
  Home,
  BookOpen,
  Calendar,
  Gift,
  UserCircle,
  Check,
  RefreshCw,
  Lock,
  TrendingUp,
  HandHeart,
} from "lucide-react";
import { useState } from "react";

const presetAmounts = ["$10", "$25", "$50", "$100", "$250", "$500"];

const givingCategories = [
  { label: "Tithe", icon: "🙏", desc: "Your monthly tithe offering", color: "from-amber-600 to-orange-600" },
  { label: "Building Fund", icon: "⛪", desc: "Help expand our church", color: "from-blue-600 to-indigo-600" },
  { label: "Missions", icon: "🌍", desc: "Support global outreach", color: "from-teal-600 to-cyan-600" },
  { label: "Benevolence", icon: "💛", desc: "Aid for those in need", color: "from-rose-600 to-pink-600" },
];

const paymentMethods = [
  { label: "Card", icon: CreditCard, active: true },
  { label: "Mobile Pay", icon: Smartphone, active: false },
];

const recentGifts = [
  { label: "Tithe", amount: "$150.00", date: "Mar 1, 2026", status: "completed" },
  { label: "Building Fund", amount: "$50.00", date: "Feb 15, 2026", status: "completed" },
  { label: "Missions", amount: "$25.00", date: "Feb 1, 2026", status: "completed" },
];

export function GiveScreen() {
  const [selected, setSelected] = useState("$50");
  const [category, setCategory] = useState("Tithe");
  const [recurring, setRecurring] = useState(true);
  const [payMethod, setPayMethod] = useState("Card");

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

      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Give</h1>
          <p className="text-gray-400 text-xs mt-0.5">Support the work of Grace Fellowship</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <Heart className="w-5 h-5 text-white fill-white" />
        </div>
      </div>

      {/* Scripture Banner */}
      <div className="mx-4 mb-4 rounded-xl bg-gradient-to-br from-amber-600/20 to-orange-600/10 border border-amber-500/20 px-4 py-3">
        <p className="text-amber-300 text-xs italic leading-relaxed text-center">
          "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."
        </p>
        <p className="text-amber-500/70 text-[10px] text-center mt-1 font-semibold">— 2 Corinthians 9:7</p>
      </div>

      {/* Giving Category */}
      <div className="px-4 mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">Giving Category</h3>
        <div className="grid grid-cols-2 gap-2">
          {givingCategories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setCategory(cat.label)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left ${
                category === cat.label
                  ? "border-amber-500/60 bg-amber-500/10"
                  : "border-white/10 bg-white/4"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center text-base flex-shrink-0`}>
                {cat.icon}
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-bold leading-tight ${category === cat.label ? "text-amber-400" : "text-white"}`}>
                  {cat.label}
                </p>
                <p className="text-gray-500 text-[10px] leading-tight mt-0.5 truncate">{cat.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Amount Selector */}
      <div className="px-4 mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">Select Amount</h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {presetAmounts.map((amt) => (
            <button
              key={amt}
              onClick={() => setSelected(amt)}
              className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                selected === amt
                  ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/30"
                  : "bg-white/5 border-white/10 text-gray-300"
              }`}
            >
              {amt}
            </button>
          ))}
        </div>
        {/* Custom Amount */}
        <div className="flex items-center bg-white/6 border border-white/12 rounded-xl px-4 gap-3">
          <span className="text-gray-400 text-lg font-bold">$</span>
          <input
            type="number"
            placeholder="Enter custom amount"
            readOnly
            className="bg-transparent text-sm text-white placeholder-gray-500 outline-none py-3.5 flex-1"
          />
        </div>
      </div>

      {/* Frequency Toggle */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-500/15 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Recurring Gift</p>
              <p className="text-gray-400 text-xs">Give automatically each month</p>
            </div>
          </div>
          <button
            onClick={() => setRecurring(!recurring)}
            className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${recurring ? "bg-amber-500" : "bg-white/15"}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${recurring ? "left-6" : "left-0.5"}`}></div>
          </button>
        </div>
        {recurring && (
          <p className="text-amber-400/80 text-xs mt-2 px-1">
            Your card will be charged <span className="font-bold">{selected}</span> on the 1st of each month.
          </p>
        )}
      </div>

      {/* Payment Method */}
      <div className="px-4 mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">Payment Method</h3>
        <div className="flex gap-2 mb-3">
          {paymentMethods.map((pm) => (
            <button
              key={pm.label}
              onClick={() => setPayMethod(pm.label)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all ${
                payMethod === pm.label
                  ? "border-amber-500/60 bg-amber-500/10 text-amber-400"
                  : "border-white/10 bg-white/4 text-gray-400"
              }`}
            >
              <pm.icon className="w-4 h-4" />
              {pm.label}
            </button>
          ))}
        </div>

        {/* Card Preview */}
        {payMethod === "Card" && (
          <div className="bg-gradient-to-br from-[#1c2340] to-[#1a1f38] border border-white/10 rounded-2xl p-4">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-gray-500 text-[10px] uppercase tracking-wide">Saved Card</p>
                <p className="text-white font-bold text-sm mt-0.5">•••• •••• •••• 4242</p>
              </div>
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg px-2 py-0.5">
                <span className="text-white text-xs font-black">VISA</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-[10px] uppercase">Card Holder</p>
                <p className="text-white text-sm font-semibold">John Doe</p>
              </div>
              <div>
                <p className="text-gray-500 text-[10px] uppercase">Expires</p>
                <p className="text-white text-sm font-semibold">08/28</p>
              </div>
              <button className="text-amber-400 text-xs font-semibold">Change</button>
            </div>
          </div>
        )}
      </div>

      {/* Give Now Button */}
      <div className="px-4 mb-4">
        <button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 text-base">
          <HandHeart className="w-5 h-5" />
          Give {selected} Now
        </button>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Lock className="w-3 h-3 text-gray-500" />
          <p className="text-gray-500 text-xs">256-bit SSL encrypted · Secure payment</p>
        </div>
      </div>

      {/* Giving Impact */}
      <div className="px-4 mb-4">
        <div className="bg-white/4 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Your Giving Impact</h3>
          </div>
          <div className="flex justify-between text-center">
            {[
              { label: "Total Given", value: "$1,850", color: "text-amber-400" },
              { label: "This Year", value: "$420", color: "text-emerald-400" },
              { label: "Gifts Made", value: "24", color: "text-blue-400" },
            ].map((s) => (
              <div key={s.label}>
                <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                <p className="text-gray-500 text-[10px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Gifts */}
      <div className="px-4 mb-4">
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Recent Gifts</h3>
          <span className="text-xs text-amber-400">View All</span>
        </div>
        <div className="flex flex-col gap-2">
          {recentGifts.map((gift, i) => (
            <div key={i} className="flex items-center gap-3 bg-white/4 border border-white/8 rounded-xl px-3 py-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold">{gift.label}</p>
                <p className="text-gray-500 text-xs">{gift.date}</p>
              </div>
              <p className="text-emerald-400 font-bold text-sm">{gift.amount}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-[#111827] border-t border-white/10 flex justify-around py-3 px-2">
        {[
          { icon: Home, label: "Home", active: false },
          { icon: BookOpen, label: "Sermons", active: false },
          { icon: Calendar, label: "Events", active: false },
          { icon: Gift, label: "Give", active: true },
          { icon: UserCircle, label: "Profile", active: false },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1">
            <item.icon className={`w-5 h-5 ${item.active ? "text-amber-400" : "text-gray-500"}`} />
            <span className={`text-[10px] font-medium ${item.active ? "text-amber-400" : "text-gray-500"}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
      <div className="h-20"></div>
    </div>
  );
}
