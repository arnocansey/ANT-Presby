import { useState } from "react";
import { Users, MapPin, Clock, Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const groups = [
  { id: 1, name: "Young Adults Bible Study", leader: "Pastor Sarah Williams", day: "Tuesday", time: "7:00 PM", location: "Room 101", category: "Bible Study", members: 18, max: 25, color: "bg-blue-500" },
  { id: 2, name: "Women of Grace", leader: "Linda Patterson", day: "Wednesday", time: "10:00 AM", location: "Fellowship Hall", category: "Women", members: 22, max: 30, color: "bg-pink-500" },
  { id: 3, name: "Men of Valor", leader: "James Ofori", day: "Saturday", time: "8:00 AM", location: "Church Dining Hall", category: "Men", members: 14, max: 20, color: "bg-blue-700" },
  { id: 4, name: "Couples & Marriage", leader: "David & Mary Johnson", day: "Friday", time: "7:30 PM", location: "Room 205", category: "Couples", members: 10, max: 12, color: "bg-rose-500" },
  { id: 5, name: "Prayer & Intercession", leader: "Grace Asante", day: "Monday", time: "6:00 AM", location: "Prayer Room", category: "Prayer", members: 8, max: 15, color: "bg-purple-500" },
  { id: 6, name: "Youth Small Group (Teens)", leader: "Marcus Lee", day: "Thursday", time: "6:30 PM", location: "Youth Room", category: "Youth", members: 16, max: 20, color: "bg-green-600" },
];

const categories = ["All", "Bible Study", "Women", "Men", "Couples", "Prayer", "Youth"];

export default function SmallGroupsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = groups.filter((g) => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.leader.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || g.category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground mb-2">Small Groups</h1>
        <p className="text-muted-foreground">Find your community. Life is better together.</p>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9 bg-card border-card-border"
          placeholder="Search groups or leaders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-groups"
        />
      </div>

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
            data-testid={`filter-${cat.toLowerCase()}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((group) => {
          const pct = Math.round((group.members / group.max) * 100);
          const isFull = group.members >= group.max;
          return (
            <div key={group.id} className="bg-card border border-card-border rounded-2xl p-5 flex flex-col gap-3 hover:border-primary/40 transition-colors" data-testid={`card-group-${group.id}`}>
              <div className="flex items-start justify-between gap-2">
                <div className={`w-10 h-10 rounded-xl ${group.color} flex items-center justify-center shrink-0`}>
                  <Users className="w-5 h-5 text-white" />
                </div>
                <Badge className={`text-xs border-0 ${isFull ? "bg-red-500/15 text-red-400" : "bg-green-500/15 text-green-400"}`}>
                  {isFull ? "Full" : "Open"}
                </Badge>
              </div>
              <div>
                <h3 className="text-foreground font-bold">{group.name}</h3>
                <p className="text-muted-foreground text-xs mt-0.5">Led by {group.leader}</p>
              </div>
              <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-2"><Clock className="w-3 h-3" />{group.day} · {group.time}</span>
                <span className="flex items-center gap-2"><MapPin className="w-3 h-3" />{group.location}</span>
                <span className="flex items-center gap-2"><Users className="w-3 h-3" />{group.members}/{group.max} members</span>
              </div>
              <div className="bg-muted rounded-full h-1.5">
                <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${pct}%` }} />
              </div>
              <Button size="sm" disabled={isFull} className="w-full mt-1" variant={isFull ? "secondary" : "default"} data-testid={`btn-join-${group.id}`}>
                {isFull ? "Join Waitlist" : "Join Group"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
