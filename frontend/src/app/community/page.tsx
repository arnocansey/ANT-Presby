'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Heart, MessageSquare, Send, Sparkles, Trash2, Users } from 'lucide-react';
import SkeletonGrid from '@/components/site/SkeletonGrid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/ui/page-header';
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
        className="h-12 w-12 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
      aria-hidden="true"
    >
      {getInitials(
        user?.first_name || user?.firstName || 'A',
        user?.last_name || user?.lastName || 'P'
      )}
    </div>
  );
};

const pathLinkClass =
  'flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40';

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
    <div className="container-max space-y-10 py-10 sm:py-12">
      <PageHeader
        eyebrow="Community"
        title="Community feed"
        description={`Share encouragement, testimonies and updates, and keep the heartbeat of ${APP_NAME} close.`}
        actions={
          <Button asChild variant="ghost">
            <Link href="#community-feed">
              Jump to the feed
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <section aria-label="Feed at a glance" className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Community reach" value={`${posts.length} active posts`} />
        <StatTile
          label="Conversation"
          value={`${posts.reduce((sum, post) => sum + Number(post.comment_count || 0), 0)} comments shared`}
        />
        <StatTile
          label="Encouragement"
          value={`${posts.reduce((sum, post) => sum + Number(post.like_count || 0), 0)} likes across the feed`}
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Join the conversation</h2>
                <p className="mt-1 text-sm text-muted">
                  Share updates, encouragement, or event moments with the wider community.
                </p>
              </div>

              {isAuthenticated ? (
                <>
                  <Label htmlFor="community-post" className="sr-only">
                    Your post
                  </Label>
                  <Textarea
                    id="community-post"
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    rows={5}
                    placeholder="Share an update, testimony, reflection or invitation..."
                  />
                  <div className="flex justify-end">
                    <Button type="button" onClick={handleShare} disabled={!content.trim()} loading={createPost.isPending}>
                      {!createPost.isPending && <Send className="h-4 w-4" aria-hidden="true" />}
                      Share Post
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4 rounded-card bg-surface p-5">
                  <p className="text-sm text-foreground/85">
                    Sign in to post, comment, and react to the community feed. You can still browse the conversation without an account.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild>
                      <Link href="/login">Sign In</Link>
                    </Button>
                    <Button asChild variant="secondary">
                      <Link href="/register">Create Account</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <section id="community-feed" aria-label="Community posts" className="scroll-mt-24 space-y-5">
            {isLoading ? (
              <SkeletonGrid count={2} className="md:grid-cols-1" />
            ) : error ? (
              <EmptyState icon={Users} title="The community feed couldn't load right now" message="Please try again in a moment." />
            ) : posts.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No posts yet"
                message="The first community post will show up here as soon as someone shares."
              />
            ) : (
              posts.map((post) => {
                const canDeletePost =
                  user?.role === 'admin' || Number(user?.id) === Number(post.author?.id);

                return (
                  <Card key={post.id}>
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <Avatar user={post.author} />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate font-semibold text-foreground">
                                {getUserFullName(post.author) || 'Community Member'}
                              </h3>
                              {post.is_pinned ? <Badge tone="gold">Pinned</Badge> : null}
                              {post.author?.role === 'admin' ? <Badge tone="neutral">Admin</Badge> : null}
                            </div>
                            <p className="text-sm text-muted">{formatDateTime(post.created_at)}</p>
                          </div>
                        </div>

                        {canDeletePost ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => deletePost.mutate(post.id)}
                            className="shrink-0 text-muted hover:text-danger"
                            aria-label="Delete post"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        ) : null}
                      </div>

                      <p className="mt-4 whitespace-pre-wrap break-words text-base leading-relaxed text-foreground">{post.content}</p>

                      <div className="mt-5 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleLike.mutate(post.id)}
                          disabled={!isAuthenticated || toggleLike.isPending}
                          aria-pressed={Boolean(post.liked_by_me)}
                          className={cn(
                            'inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            post.liked_by_me
                              ? 'border-danger/30 bg-danger/10 text-danger'
                              : 'border-input bg-background text-foreground hover:bg-surface',
                            !isAuthenticated && 'cursor-not-allowed opacity-70'
                          )}
                        >
                          <Heart className={cn('h-4 w-4', post.liked_by_me && 'fill-current')} aria-hidden="true" />
                          {post.like_count} likes
                        </button>
                        <span className="inline-flex h-11 items-center gap-2 px-2 text-sm text-muted">
                          <MessageSquare className="h-4 w-4" aria-hidden="true" />
                          {post.comment_count} comments
                        </span>
                      </div>

                      <div className="mt-4 space-y-3 rounded-card bg-surface p-4">
                        {(post.comments || []).length === 0 ? (
                          <p className="text-sm text-muted">No comments yet. Start the conversation.</p>
                        ) : (
                          (post.comments || []).map((comment: any) => {
                            const canDeleteComment =
                              user?.role === 'admin' || Number(user?.id) === Number(comment.author?.id);

                            return (
                              <div
                                key={comment.id}
                                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-foreground">
                                    {getUserFullName(comment.author) || 'Community Member'}
                                  </p>
                                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/85">
                                    {comment.content}
                                  </p>
                                  <p className="mt-2 text-xs text-muted">{formatDateTime(comment.created_at)}</p>
                                </div>
                                {canDeleteComment ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      deleteComment.mutate({ postId: post.id, commentId: comment.id })
                                    }
                                    className="shrink-0 text-muted hover:text-danger"
                                    aria-label="Delete comment"
                                  >
                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                                  </Button>
                                ) : null}
                              </div>
                            );
                          })
                        )}

                        {isAuthenticated ? (
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                            <Label htmlFor={`comment-${post.id}`} className="sr-only">
                              Add a comment
                            </Label>
                            <Textarea
                              id={`comment-${post.id}`}
                              rows={2}
                              className="min-h-[80px]"
                              value={commentDrafts[post.id] || ''}
                              onChange={(event) =>
                                setCommentDrafts((state) => ({ ...state, [post.id]: event.target.value }))
                              }
                              placeholder="Add a thoughtful comment..."
                            />
                            <Button
                              type="button"
                              className="shrink-0"
                              onClick={() => handleComment(post.id)}
                              disabled={!String(commentDrafts[post.id] || '').trim()}
                              loading={createComment.isPending}
                            >
                              Reply
                            </Button>
                          </div>
                        ) : (
                          <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted">
                            Sign in to join the discussion on this post.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <Card>
            <CardContent className="space-y-3 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">Community notes</p>
              <div className="space-y-3 text-sm leading-relaxed text-foreground/85">
                <p>Share encouragement, testimonies, event moments, or practical updates that help the wider community stay connected.</p>
                <p>Posts use your ANT PRESS account, so names and profile photos stay in sync with the rest of the site.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">Helpful paths</p>
              <div className="space-y-2">
                <Link href="/events" className={pathLinkClass}>
                  Browse upcoming events
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                </Link>
                <Link href="/prayer/new" className={pathLinkClass}>
                  Submit a prayer request
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                </Link>
                <Link href="/news" className={pathLinkClass}>
                  Read the latest announcements
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface">
            <CardContent className="space-y-3 p-6">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Community pulse
              </p>
              <p className="text-sm leading-relaxed text-foreground/85">
                A healthy feed feels like a living foyer: updates from real people, practical care, and shared joy.
              </p>
              <ul className="space-y-2 text-sm">
                {posts.slice(0, 3).map((post) => (
                  <li key={post.id} className="rounded-lg border border-border bg-card px-4 py-3">
                    <p className="font-semibold text-foreground">{getUserFullName(post.author) || 'Community Member'}</p>
                    <p className="break-words text-foreground/85">{truncate(post.content, 88)}</p>
                  </li>
                ))}
                {posts.length === 0 ? (
                  <li className="rounded-lg border border-border bg-card px-4 py-3 text-muted">
                    Fresh community posts will appear here once members begin sharing.
                  </li>
                ) : null}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">{label}</p>
      <p className="mt-2 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}
