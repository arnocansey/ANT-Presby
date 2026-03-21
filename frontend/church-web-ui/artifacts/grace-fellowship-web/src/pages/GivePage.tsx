import { useState } from "react";
import { Heart, Gift, Shield, TrendingUp, ChevronRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const funds = [
  { id: "general", label: "General Fund", desc: "Support all church ministries", icon: Heart, color: "text-amber-400" },
  { id: "building", label: "Building Fund", desc: "Help expand our facilities", icon: TrendingUp, color: "text-blue-400" },
  { id: "missions", label: "Missions", desc: "Support global outreach", icon: Gift, color: "text-green-400" },
  { id: "youth", label: "Youth Ministry", desc: "Invest in the next generation", icon: ChevronRight, color: "text-purple-400" },
];

const quickAmounts = [25, 50, 100, 250, 500];

export default function GivePage() {
  const [amount, setAmount] = useState("");
  const [selectedFund, setSelectedFund] = useState("general");
  const [frequency, setFrequency] = useState<"one-time" | "weekly" | "monthly">("one-time");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-3">Thank You!</h2>
        <p className="text-muted-foreground mb-6">
          Your gift of <span className="text-primary font-bold">${parseFloat(amount || "0").toFixed(2)}</span> to the{" "}
          <span className="text-foreground font-semibold">{funds.find((f) => f.id === selectedFund)?.label}</span> has been received.
          Your generosity makes a real difference.
        </p>
        <Button onClick={() => { setSubmitted(false); setAmount(""); }} data-testid="btn-give-again">
          Give Again
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-foreground mb-2">Give Online</h1>
        <p className="text-muted-foreground">Your generosity fuels our mission and community.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Give form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 flex flex-col gap-6">
          {/* Fund selection */}
          <div>
            <h2 className="font-bold text-foreground mb-3">Choose a Fund</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {funds.map((fund) => (
                <button
                  key={fund.id}
                  type="button"
                  onClick={() => setSelectedFund(fund.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-colors ${
                    selectedFund === fund.id
                      ? "border-primary bg-primary/10"
                      : "border-card-border bg-card hover:border-primary/40"
                  }`}
                  data-testid={`fund-${fund.id}`}
                >
                  <fund.icon className={`w-5 h-5 shrink-0 ${fund.color}`} />
                  <div>
                    <p className="font-semibold text-foreground text-sm">{fund.label}</p>
                    <p className="text-muted-foreground text-xs">{fund.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <h2 className="font-bold text-foreground mb-3">Frequency</h2>
            <div className="flex gap-2">
              {(["one-time", "weekly", "monthly"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                    frequency === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-card-border text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`frequency-${f}`}
                >
                  {f.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <h2 className="font-bold text-foreground mb-3">Amount</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {quickAmounts.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmount(String(a))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    amount === String(a)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-card-border text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`amount-${a}`}
                >
                  ${a}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">$</span>
              <Input
                className="pl-7 bg-card border-card-border text-lg font-bold"
                placeholder="Other amount"
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                data-testid="input-amount"
              />
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full gap-2 font-bold text-base" data-testid="btn-give-submit">
            <Heart className="w-5 h-5" />
            Give {amount ? `$${parseFloat(amount).toFixed(2)}` : "Now"}
          </Button>

          <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            Secured by 256-bit SSL encryption
          </div>
        </form>

        {/* Impact sidebar */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="bg-gradient-to-br from-amber-600 to-orange-600 rounded-2xl p-6 text-white">
            <h3 className="font-bold text-lg mb-1">Your Impact</h3>
            <p className="text-amber-100 text-sm mb-4">Every dollar makes a difference.</p>
            <div className="flex flex-col gap-3">
              {[
                { amount: "$25", impact: "Feeds a family for a week" },
                { amount: "$50", impact: "Sponsors a youth camp spot" },
                { amount: "$100", impact: "Supports a missionary family" },
                { amount: "$250", impact: "Funds a community event" },
              ].map((item) => (
                <div key={item.amount} className="flex items-center gap-3 bg-white/10 rounded-xl px-3 py-2">
                  <span className="font-black text-white text-sm w-12 shrink-0">{item.amount}</span>
                  <span className="text-amber-100 text-xs">{item.impact}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-2xl p-5">
            <h3 className="font-bold text-foreground mb-3">2026 Giving Progress</h3>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Goal: $500,000</span>
              <span className="text-primary font-bold">68%</span>
            </div>
            <div className="bg-muted rounded-full h-3 mb-3">
              <div className="bg-primary rounded-full h-3" style={{ width: "68%" }} />
            </div>
            <p className="text-xs text-muted-foreground">$340,000 raised of $500,000 annual goal</p>
          </div>

          <div className="bg-card border border-card-border rounded-2xl p-5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Grace Fellowship is a registered 501(c)(3) nonprofit. All donations are tax-deductible. 
              You will receive an email receipt after your gift is processed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
