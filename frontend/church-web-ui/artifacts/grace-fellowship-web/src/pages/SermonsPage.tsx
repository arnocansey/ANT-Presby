import { useState } from "react";
import { Link } from "wouter";
import { Play, Search, Filter, Clock, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const sermons = [
  { id: 1, title: "Walking in the Light of God", series: "Faith & Hope", pastor: "Pastor David Johnson", date: "March 17, 2026", duration: "42:15", gradient: "from-indigo-600 to-purple-600" },
  { id: 2, title: "The Power of Prayer", series: "Foundations of Faith", pastor: "Pastor Sarah Williams", date: "March 10, 2026", duration: "38:45", gradient: "from-teal-600 to-cyan-600" },
  { id: 3, title: "Grace Upon Grace", series: "Understanding Grace", pastor: "Pastor David Johnson", date: "March 3, 2026", duration: "45:30", gradient: "from-rose-600 to-pink-600" },
  { id: 4, title: "Strength in Weakness", series: "Faith & Hope", pastor: "Pastor Marcus Lee", date: "Feb 24, 2026", duration: "36:20", gradient: "from-orange-600 to-amber-600" },
  { id: 5, title: "Living as Light", series: "Sermon on the Mount", pastor: "Pastor David Johnson", date: "Feb 17, 2026", duration: "41:00", gradient: "from-green-600 to-emerald-600" },
  { id: 6, title: "Rivers of Living Water", series: "Understanding Grace", pastor: "Pastor Sarah Williams", date: "Feb 10, 2026", duration: "39:55", gradient: "from-blue-600 to-indigo-600" },
  { id: 7, title: "Blessed are the Peacemakers", series: "Sermon on the Mount", pastor: "Pastor Marcus Lee", date: "Feb 3, 2026", duration: "44:10", gradient: "from-violet-600 to-purple-600" },
  { id: 8, title: "Joy in Every Season", series: "Foundations of Faith", pastor: "Pastor David Johnson", date: "Jan 27, 2026", duration: "37:30", gradient: "from-cyan-600 to-teal-600" },
];

const series = ["All", "Faith & Hope", "Foundations of Faith", "Understanding Grace", "Sermon on the Mount"];
const pastors = ["All Pastors", "Pastor David Johnson", "Pastor Sarah Williams", "Pastor Marcus Lee"];

export default function SermonsPage() {
  const [search, setSearch] = useState("");
  const [activeSeries, setActiveSeries] = useState("All");
  const [activePastor, setActivePastor] = useState("All Pastors");

  const filtered = sermons.filter((s) => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.series.toLowerCase().includes(search.toLowerCase()) ||
      s.pastor.toLowerCase().includes(search.toLowerCase());
    const matchSeries = activeSeries === "All" || s.series === activeSeries;
    const matchPastor = activePastor === "All Pastors" || s.pastor === activePastor;
    return matchSearch && matchSeries && matchPastor;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground mb-2">Sermon Library</h1>
        <p className="text-muted-foreground">Listen to messages from our pastors and teachers.</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-card border-card-border"
            placeholder="Search sermons, series, pastors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-sermons"
          />
        </div>
        <select
          className="bg-card border border-card-border rounded-lg px-3 py-2 text-sm text-foreground"
          value={activePastor}
          onChange={(e) => setActivePastor(e.target.value)}
          data-testid="select-pastor"
        >
          {pastors.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Series filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {series.map((s) => (
          <button
            key={s}
            onClick={() => setActiveSeries(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeSeries === s
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-card-border text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`filter-series-${s.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No sermons match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map((sermon) => (
            <Link key={sermon.id} href={`/sermons/${sermon.id}`}>
              <div className="bg-card border border-card-border rounded-2xl overflow-hidden hover:border-primary/40 transition-colors group cursor-pointer" data-testid={`card-sermon-${sermon.id}`}>
                <div className={`h-40 bg-gradient-to-br ${sermon.gradient} flex items-center justify-center relative`}>
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 text-white fill-white ml-1" />
                  </div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-1">
                    <span className="bg-black/40 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1">
                      <Clock className="w-3 h-3" />{sermon.duration}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">{sermon.series}</p>
                  <h3 className="text-foreground font-bold leading-tight mb-2 line-clamp-2">{sermon.title}</h3>
                  <p className="text-muted-foreground text-xs">{sermon.pastor}</p>
                  <p className="text-muted-foreground text-xs">{sermon.date}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
