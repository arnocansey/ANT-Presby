import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import {
  BrandButton,
  BrandCard,
  BrandHero,
  BrandPill,
  BrandScreen,
  BrandSectionHeader,
} from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import {
  getApiErrorMessage,
  useCommunityFeed,
  useCreateCommunityComment,
  useCreateCommunityPost,
  useDeleteCommunityComment,
  useDeleteCommunityPost,
  useToggleCommunityLike,
} from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
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
  const theme = useTheme();
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
    <BrandScreen>
      <BrandHero
        eyebrow="Community"
        title="Stay close to the conversation"
        description="Read what members are sharing, celebrate updates, and add your own voice to the ANT PRESS community feed."
      >
        <View style={styles.heroActions}>
          <BrandPill>{posts.length} posts live</BrandPill>
          <BrandPill>
            {posts.reduce((sum, post) => sum + Number(post.comment_count || 0), 0)} comments
          </BrandPill>
        </View>
      </BrandHero>

      <BrandCard>
        <BrandSectionHeader
          title="Share something with the community"
          description={
            user
              ? 'Post a testimony, update, invitation, or word of encouragement.'
              : 'You can browse the feed now. Sign in when you are ready to post and comment.'
          }
        />

        {user ? (
          <>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="What would you like to share today?"
              placeholderTextColor={theme.textSecondary}
              multiline
              textAlignVertical="top"
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.backgroundSelected,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
            />
            <BrandButton label="Share Post" onPress={handleCreatePost} />
          </>
        ) : (
          <View style={styles.guestActions}>
            <BrandButton label="Sign In To Post" onPress={() => router.push('/login')} />
            <BrandButton label="Create Account" onPress={() => router.push('/register' as never)} variant="outline" />
          </View>
        )}

        {errorMessage ? (
          <ThemedText type="small" style={{ color: '#F87171' }}>
            {errorMessage}
          </ThemedText>
        ) : null}
      </BrandCard>

      {feedQuery.isLoading ? (
        <BrandCard>
          <ThemedText type="small">Loading community feed...</ThemedText>
        </BrandCard>
      ) : null}

      {!feedQuery.isLoading && posts.length === 0 ? (
        <BrandCard>
          <ThemedText type="defaultSemiBold">No posts yet</ThemedText>
          <ThemedText type="small">
            The community feed is ready. The first story shared by a member will appear here.
          </ThemedText>
        </BrandCard>
      ) : null}

      {posts.map((post) => {
        const canDeletePost = user?.role === 'admin' || Number(user?.id) === Number(post.author?.id);

        return (
          <BrandCard key={post.id}>
            <View style={styles.postHeader}>
              <View style={styles.authorRow}>
                <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
                  <ThemedText type="smallBold" style={{ color: theme.tint }}>
                    {getInitials(post.author)}
                  </ThemedText>
                </View>
                <View style={styles.authorCopy}>
                  <ThemedText type="defaultSemiBold">{getDisplayName(post.author)}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {post.created_at ? new Date(post.created_at).toLocaleString() : 'Recent post'}
                  </ThemedText>
                </View>
              </View>

              {canDeletePost ? (
                <Pressable onPress={() => deletePost.mutate(post.id)} style={styles.iconButton}>
                  <Ionicons name="trash-outline" size={18} color="#F87171" />
                </Pressable>
              ) : null}
            </View>

            <ThemedText type="default" style={styles.postContent}>
              {post.content}
            </ThemedText>

            <View style={styles.postActions}>
              <Pressable
                onPress={() => toggleLike.mutate(post.id)}
                disabled={!user || toggleLike.isPending}
                style={[
                  styles.actionChip,
                  {
                    backgroundColor: post.liked_by_me ? 'rgba(244,63,94,0.12)' : theme.backgroundSelected,
                    borderColor: post.liked_by_me ? 'rgba(244,63,94,0.28)' : theme.border,
                  },
                ]}>
                <Ionicons
                  name={post.liked_by_me ? 'heart' : 'heart-outline'}
                  size={16}
                  color={post.liked_by_me ? '#F43F5E' : theme.textSecondary}
                />
                <ThemedText
                  type="smallBold"
                  style={{ color: post.liked_by_me ? '#F43F5E' : theme.textSecondary }}>
                  {post.like_count || 0} likes
                </ThemedText>
              </Pressable>

              <View style={[styles.actionChip, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color={theme.textSecondary} />
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {post.comment_count || 0} comments
                </ThemedText>
              </View>
            </View>

            <View style={[styles.commentWrap, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
              {Array.isArray(post.comments) && post.comments.length > 0 ? (
                post.comments.map((comment: any) => {
                  const canDeleteThisComment =
                    user?.role === 'admin' || Number(user?.id) === Number(comment.author?.id);

                  return (
                    <View key={comment.id} style={[styles.commentCard, { borderColor: theme.border }]}>
                      <View style={styles.commentHeader}>
                        <View style={styles.commentCopy}>
                          <ThemedText type="smallBold">{getDisplayName(comment.author)}</ThemedText>
                          <ThemedText type="small" themeColor="textSecondary">
                            {comment.created_at ? new Date(comment.created_at).toLocaleString() : 'Recent comment'}
                          </ThemedText>
                        </View>
                        {canDeleteThisComment ? (
                          <Pressable
                            onPress={() =>
                              deleteComment.mutate({ postId: post.id, commentId: comment.id })
                            }
                            style={styles.iconButton}>
                            <Ionicons name="trash-outline" size={16} color="#F87171" />
                          </Pressable>
                        ) : null}
                      </View>
                      <ThemedText type="small">{comment.content}</ThemedText>
                    </View>
                  );
                })
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  No comments yet. Be the first to respond.
                </ThemedText>
              )}

              {user ? (
                <View style={styles.commentComposer}>
                  <TextInput
                    value={commentDrafts[post.id] || ''}
                    onChangeText={(value) =>
                      setCommentDrafts((state) => ({ ...state, [post.id]: value }))
                    }
                    placeholder="Add a thoughtful comment..."
                    placeholderTextColor={theme.textSecondary}
                    multiline
                    style={[
                      styles.commentInput,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                        color: theme.text,
                      },
                    ]}
                  />
                  <BrandButton label="Reply" onPress={() => handleAddComment(post.id)} variant="secondary" />
                </View>
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  Sign in to join the discussion.
                </ThemedText>
              )}
            </View>
          </BrandCard>
        );
      })}
    </BrandScreen>
  );
}

const styles = StyleSheet.create({
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    fontSize: 15,
    lineHeight: 22,
  },
  guestActions: {
    gap: Spacing.two,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  authorRow: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorCopy: {
    flex: 1,
    gap: 2,
  },
  iconButton: {
    padding: 6,
  },
  postContent: {
    lineHeight: 24,
  },
  postActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  actionChip: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentWrap: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  commentCard: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.two,
    gap: 6,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  commentCopy: {
    flex: 1,
    gap: 2,
  },
  commentComposer: {
    gap: Spacing.two,
  },
  commentInput: {
    minHeight: 84,
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
});
