import { Link } from "wouter";
import {
  Play, Calendar, Gift, Users, Heart, MapPin, Clock,
  ChevronRight, BookOpen, ArrowRight, Mic, Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const latestSermons = [
  {
    id: 1,
    title: "Walking in the Light of God",
    series: "Faith & Hope",
    pastor: "Pastor David Johnson",
    date: "March 17, 2026",
    duration: "42:15",
    gradient: "from-indigo-600 to-purple-600",
  },
  {
    id: 2,
    title: "The Power of Prayer",
    series: "Foundations of Faith",
    pastor: "Pastor Sarah Williams",
    date: "March 10, 2026",
    duration: "38:45",
    gradient: "from-teal-600 to-cyan-600",
  },
  {
    id: 3,
    title: "Grace Upon Grace",
    series: "Understanding Grace",
    pastor: "Pastor David Johnson",
    date: "March 3, 2026",
    duration: "45:30",
    gradient: "from-rose-600 to-pink-600",
  },
];

const upcomingEvents = [
  {
    id: 1,
    title: "Easter Prayer Night",
    date: "Mar 22",
    month: "MAR",
    day: "22",
    time: "7:00 PM",
    location: "Main Sanctuary",
    color: "bg-amber-500",
  },
  {
    id: 2,
    title: "Women's Conference",
    date: "Apr 5",
    month: "APR",
    day: "5",
    time: "9:00 AM",
    location: "Fellowship Hall",
    color: "bg-purple-500",
  },
  {
    id: 3,
    title: "Youth Retreat",
    date: "Apr 12",
    month: "APR",
    day: "12",
    time: "All Day",
    location: "Camp Graceland",
    color: "bg-green-600",
  },
];

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="py-10 md:py-16">
        <div className="rounded-3xl overflow-hidden relative min-h-[380px] md:min-h-[460px] flex items-end"
          style={{ background: "linear-gradient(135deg, #b45309 0%, #f59e0b 50%, #ea580c 100%)" }}>
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
          <div className="relative p-8 md:p-12 w-full">
            <div className="inline-flex items-center bg-white/20 rounded-full px-3 py-1 text-sm font-medium text-white mb-4 backdrop-blur-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse inline-block" />
              LIVE NOW — Sunday Worship Service
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight max-w-xl mb-4">
              Where Grace<br />Meets Community
            </h1>
            <p className="text-amber-100 text-lg mb-6 max-w-md">
              Join thousands worshipping together. Every Sunday, online and in person.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="bg-white text-amber-700 hover:bg-amber-50 font-bold gap-2 rounded-full" data-testid="btn-watch-live">
                <Play className="w-4 h-4 fill-amber-700" />
                Watch Live
              </Button>
              <Link href="/events">
                <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10 font-bold gap-2 rounded-full" data-testid="btn-plan-visit">
                  Plan Your Visit
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Service info strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        {[
          { icon: Clock, label: "Sunday Services", value: "10:00 AM & 12:00 PM" },
          { icon: MapPin, label: "Location", value: "123 Faith Avenue, Grace City" },
          { icon: Video, label: "Watch Online", value: "Stream every Sunday" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-4 bg-card border border-card-border rounded-2xl p-4">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <item.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{item.label}</p>
              <p className="text-foreground font-semibold text-sm">{item.value}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Latest Sermons */}
      <section className="mb-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Latest Sermons</h2>
          <Link href="/sermons">
            <button className="flex items-center gap-1.5 text-primary text-sm font-medium hover:underline" data-testid="link-all-sermons">
              See All <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {latestSermons.map((sermon) => (
            <Link key={sermon.id} href={`/sermons/${sermon.id}`}>
              <div className="bg-card border border-card-border rounded-2xl overflow-hidden hover:border-primary/40 transition-colors group cursor-pointer" data-testid={`card-sermon-${sermon.id}`}>
                <div className={`h-40 bg-gradient-to-br ${sermon.gradient} flex items-center justify-center relative`}>
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 text-white fill-white ml-1" />
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span className="bg-black/40 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">{sermon.duration}</span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">Series: {sermon.series}</p>
                  <h3 className="text-foreground font-bold leading-tight mb-2">{sermon.title}</h3>
                  <p className="text-muted-foreground text-xs">{sermon.pastor} • {sermon.date}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="mb-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Upcoming Events</h2>
          <Link href="/events">
            <button className="flex items-center gap-1.5 text-primary text-sm font-medium hover:underline" data-testid="link-all-events">
              See All <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {upcomingEvents.map((event) => (
            <div key={event.id} className="flex items-center gap-4 bg-card border border-card-border rounded-2xl p-4 hover:border-primary/40 transition-colors" data-testid={`card-event-${event.id}`}>
              <div className={`${event.color} rounded-xl w-14 h-14 flex flex-col items-center justify-center shrink-0`}>
                <span className="text-white text-[10px] font-bold">{event.month}</span>
                <span className="text-white text-xl font-black leading-none">{event.day}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-foreground font-bold">{event.title}</h3>
                <p className="text-muted-foreground text-sm">{event.time} • {event.location}</p>
              </div>
              <Button size="sm" variant="outline" className="shrink-0 border-primary/30 text-primary hover:bg-primary/10" data-testid={`btn-rsvp-${event.id}`}>
                RSVP
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Action Cards */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold text-foreground mb-6">Get Involved</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              href: "/give",
              icon: Gift,
              label: "Give Online",
              desc: "Support our ministry",
              colorClass: "bg-amber-500/15 text-amber-400",
              border: "hover:border-amber-500/40",
            },
            {
              href: "/groups",
              icon: Users,
              label: "Small Groups",
              desc: "Find your community",
              colorClass: "bg-pink-500/15 text-pink-400",
              border: "hover:border-pink-500/40",
            },
            {
              href: "/prayer",
              icon: Heart,
              label: "Prayer Wall",
              desc: "Share & intercede",
              colorClass: "bg-rose-500/15 text-rose-400",
              border: "hover:border-rose-500/40",
            },
            {
              href: "/sermons",
              icon: BookOpen,
              label: "Sermon Library",
              desc: "Explore messages",
              colorClass: "bg-blue-500/15 text-blue-400",
              border: "hover:border-blue-500/40",
            },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`bg-card border border-card-border rounded-2xl p-5 flex flex-col gap-3 cursor-pointer transition-colors ${item.border}`} data-testid={`card-action-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className={`w-12 h-12 rounded-xl ${item.colorClass} flex items-center justify-center`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-foreground font-bold">{item.label}</p>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground mt-auto" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
