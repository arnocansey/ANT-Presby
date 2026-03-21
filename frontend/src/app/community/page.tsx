'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Heart, MessageSquare, Send, Sparkles, Trash2, Users } from 'lucide-react';
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
import {
  cn,
  formatDateTime,
  getInitials,
  getUserFullName,
  resolveAssetUrl,
  truncate,
} from '@/lib/utils';

const SurfaceMessage = ({ text }: { text: string }) => (
  <Card className="rounded-[1.75rem] border-slate-200 bg-white shadow-sm">
    <CardContent className="p-8 text-center text-sm text-slate-500">{text}</CardContent>
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
        width={52}
        height={52}
        unoptimized
        className="h-13 w-13 rounded-2xl object-cover"
      />
    );
  }

  return (
    <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-sky-100 text-sm font-bold text-sky-700">
      {getInitials(
        user?.first_name || user?.firstName || 'A',
        user?.last_name || user?.lastName || 'P'
      )}
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
  };

  return (
    <div className="bg-[linear-gradient(180deg,#fff7ed_0%,#ffffff_18%,#f8fbff_100%)] pb-20">
      <section className="container-max py-10 md:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,rgb(180_83_9)_0%,rgb(245_158_11)_48%,rgb(234_88_12)_100%)] p-8 text-white shadow-2xl shadow-orange-200/60 md:p-10">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.45'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
              }}
            />
            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-white/95">
                <Users className="h-3.5 w-3.5" />
                Community Feed
              </div>
              <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-6xl">
                Where stories,
                <br />
                support, and shared life
                <br />
                meet in public.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-orange-50 sm:text-lg">
                Browse real community updates, join the conversation, and keep the heartbeat of {APP_NAME} close.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="#community-feed"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-base font-semibold !text-amber-700 shadow-sm transition-colors hover:bg-amber-50 hover:!text-amber-800"
                >
                  Explore Feed
                </Link>
                {!isAuthenticated ? (
                  <Link
                    href="/register"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-white/50 bg-transparent px-8 text-base font-semibold !text-white transition-colors hover:bg-white/10 hover:!text-white"
                  >
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4 text-white" />
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          <Card className="rounded-[2rem] border-slate-200 bg-white shadow-xl shadow-sky-100/60">
            <CardContent className="space-y-5 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">Start Here</p>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Join the conversation</h2>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  Share updates, encouragement, or event momentum with the wider community.
                </p>
              </div>

              {isAuthenticated ? (
                <>
                  <Textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    rows={6}
                    placeholder="Share an update, testimony, reflection, or invitation..."
                    className="min-h-44 rounded-[1.4rem] border-slate-200 bg-slate-50 text-slate-950 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={createPost.isPending || !content.trim()}
                    className="inline-flex h-12 w-full items-center justify-center rounded-full bg-sky-700 px-6 text-base font-semibold text-white transition-colors hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Share Post
                  </button>
                </>
              ) : (
                <div className="space-y-4 rounded-[1.6rem] bg-sky-50 p-5">
                  <p className="text-sm leading-7 text-slate-600">
                    Sign in to post, comment, and react to the community feed. You can still browse the conversation without an account.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/login"
                      className="inline-flex h-11 items-center justify-center rounded-full bg-sky-700 px-5 text-sm font-semibold !text-white transition-colors hover:bg-sky-800 hover:!text-white"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold !text-slate-900 transition-colors hover:bg-slate-50 hover:!text-slate-950"
                    >
                      Create Account
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container-max mb-8 grid gap-4 sm:grid-cols-3">
        <InfoTile
          label="Community Reach"
          value={`${posts.length} active posts`}
          tone="sky"
        />
        <InfoTile
          label="Conversation"
          value={`${posts.reduce((sum, post) => sum + Number(post.comment_count || 0), 0)} comments shared`}
          tone="amber"
        />
        <InfoTile
          label="Encouragement"
          value={`${posts.reduce((sum, post) => sum + Number(post.like_count || 0), 0)} likes across the feed`}
          tone="fuchsia"
        />
      </section>

      <section id="community-feed" className="container-max grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {isLoading && <SurfaceMessage text="Loading the community feed..." />}
          {!isLoading && error && <SurfaceMessage text="We couldn't load the community feed right now." />}
          {!isLoading && !error && posts.length === 0 && (
            <SurfaceMessage text="The feed is ready. The first community post will show up here as soon as someone shares." />
          )}

          {posts.map((post) => {
            const canDeletePost =
              user?.role === 'admin' || Number(user?.id) === Number(post.author?.id);

            return (
              <Card
                key={post.id}
                className="overflow-hidden rounded-[1.75rem] border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg hover:shadow-slate-200/70"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
                    <div className="flex min-w-0 items-start gap-4">
                      <Avatar user={post.author} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-lg font-bold text-slate-950">
                            {getUserFullName(post.author) || 'Community Member'}
                          </h3>
                          {post.is_pinned ? (
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                              Pinned
                            </span>
                          ) : null}
                          {post.author?.role === 'admin' ? (
                            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                              Admin
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm text-slate-500">{formatDateTime(post.created_at)}</p>
                      </div>
                    </div>

                    {canDeletePost ? (
                      <button
                        type="button"
                        onClick={() => deletePost.mutate(post.id)}
                        className="rounded-full border border-slate-200 p-2 text-slate-400 transition hover:border-red-200 hover:text-red-500"
                        aria-label="Delete post"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      ) : null}
                  </div>

                  <div className="mt-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                      Community Story
                    </p>
                    <p className="whitespace-pre-wrap text-base leading-8 text-slate-700">{post.content}</p>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
                    <button
                      type="button"
                      onClick={() => toggleLike.mutate(post.id)}
                      disabled={!isAuthenticated || toggleLike.isPending}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition',
                        post.liked_by_me
                          ? 'border-rose-200 bg-rose-50 text-rose-600'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                        !isAuthenticated && 'cursor-not-allowed opacity-70'
                      )}
                    >
                      <Heart className={cn('h-4 w-4', post.liked_by_me && 'fill-current')} />
                      {post.like_count} likes
                    </button>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">
                      <MessageSquare className="h-4 w-4" />
                      {post.comment_count} comments
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700">
                      <Sparkles className="h-4 w-4" />
                      Active conversation
                    </div>
                  </div>

                  <div className="mt-5 space-y-4 rounded-[1.5rem] bg-slate-50 p-4">
                    {(post.comments || []).length === 0 ? (
                      <p className="text-sm text-slate-500">No comments yet. Start the conversation.</p>
                    ) : (
                      (post.comments || []).map((comment: any) => {
                        const canDeleteComment =
                          user?.role === 'admin' || Number(user?.id) === Number(comment.author?.id);

                        return (
                          <div
                            key={comment.id}
                            className="flex items-start justify-between gap-3 rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-950">
                                {getUserFullName(comment.author) || 'Community Member'}
                              </p>
                              <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                                {comment.content}
                              </p>
                              <p className="mt-2 text-xs text-slate-400">{formatDateTime(comment.created_at)}</p>
                            </div>
                            {canDeleteComment ? (
                              <button
                                type="button"
                                onClick={() =>
                                  deleteComment.mutate({ postId: post.id, commentId: comment.id })
                                }
                                className="rounded-full p-2 text-slate-400 transition hover:text-red-500"
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
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Textarea
                          rows={3}
                          value={commentDrafts[post.id] || ''}
                          onChange={(event) =>
                            setCommentDrafts((state) => ({ ...state, [post.id]: event.target.value }))
                          }
                          placeholder="Add a thoughtful comment..."
                          className="rounded-[1.2rem] border-slate-200 bg-white text-slate-950 placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleComment(post.id)}
                          disabled={createComment.isPending || !String(commentDrafts[post.id] || '').trim()}
                          className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-sky-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Reply
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                        Sign in to join the discussion on this post.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <aside className="space-y-5">
          <Card className="rounded-[1.75rem] border-slate-200 bg-white shadow-sm">
            <CardContent className="space-y-4 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">Community Notes</p>
              <div className="space-y-3 text-sm leading-7 text-slate-600">
                <p>Share encouragement, testimonies, event moments, or practical updates that help the wider community stay connected.</p>
                <p>Posts use your real ANT PRESS account, so names and profile photos stay in sync with the rest of the platform.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-slate-200 bg-white shadow-sm">
            <CardContent className="space-y-4 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">Helpful Paths</p>
              <div className="space-y-3">
                <Link
                  href="/events"
                  className="block rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium !text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:!text-sky-700"
                >
                  Browse upcoming events
                </Link>
                <Link
                  href="/prayer/new"
                  className="block rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium !text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:!text-sky-700"
                >
                  Submit a prayer request
                </Link>
                <Link
                  href="/news"
                  className="block rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium !text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:!text-sky-700"
                >
                  Read the latest announcements
                </Link>
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 pt-1 text-sm font-semibold !text-sky-700 transition hover:!text-sky-800"
                >
                  Keep exploring
                  <ArrowRight className="h-4 w-4 text-sky-700" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[1.75rem] border-slate-200 bg-[linear-gradient(135deg,#0f766e_0%,#2563eb_100%)] text-white shadow-xl shadow-sky-100/60">
            <CardContent className="space-y-4 p-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100">
                <Sparkles className="h-3.5 w-3.5" />
                Community Pulse
              </div>
              <p className="text-sm leading-7 text-cyan-50">
                A healthy feed feels like a living foyer: updates from real people, practical care, and shared joy.
              </p>
              <ul className="space-y-3 text-sm leading-7 text-cyan-50">
                {posts.slice(0, 3).map((post) => (
                  <li key={post.id} className="rounded-[1.15rem] bg-white/10 px-4 py-3">
                    <p className="font-semibold text-white">
                      {getUserFullName(post.author) || 'Community Member'}
                    </p>
                    <p>{truncate(post.content, 88)}</p>
                  </li>
                ))}
                {posts.length === 0 ? (
                  <li className="rounded-[1.15rem] bg-white/10 px-4 py-3 text-cyan-50">
                    Fresh community posts will appear here once members begin sharing.
                  </li>
                ) : null}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}

function InfoTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'sky' | 'amber' | 'fuchsia';
}) {
  const toneClass =
    tone === 'sky'
      ? 'bg-sky-700/10 text-sky-700'
      : tone === 'amber'
        ? 'bg-amber-500/10 text-amber-700'
        : 'bg-fuchsia-500/10 text-fuchsia-700';

  return (
    <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${toneClass}`}>
        {label}
      </div>
      <p className="text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}
