import { useParams, Link } from "wouter";
import { Play, ArrowLeft, Share2, Heart, Download, BookOpen, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const sermons: Record<string, {
  id: number; title: string; series: string; pastor: string;
  date: string; duration: string; gradient: string; description: string; scripture: string;
}> = {
  "1": {
    id: 1, title: "Walking in the Light of God", series: "Faith & Hope", pastor: "Pastor David Johnson",
    date: "March 17, 2026", duration: "42:15", gradient: "from-indigo-600 to-purple-600",
    description: "In this powerful message, Pastor David explores what it means to walk in the light of God. Drawing from John 8:12, we discover how Jesus as the light of the world transforms our daily walk, relationships, and decisions.",
    scripture: "John 8:12",
  },
  "2": {
    id: 2, title: "The Power of Prayer", series: "Foundations of Faith", pastor: "Pastor Sarah Williams",
    date: "March 10, 2026", duration: "38:45", gradient: "from-teal-600 to-cyan-600",
    description: "Prayer is the foundation of our relationship with God. Pastor Sarah unpacks the transformative power of prayer and how to build a consistent, powerful prayer life that changes everything.",
    scripture: "Philippians 4:6-7",
  },
};

export default function SermonDetailPage() {
  const params = useParams<{ id: string }>();
  const sermon = sermons[params.id] || sermons["1"];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/sermons">
        <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors" data-testid="btn-back-sermons">
          <ArrowLeft className="w-4 h-4" />
          Back to Sermons
        </button>
      </Link>

      {/* Video player area */}
      <div className={`rounded-3xl overflow-hidden bg-gradient-to-br ${sermon.gradient} relative mb-8`} style={{ aspectRatio: "16/9" }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <button className="w-20 h-20 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center backdrop-blur-sm" data-testid="btn-play-sermon">
            <Play className="w-10 h-10 text-white fill-white ml-1" />
          </button>
        </div>
        <div className="absolute bottom-4 right-4">
          <span className="bg-black/50 text-white text-sm px-3 py-1 rounded-full">{sermon.duration}</span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div className="flex-1">
          <Badge className="bg-primary/15 text-primary border-0 mb-2">{sermon.series}</Badge>
          <h1 className="text-2xl md:text-3xl font-black text-foreground mb-2">{sermon.title}</h1>
          <p className="text-muted-foreground">{sermon.pastor} • {sermon.date}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-2" data-testid="btn-like-sermon">
            <Heart className="w-4 h-4" /> Like
          </Button>
          <Button variant="outline" size="sm" className="gap-2" data-testid="btn-share-sermon">
            <Share2 className="w-4 h-4" /> Share
          </Button>
          <Button variant="outline" size="sm" className="gap-2" data-testid="btn-download-sermon">
            <Download className="w-4 h-4" /> Audio
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Description */}
        <div className="md:col-span-2">
          <div className="bg-card border border-card-border rounded-2xl p-6 mb-6">
            <h2 className="font-bold text-foreground mb-3">About This Message</h2>
            <p className="text-muted-foreground leading-relaxed">{sermon.description}</p>
          </div>
          <div className="bg-card border border-card-border rounded-2xl p-6">
            <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> Key Scripture
            </h2>
            <p className="text-primary font-semibold">{sermon.scripture}</p>
          </div>
        </div>

        {/* Related */}
        <div>
          <h3 className="font-bold text-foreground mb-3">More from this Series</h3>
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <Link key={i} href={`/sermons/${i}`}>
                <div className="flex gap-3 items-center bg-card border border-card-border rounded-xl p-3 hover:border-primary/40 transition-colors cursor-pointer" data-testid={`related-sermon-${i}`}>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${sermon.gradient} flex items-center justify-center shrink-0`}>
                    <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-sm font-semibold line-clamp-1">Message {i}</p>
                    <p className="text-muted-foreground text-xs">{sermon.pastor}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
