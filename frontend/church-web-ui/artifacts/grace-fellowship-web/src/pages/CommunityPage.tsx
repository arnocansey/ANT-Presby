import { useState } from "react";
import { Heart, MessageCircle, Share2, Send, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const avatarColors = [
  "bg-pink-500", "bg-blue-500", "bg-teal-500", "bg-orange-500",
  "bg-purple-500", "bg-green-600", "bg-rose-500"
];

const members = [
  { id: 1, name: "Rebecca O.", initials: "RO", color: "bg-pink-500" },
  { id: 2, name: "Samuel M.", initials: "SM", color: "bg-blue-500" },
  { id: 3, name: "Grace A.", initials: "GA", color: "bg-teal-500" },
  { id: 4, name: "James O.", initials: "JO", color: "bg-orange-500" },
  { id: 5, name: "Linda P.", initials: "LP", color: "bg-purple-500" },
];

const initialPosts = [
  {
    id: 1,
    author: "Grace Fellowship",
    authorInitials: "GF",
    authorColor: "bg-amber-500",
    isOfficial: true,
    time: "2h ago",
    content: "This Sunday's message was truly powerful. Thank you to everyone who joined us in person and online! Don't forget — Easter Prayer Night is this Friday at 7PM. See you there!",
    likes: 142,
    comments: 38,
    liked: false,
  },
  {
    id: 2,
    author: "Samuel Mensah",
    authorInitials: "SM",
    authorColor: "bg-blue-500",
    isOfficial: false,
    time: "4h ago",
    content: "Just finished listening to this week's sermon for the second time. Pastor David's message on John 8:12 is something I needed to hear. God's timing is always perfect 🙏",
    likes: 64,
    comments: 12,
    liked: false,
  },
  {
    id: 3,
    author: "Rebecca Osei",
    authorInitials: "RO",
    authorColor: "bg-pink-500",
    isOfficial: false,
    time: "6h ago",
    content: "Our Small Group had such a wonderful time together last night! We studied Philippians 4 and ended with prayer for each other. If you're not in a group yet, I encourage you to join one — it's been life-changing for me ❤️",
    likes: 87,
    comments: 21,
    liked: false,
  },
  {
    id: 4,
    author: "James Ofori",
    authorInitials: "JO",
    authorColor: "bg-orange-500",
    isOfficial: false,
    time: "1d ago",
    content: "Volunteered at the food pantry today with my family. Served over 120 families. This is what community looks like! Thank you Grace Fellowship for making this possible.",
    likes: 203,
    comments: 47,
    liked: false,
  },
];

export default function CommunityPage() {
  const [posts, setPosts] = useState(initialPosts);
  const [newPost, setNewPost] = useState("");

  const toggleLike = (id: number) => {
    setPosts((prev) => prev.map((p) =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ));
  };

  const submitPost = () => {
    if (!newPost.trim()) return;
    setPosts([{
      id: Date.now(),
      author: "You",
      authorInitials: "YO",
      authorColor: "bg-indigo-500",
      isOfficial: false,
      time: "Just now",
      content: newPost,
      likes: 0,
      comments: 0,
      liked: false,
    }, ...posts]);
    setNewPost("");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-foreground">Community</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
            <Users className="w-3.5 h-3.5" /> Grace Fellowship · 1,248 members
          </p>
        </div>
      </div>

      {/* Stories row */}
      <div className="flex gap-3 overflow-x-auto pb-2 mb-8 no-scrollbar">
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="w-14 h-14 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center cursor-pointer hover:border-primary/60 transition-colors" data-testid="btn-add-story">
            <Plus className="w-5 h-5 text-muted-foreground" />
          </div>
          <span className="text-[10px] text-muted-foreground">Your Story</span>
        </div>
        {members.map((m) => (
          <div key={m.id} className="flex flex-col items-center gap-1.5 shrink-0">
            <div className={`w-14 h-14 rounded-full ${m.color} flex items-center justify-center ring-2 ring-primary/60 ring-offset-2 ring-offset-background cursor-pointer`}>
              <span className="text-white text-sm font-bold">{m.initials}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">{m.name.split(" ")[0]}</span>
          </div>
        ))}
      </div>

      {/* Compose */}
      <div className="bg-card border border-card-border rounded-2xl p-4 mb-6">
        <Textarea
          className="bg-transparent border-0 resize-none text-foreground placeholder:text-muted-foreground focus-visible:ring-0 p-0 mb-3"
          placeholder="Share something with the community..."
          rows={3}
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          data-testid="textarea-new-post"
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={submitPost} disabled={!newPost.trim()} className="gap-2" data-testid="btn-post">
            <Send className="w-4 h-4" /> Post
          </Button>
        </div>
      </div>

      {/* Feed */}
      <div className="flex flex-col gap-5">
        {posts.map((post) => (
          <div key={post.id} className="bg-card border border-card-border rounded-2xl p-5" data-testid={`card-post-${post.id}`}>
            {/* Post header */}
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full ${post.authorColor} flex items-center justify-center shrink-0`}>
                <span className="text-white text-sm font-bold">{post.authorInitials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-foreground font-bold text-sm">{post.author}</span>
                  {post.isOfficial && (
                    <Badge className="bg-primary/15 text-primary border-0 text-[10px] py-0">OFFICIAL</Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">{post.time}</p>
              </div>
            </div>

            {/* Post content */}
            <p className="text-foreground text-sm leading-relaxed mb-4">{post.content}</p>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-3 border-t border-border">
              <button
                onClick={() => toggleLike(post.id)}
                className={`flex items-center gap-1.5 text-sm transition-colors ${post.liked ? "text-red-400" : "text-muted-foreground hover:text-red-400"}`}
                data-testid={`btn-like-${post.id}`}
              >
                <Heart className={`w-4 h-4 ${post.liked ? "fill-red-400" : ""}`} />
                {post.likes}
              </button>
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid={`btn-comment-${post.id}`}>
                <MessageCircle className="w-4 h-4" />
                {post.comments}
              </button>
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto" data-testid={`btn-share-${post.id}`}>
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
