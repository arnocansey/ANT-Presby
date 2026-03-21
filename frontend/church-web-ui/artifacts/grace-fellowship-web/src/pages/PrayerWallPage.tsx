import { useState } from "react";
import { Heart, Send, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const initialRequests = [
  { id: 1, name: "Anonymous", time: "1h ago", category: "Health", request: "Please pray for my mother who is undergoing surgery next week. We trust in God's healing power.", prays: 47, prayed: false },
  { id: 2, name: "Samuel M.", time: "3h ago", category: "Family", request: "Praying for reconciliation in my family. God can restore what was broken.", prays: 32, prayed: false },
  { id: 3, name: "Grace A.", time: "5h ago", category: "Work", request: "Please pray for wisdom as I navigate a difficult decision at work. I want to honor God in all I do.", prays: 28, prayed: false },
  { id: 4, name: "James O.", time: "1d ago", category: "Spiritual Growth", request: "Asking for prayer as I recommit to reading Scripture daily. I need consistency and discipline.", prays: 61, prayed: false },
  { id: 5, name: "Rebecca O.", time: "2d ago", category: "Missions", request: "Pray for the mission team traveling to Kenya next month. Safe travels and open hearts.", prays: 89, prayed: false },
];

const categories = ["Health", "Family", "Work", "Spiritual Growth", "Missions", "Finances", "Other"];

export default function PrayerWallPage() {
  const [requests, setRequests] = useState(initialRequests);
  const [name, setName] = useState("");
  const [request, setRequest] = useState("");
  const [category, setCategory] = useState("Other");
  const [anonymous, setAnonymous] = useState(false);

  const togglePray = (id: number) => {
    setRequests((prev) => prev.map((r) =>
      r.id === id ? { ...r, prayed: !r.prayed, prays: r.prayed ? r.prays - 1 : r.prays + 1 } : r
    ));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!request.trim()) return;
    setRequests([{
      id: Date.now(),
      name: anonymous ? "Anonymous" : (name.trim() || "Anonymous"),
      time: "Just now",
      category,
      request,
      prays: 0,
      prayed: false,
    }, ...requests]);
    setName("");
    setRequest("");
    setAnonymous(false);
  };

  const categoryColors: Record<string, string> = {
    Health: "bg-red-500/15 text-red-400",
    Family: "bg-amber-500/15 text-amber-400",
    Work: "bg-blue-500/15 text-blue-400",
    "Spiritual Growth": "bg-purple-500/15 text-purple-400",
    Missions: "bg-green-500/15 text-green-400",
    Finances: "bg-teal-500/15 text-teal-400",
    Other: "bg-muted text-muted-foreground",
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-foreground mb-2">Prayer Wall</h1>
        <p className="text-muted-foreground">Share your requests. Stand in prayer for one another.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Submit form */}
        <form onSubmit={submit} className="lg:col-span-1 bg-card border border-card-border rounded-2xl p-5 flex flex-col gap-4 h-fit">
          <h2 className="font-bold text-foreground">Submit a Prayer Request</h2>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Your Name</label>
            <Input
              className="bg-muted/30 border-card-border"
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={anonymous}
              data-testid="input-prayer-name"
            />
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                data-testid="check-anonymous"
              />
              <span className="text-xs text-muted-foreground">Submit anonymously</span>
            </label>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Category</label>
            <select
              className="w-full bg-muted/30 border border-card-border rounded-lg px-3 py-2 text-sm text-foreground"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              data-testid="select-category"
            >
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Prayer Request</label>
            <Textarea
              className="bg-muted/30 border-card-border resize-none"
              placeholder="Share your prayer request..."
              rows={4}
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              data-testid="textarea-prayer-request"
            />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={!request.trim()} data-testid="btn-submit-prayer">
            <Send className="w-4 h-4" /> Submit Request
          </Button>
        </form>

        {/* Prayer wall */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {requests.map((req) => (
            <div key={req.id} className="bg-card border border-card-border rounded-2xl p-5" data-testid={`card-prayer-${req.id}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground text-sm">{req.name}</span>
                    <Badge className={`text-[10px] py-0 border-0 ${categoryColors[req.category] || categoryColors.Other}`}>
                      {req.category}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">{req.time}</p>
                </div>
                <button
                  onClick={() => togglePray(req.id)}
                  className={`flex items-center gap-1.5 text-sm shrink-0 transition-colors px-3 py-1.5 rounded-lg border ${
                    req.prayed
                      ? "bg-primary/15 text-primary border-primary/30"
                      : "border-card-border text-muted-foreground hover:text-primary hover:border-primary/30"
                  }`}
                  data-testid={`btn-pray-${req.id}`}
                >
                  <Hand className="w-3.5 h-3.5" />
                  <span>{req.prays} Praying</span>
                </button>
              </div>
              <p className="text-foreground text-sm leading-relaxed">{req.request}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
