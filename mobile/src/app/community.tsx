import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Avatar,
  Chip,
  FormMessage,
  IconButton,
  InfoLine,
  LoadingList,
  Screen,
  ScreenHeader,
} from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { TextField } from '@/components/ui/text-field';
import { Corner, Space } from '@/constants/tokens';
import {
  getApiErrorMessage,
  useCommunityFeed,
  useCreateCommunityComment,
  useCreateCommunityPost,
  useDeleteCommunityComment,
  useDeleteCommunityPost,
  useToggleCommunityLike,
} from '@/hooks/use-api';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuthStore } from '@/store/auth';

function getDisplayName(person: any) {
  const fullName = [person?.first_name || person?.firstName, person?.last_name || person?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || person?.email || 'Community Member';
}

function getInitials(person: any) {
  return getDisplayName(person)
    .split(' ')
    .map((part: string) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function CommunityScreen() {
  const { colors } = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const feedQuery = useCommunityFeed();
  const createPost = useCreateCommunityPost();
  const createComment = useCreateCommunityComment();
  const toggleLike = useToggleCommunityLike();
  const deletePost = useDeleteCommunityPost();
  const deleteComment = useDeleteCommunityComment();

  const [draft, setDraft] = React.useState('');
  const [commentDrafts, setCommentDrafts] = React.useState<Record<number, string>>({});
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const posts = Array.isArray(feedQuery.data) ? feedQuery.data : [];

  const handleCreatePost = async () => {
    const content = draft.trim();
    if (!content) return;

    try {
      setErrorMessage(null);
      await createPost.mutateAsync({ content });
      setDraft('');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Could not create post.'));
    }
  };

  const handleAddComment = async (postId: number) => {
    const content = String(commentDrafts[postId] || '').trim();
    if (!content) return;

    try {
      setErrorMessage(null);
      await createComment.mutateAsync({ postId, content });
      setCommentDrafts((state) => ({ ...state, [postId]: '' }));
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Could not add comment.'));
    }
  };

  return (
    <Screen>
      <ScreenHeader back title="Community" subtitle="Stories, updates and encouragement from members" />

      <View style={styles.badges}>
        <AppBadge>{`${posts.length} posts`}</AppBadge>
        <AppBadge>{`${posts.reduce((sum, post) => sum + Number(post.comment_count || 0), 0)} comments`}</AppBadge>
      </View>

      <AppCard>
        <AppText variant="bodyStrong">Share something with the community</AppText>
        <AppText variant="small" tone="muted">
          {user
            ? 'Post a testimony, update, invitation, or word of encouragement.'
            : 'You can browse the feed now. Sign in when you are ready to post and comment.'}
        </AppText>

        {user ? (
          <>
            <TextField
              label="Your post"
              value={draft}
              onChangeText={setDraft}
              placeholder="What would you like to share today?"
              multiline
            />
            <AppButton label="Share post" onPress={handleCreatePost} />
          </>
        ) : (
          <View style={styles.stack}>
            <AppButton label="Sign in to post" onPress={() => router.push('/login')} />
            <AppButton label="Create account" variant="secondary" onPress={() => router.push('/register' as never)} />
          </View>
        )}

        {errorMessage ? <FormMessage tone="danger">{errorMessage}</FormMessage> : null}
      </AppCard>

      {feedQuery.isLoading ? <LoadingList count={2} height={180} /> : null}

      {!feedQuery.isLoading && posts.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="No posts yet"
          message="The community feed is ready. The first story shared by a member will appear here."
        />
      ) : null}

      {posts.map((post) => {
        const canDeletePost = user?.role === 'admin' || Number(user?.id) === Number(post.author?.id);
        const comments = Array.isArray(post.comments) ? post.comments : [];

        return (
          <AppCard key={post.id}>
            <View style={styles.postHeader}>
              <Avatar initials={getInitials(post.author)} size={44} />
              <View style={styles.flex}>
                <AppText variant="bodyStrong">{getDisplayName(post.author)}</AppText>
                <AppText variant="caption" tone="muted">
                  {post.created_at ? new Date(post.created_at).toLocaleString() : 'Recent post'}
                </AppText>
              </View>
              {canDeletePost ? (
                <IconButton icon="trash-outline" variant="danger" accessibilityLabel="Delete post" onPress={() => deletePost.mutate(post.id)} />
              ) : null}
            </View>

            <AppText>{post.content}</AppText>

            <View style={styles.postActions}>
              <Chip
                icon={post.liked_by_me ? 'heart' : 'heart-outline'}
                label={`${post.like_count || 0} likes`}
                selected={Boolean(post.liked_by_me)}
                disabled={!user || toggleLike.isPending}
                accessibilityLabel={`${post.liked_by_me ? 'Unlike' : 'Like'} this post, ${post.like_count || 0} likes`}
                onPress={() => toggleLike.mutate(post.id)}
              />
              <InfoLine icon="chatbubble-ellipses-outline">{`${post.comment_count || 0} comments`}</InfoLine>
            </View>

            <View style={[styles.comments, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {comments.length > 0 ? (
                comments.map((comment: any) => {
                  const canDeleteThisComment = user?.role === 'admin' || Number(user?.id) === Number(comment.author?.id);

                  return (
                    <View key={comment.id} style={[styles.comment, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={styles.commentHeader}>
                        <View style={styles.flex}>
                          <AppText variant="small" style={styles.bold}>
                            {getDisplayName(comment.author)}
                          </AppText>
                          <AppText variant="caption" tone="muted">
                            {comment.created_at ? new Date(comment.created_at).toLocaleString() : 'Recent comment'}
                          </AppText>
                        </View>
                        {canDeleteThisComment ? (
                          <IconButton
                            icon="trash-outline"
                            variant="danger"
                            accessibilityLabel="Delete comment"
                            onPress={() => deleteComment.mutate({ postId: post.id, commentId: comment.id })}
                          />
                        ) : null}
                      </View>
                      <AppText variant="small">{comment.content}</AppText>
                    </View>
                  );
                })
              ) : (
                <AppText variant="small" tone="muted">
                  No comments yet. Be the first to respond.
                </AppText>
              )}

              {user ? (
                <View style={styles.stack}>
                  <TextField
                    label="Add a comment"
                    value={commentDrafts[post.id] || ''}
                    onChangeText={(value) => setCommentDrafts((state) => ({ ...state, [post.id]: value }))}
                    placeholder="Add a thoughtful comment..."
                    multiline
                    style={styles.commentInput}
                  />
                  <AppButton label="Reply" variant="secondary" onPress={() => handleAddComment(post.id)} />
                </View>
              ) : (
                <AppText variant="small" tone="muted">
                  Sign in to join the discussion.
                </AppText>
              )}
            </View>
          </AppCard>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', gap: Space.sm },
  stack: { gap: Space.sm },
  flex: { flex: 1, gap: 2 },
  bold: { fontWeight: '600' },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: Space.sm + 4 },
  postActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Space.md },
  comments: { borderWidth: 1, borderRadius: Corner.control, padding: Space.sm + 4, gap: Space.sm },
  comment: { borderWidth: 1, borderRadius: Corner.control, padding: Space.sm, gap: Space.xs },
  commentHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.sm },
  commentInput: { minHeight: 84 },
});
