import { ChevronLeft, TrendingUp, TrendingDown, Download, Filter, DollarSign, ChevronRight, ArrowUpRight } from "lucide-react";
import { useState } from "react";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const barValues = [68, 75, 82, 60, 90, 100];

const transactions = [
  { name: "Rebecca Osei", type: "Tithe", amount: "+$200.00", date: "Mar 20", color: "text-emerald-400" },
  { name: "Samuel Mensah", type: "Building Fund", amount: "+$100.00", date: "Mar 19", color: "text-emerald-400" },
  { name: "Grace Addo", type: "Tithe", amount: "+$150.00", date: "Mar 18", color: "text-emerald-400" },
  { name: "Anonymous", type: "Benevolence", amount: "+$50.00", date: "Mar 17", color: "text-emerald-400" },
  { name: "James Owusu", type: "Missions", amount: "+$75.00", date: "Mar 16", color: "text-emerald-400" },
  { name: "Linda Boateng", type: "Tithe", amount: "+$120.00", date: "Mar 15", color: "text-emerald-400" },
];

const breakdown = [
  { label: "Tithe & Offering", amount: "$18,240", pct: 74, color: "bg-amber-500" },
  { label: "Building Fund", amount: "$3,800", pct: 15, color: "bg-blue-500" },
  { label: "Missions", amount: "$1,650", pct: 7, color: "bg-teal-500" },
  { label: "Benevolence", amount: "$1,140", pct: 4, color: "bg-pink-500" },
];

export function AdminFinanceScreen() {
  const [period, setPeriod] = useState("This Month");

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
          <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wide">Admin</p>
          <h1 className="text-lg font-black text-white leading-tight">Finance & Giving</h1>
        </div>
        <button className="w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center">
          <Download className="w-4 h-4 text-gray-300" />
        </button>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 px-4 pt-3 pb-1">
        {["This Month", "This Year", "All Time"].map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${period === p ? "bg-emerald-600 border-emerald-600 text-white" : "border-white/15 text-gray-400 bg-white/4"}`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Total Card */}
      <div className="mx-4 mt-3 mb-3 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-700 p-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-24 opacity-10" style={{ background: "repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)", backgroundSize: "8px 8px" }}></div>
        <p className="text-emerald-200 text-xs font-semibold uppercase tracking-wide mb-1">Total Received · March 2026</p>
        <p className="text-white text-3xl font-black">$24,830</p>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1 text-emerald-200 text-xs font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            +8.2% vs last month
          </div>
        </div>
        <div className="flex gap-4 mt-3">
          <div>
            <p className="text-emerald-300 text-[10px]">Online</p>
            <p className="text-white text-sm font-bold">$18,540</p>
          </div>
          <div>
            <p className="text-emerald-300 text-[10px]">In-Person</p>
            <p className="text-white text-sm font-bold">$6,290</p>
          </div>
          <div>
            <p className="text-emerald-300 text-[10px]">Recurring</p>
            <p className="text-white text-sm font-bold">64%</p>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="px-4 mb-4">
        <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-bold text-white">Monthly Trend</p>
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
              <ArrowUpRight className="w-3 h-3" />
              2026
            </div>
          </div>
          <div className="flex items-end gap-2 h-20">
            {months.map((m, i) => (
              <div key={m} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t-md ${i === 5 ? "bg-emerald-500" : "bg-white/15"}`}
                  style={{ height: `${barValues[i]}%` }}
                ></div>
                <span className={`text-[9px] ${i === 5 ? "text-emerald-400 font-bold" : "text-gray-600"}`}>{m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Giving Breakdown */}
      <div className="px-4 mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Giving Breakdown</p>
        <div className="bg-white/4 border border-white/8 rounded-2xl p-4 flex flex-col gap-3">
          {breakdown.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-white/80 font-medium">{item.label}</span>
                <span className="text-sm text-white font-bold">{item.amount}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }}></div>
              </div>
              <p className="text-right text-[10px] text-gray-500 mt-0.5">{item.pct}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Recent Transactions</p>
          <div className="flex items-center gap-2">
            <button className="w-7 h-7 bg-white/8 rounded-lg flex items-center justify-center">
              <Filter className="w-3 h-3 text-gray-400" />
            </button>
            <span className="text-xs text-emerald-400">Export</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {transactions.map((tx, i) => (
            <div key={i} className="flex items-center gap-3 bg-white/4 border border-white/8 rounded-xl px-3 py-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{tx.name}</p>
                <p className="text-gray-500 text-xs">{tx.type} · {tx.date}</p>
              </div>
              <p className={`font-bold text-sm flex-shrink-0 ${tx.color}`}>{tx.amount}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
