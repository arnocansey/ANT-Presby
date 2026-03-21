'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart,
  MessageSquare,
  Send,
  Trash2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  useCommunityFeed,
  useCreateCommunityComment,
  useCreateCommunityPost,
  useDeleteCommunityComment,
  useDeleteCommunityPost,
  useToggleCommunityLike,
} from '@/hooks/useApi';
import { APP_NAME } from '@/lib/app-config';
import { useAuthStore } from '@/lib/store';
import { cn, formatDateTime, getInitials, getUserFullName, resolveAssetUrl, truncate } from '@/lib/utils';

const EmptyState = ({ text }: { text: string }) => (
  <Card className="border-white/10 bg-white/[0.03]">
    <CardContent className="p-8 text-center text-sm text-slate-300">{text}</CardContent>
  </Card>
);

const Avatar = ({ user }: { user: any }) => {
  const fullName = getUserFullName(user) || 'Member';
  const image = resolveAssetUrl(user?.profile_image_url || user?.profileImageUrl || null);

  if (image) {
    return (
      <Image
        src={image}
        alt={fullName}
        width={48}
        height={48}
        unoptimized
        className="h-12 w-12 rounded-2xl object-cover"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sm font-bold text-sky-200">
      {getInitials(user?.first_name || user?.firstName || 'A', user?.last_name || user?.lastName || 'P')}
    </div>
  );
};

export default function CommunityPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { data, isLoading, error } = useCommunityFeed();
  const createPost = useCreateCommunityPost();
  const createComment = useCreateCommunityComment();
  const toggleLike = useToggleCommunityLike();
  const deletePost = useDeleteCommunityPost();
  const deleteComment = useDeleteCommunityComment();

  const [content, setContent] = React.useState('');
  const [openCommentId, setOpenCommentId] = React.useState<number | null>(null);
  const [commentDrafts, setCommentDrafts] = React.useState<Record<number, string>>({});

  const posts = (data?.data || []) as any[];

  const handleShare = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    await createPost.mutateAsync({ content: trimmed });
    setContent('');
  };

  const handleComment = async (postId: number) => {
    const draft = String(commentDrafts[postId] || '').trim();
    if (!draft) return;
    await createComment.mutateAsync({ postId, content: draft });
    setCommentDrafts((state) => ({ ...state, [postId]: '' }));
    setOpenCommentId(postId);
  };

  return (
    <div className="bg-[#050816] pb-20 pt-10 text-white">
      <div className="container-max space-y-8">
        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_right,_rgba(249,115,22,0.3),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.22),_transparent_30%),linear-gradient(145deg,#0b1024,#11162f)] p-8 shadow-2xl shadow-slate-950/40">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
              <Users className="h-3.5 w-3.5" />
              Community Feed
            </div>
            <h1 className="max-w-2xl text-4xl font-black tracking-tight text-white sm:text-5xl">
              Share updates, encouragement, and conversation in one place.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
              The {APP_NAME} community feed brings members together around testimony, support, event excitement, and everyday life.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Real member posts</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Comments and likes</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Live with your current ANT PRESS account</span>
            </div>
          </div>

          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Start Here</p>
                <h2 className="mt-3 text-2xl font-bold">Join the conversation</h2>
              </div>
              {isAuthenticated ? (
                <>
                  <Textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    rows={6}
                    placeholder="Share an update, reflection, prayer win, or invite..."
                    className="min-h-40 border-white/10 bg-white/5 text-white placeholder:text-slate-400"
                  />
                  <Button
                    onClick={handleShare}
                    disabled={createPost.isPending || !content.trim()}
                    className="w-full rounded-full bg-amber-500 text-slate-950 hover:bg-amber-400"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Share Post
                  </Button>
                </>
              ) : (
                <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-slate-300">
                    Sign in to share your own posts, join the conversation, and react to the rest of the community.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild className="rounded-full bg-amber-500 text-slate-950 hover:bg-amber-400">
                      <Link href="/login">Sign In</Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/5">
                      <Link href="/register">Create Account</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            {isLoading && <EmptyState text="Loading the community feed..." />}
            {!isLoading && error && <EmptyState text="We couldn't load the community feed right now." />}
            {!isLoading && !error && posts.length === 0 && (
              <EmptyState text="The community feed is ready. The first post will show up here as soon as someone shares." />
            )}

            {posts.map((post) => {
              const canDeletePost =
                user?.role === 'admin' || Number(user?.id) === Number(post.author?.id);

              return (
                <Card key={post.id} className="overflow-hidden border-white/10 bg-white/[0.04] text-white shadow-lg shadow-slate-950/20">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <Avatar user={post.author} />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold">{getUserFullName(post.author) || 'Community Member'}</h3>
                            {post.is_pinned ? (
                              <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
                                Pinned
                              </span>
                            ) : null}
                            {post.author?.role === 'admin' ? (
                              <span className="rounded-full bg-sky-400/10 px-2.5 py-1 text-xs font-semibold text-sky-300">
                                Admin
                              </span>
                            ) : null}
                          </div>
                          <p className="text-sm text-slate-400">{formatDateTime(post.created_at)}</p>
                        </div>
                      </div>

                      {canDeletePost ? (
                        <button
                          type="button"
                          onClick={() => deletePost.mutate(post.id)}
                          className="rounded-full border border-white/10 p-2 text-slate-400 transition hover:border-red-400/40 hover:text-red-300"
                          aria-label="Delete post"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>

                    <p className="mt-5 whitespace-pre-wrap text-base leading-8 text-slate-100">{post.content}</p>

                    <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                      <button
                        type="button"
                        onClick={() => toggleLike.mutate(post.id)}
                        disabled={!isAuthenticated || toggleLike.isPending}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-full border px-4 py-2 transition',
                          post.liked_by_me
                            ? 'border-rose-400/30 bg-rose-400/10 text-rose-200'
                            : 'border-white/10 bg-white/5 hover:bg-white/10',
                          !isAuthenticated && 'cursor-not-allowed opacity-70'
                        )}
                      >
                        <Heart className={cn('h-4 w-4', post.liked_by_me && 'fill-current')} />
                        {post.like_count} likes
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenCommentId(openCommentId === post.id ? null : post.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10"
                      >
                        <MessageSquare className="h-4 w-4" />
                        {post.comment_count} comments
                      </button>
                    </div>

                    <div className="mt-5 space-y-4 rounded-3xl border border-white/10 bg-[#0a1126] p-4">
                      {(post.comments || []).length === 0 ? (
                        <p className="text-sm text-slate-400">No comments yet. Start the conversation.</p>
                      ) : (
                        (post.comments || []).map((comment: any) => {
                          const canDeleteComment =
                            user?.role === 'admin' || Number(user?.id) === Number(comment.author?.id);
                          return (
                            <div key={comment.id} className="flex items-start justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-white">
                                  {getUserFullName(comment.author) || 'Community Member'}
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                                  {comment.content}
                                </p>
                                <p className="mt-2 text-xs text-slate-500">{formatDateTime(comment.created_at)}</p>
                              </div>
                              {canDeleteComment ? (
                                <button
                                  type="button"
                                  onClick={() => deleteComment.mutate({ postId: post.id, commentId: comment.id })}
                                  className="rounded-full p-2 text-slate-500 transition hover:text-red-300"
                                  aria-label="Delete comment"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              ) : null}
                            </div>
                          );
                        })
                      )}

                      {isAuthenticated ? (
                        <div className="flex gap-3">
                          <Textarea
                            rows={3}
                            value={commentDrafts[post.id] || ''}
                            onChange={(event) =>
                              setCommentDrafts((state) => ({ ...state, [post.id]: event.target.value }))
                            }
                            placeholder="Add a thoughtful comment..."
                            className="border-white/10 bg-white/5 text-white placeholder:text-slate-400"
                          />
                          <Button
                            onClick={() => handleComment(post.id)}
                            disabled={createComment.isPending || !String(commentDrafts[post.id] || '').trim()}
                            className="shrink-0 rounded-2xl bg-sky-500 px-5 text-white hover:bg-sky-400"
                          >
                            Reply
                          </Button>
                        </div>
                      ) : openCommentId === post.id ? (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                          Sign in to join the discussion on this post.
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <aside className="space-y-5">
            <Card className="border-white/10 bg-white/[0.04] text-white">
              <CardContent className="space-y-4 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Community Notes</p>
                <div className="space-y-3 text-sm leading-7 text-slate-300">
                  <p>Share encouragement, testimonies, event moments, or practical updates that help the wider community stay connected.</p>
                  <p>Posts use your real ANT PRESS account, so names and profile photos stay in sync with the rest of the platform.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.04] text-white">
              <CardContent className="space-y-4 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Helpful Paths</p>
                <div className="space-y-3">
                  <Link href="/events" className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 transition hover:bg-white/[0.06]">
                    Browse upcoming events
                  </Link>
                  <Link href="/prayer/new" className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 transition hover:bg-white/[0.06]">
                    Submit a prayer request
                  </Link>
                  <Link href="/news" className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 transition hover:bg-white/[0.06]">
                    Read the latest announcements
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.04] text-white">
              <CardContent className="space-y-3 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-300">What shows here</p>
                <ul className="space-y-3 text-sm leading-7 text-slate-300">
                  {posts.slice(0, 3).map((post) => (
                    <li key={post.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <p className="font-semibold text-white">{getUserFullName(post.author) || 'Community Member'}</p>
                      <p>{truncate(post.content, 88)}</p>
                    </li>
                  ))}
                  {posts.length === 0 ? <li className="text-slate-400">Fresh community posts will appear here once members begin sharing.</li> : null}
                </ul>
              </CardContent>
            </Card>
          </aside>
        </section>
      </div>
    </div>
  );
}
