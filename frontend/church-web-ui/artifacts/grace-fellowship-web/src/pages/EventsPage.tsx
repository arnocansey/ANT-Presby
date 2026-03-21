import { useState } from "react";
import { Calendar, MapPin, Clock, Search, Users, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const events = [
  { id: 1, title: "Easter Prayer Night", category: "Worship", month: "MAR", day: "22", time: "7:00 PM", location: "Main Sanctuary", spots: 200, registered: 145, color: "bg-amber-500", desc: "Join us for a powerful night of prayer and worship as we approach the Easter season." },
  { id: 2, title: "Women's Conference", category: "Ministry", month: "APR", day: "5", time: "9:00 AM – 5:00 PM", location: "Fellowship Hall", spots: 100, registered: 67, color: "bg-purple-500", desc: "A full day of teaching, worship, and fellowship for women of all ages." },
  { id: 3, title: "Youth Retreat", category: "Youth", month: "APR", day: "12", time: "All Day", location: "Camp Graceland", spots: 60, registered: 48, color: "bg-green-600", desc: "An unforgettable weekend of adventure, fellowship, and spiritual growth for teens." },
  { id: 4, title: "Men's Breakfast", category: "Ministry", month: "APR", day: "18", time: "8:00 AM", location: "Church Dining Hall", spots: 80, registered: 32, color: "bg-blue-600", desc: "Monthly fellowship breakfast for the men of Grace Fellowship." },
  { id: 5, title: "Community Outreach Day", category: "Outreach", month: "APR", day: "26", time: "10:00 AM", location: "City Park", spots: 150, registered: 89, color: "bg-teal-600", desc: "Serve our city alongside your church family. All are welcome." },
  { id: 6, title: "New Members Class", category: "Education", month: "MAY", day: "3", time: "11:30 AM", location: "Room 201", spots: 30, registered: 12, color: "bg-rose-600", desc: "Learn about Grace Fellowship's vision, values, and how to get connected." },
];

const categories = ["All", "Worship", "Ministry", "Youth", "Outreach", "Education"];

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [rsvped, setRsvped] = useState<number[]>([]);

  const filtered = events.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || e.category === activeCategory;
    return matchSearch && matchCat;
  });

  const toggleRsvp = (id: number) => {
    setRsvped((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground mb-2">Events</h1>
        <p className="text-muted-foreground">Stay connected with what's happening at Grace Fellowship.</p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9 bg-card border-card-border"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-events"
        />
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-card-border text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`filter-category-${cat.toLowerCase()}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Events list */}
      <div className="flex flex-col gap-4">
        {filtered.map((event) => {
          const isRsvped = rsvped.includes(event.id);
          const pct = Math.round((event.registered / event.spots) * 100);
          return (
            <div key={event.id} className="bg-card border border-card-border rounded-2xl p-5 flex flex-col sm:flex-row gap-5 hover:border-primary/40 transition-colors" data-testid={`card-event-${event.id}`}>
              {/* Date badge */}
              <div className={`${event.color} rounded-xl w-16 h-16 flex flex-col items-center justify-center shrink-0`}>
                <span className="text-white text-[10px] font-bold tracking-wider">{event.month}</span>
                <span className="text-white text-2xl font-black leading-none">{event.day}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-foreground font-bold text-lg">{event.title}</h3>
                  <Badge className="bg-secondary text-secondary-foreground border-0 text-xs">{event.category}</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-2">{event.desc}</p>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{event.time}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{event.registered}/{event.spots} registered</span>
                </div>
                {/* Progress bar */}
                <div className="mt-3 bg-muted rounded-full h-1.5 w-48 max-w-full">
                  <div
                    className="bg-primary rounded-full h-1.5 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Action */}
              <div className="flex items-start shrink-0">
                <Button
                  size="sm"
                  variant={isRsvped ? "secondary" : "default"}
                  className={isRsvped ? "bg-primary/15 text-primary border-primary/30" : ""}
                  onClick={() => toggleRsvp(event.id)}
                  data-testid={`btn-rsvp-${event.id}`}
                >
                  {isRsvped ? "✓ Registered" : "RSVP"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
