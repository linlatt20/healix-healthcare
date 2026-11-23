import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCommunityPosts,
  useCreateCommunityPost,
  useGetCommunityPost,
  useCreateComment,
  getGetCommunityPostsQueryKey,
} from "@workspace/api-client-react";
import type { Post, PostDetail, Comment } from "@workspace/api-client-react";
import { Colors } from "@/constants/colors";

const CATEGORIES = ["All", "Hospital Review", "Symptom Discussion", "Tips & Advice", "General"];
const POST_CATEGORIES = ["Hospital Review", "Symptom Discussion", "Tips & Advice", "General"] as const;

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function PostDetailModal({
  postId,
  onClose,
}: {
  postId: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: post, isLoading } = useGetCommunityPost(postId);
  const commentMutation = useCreateComment();
  const [comment, setComment] = useState("");
  const [liked, setLiked] = useState(false);

  const handleComment = () => {
    if (!comment.trim()) return;
    commentMutation.mutate(
      { postId, data: { content: comment, authorName: "You" } },
      {
        onSuccess: () => {
          setComment("");
          queryClient.invalidateQueries({ queryKey: [`/api/community/posts/${postId}`] });
        },
      }
    );
  };

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLiked((v) => !v);
  };

  const typedPost: PostDetail | undefined = post;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: Colors.bg }}>
        <View style={styles.detailHeaderBar}>
          <Pressable onPress={onClose} style={styles.backBtn}>
            <Feather name="x" size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.detailHeaderTitle}>Post</Text>
          <View style={{ width: 40 }} />
        </View>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : typedPost ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 14 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.postDetailCard}>
              <View style={styles.catBadge}>
                <Text style={styles.catBadgeText}>{typedPost.category}</Text>
              </View>
              <Text style={styles.postDetailTitle}>{typedPost.title}</Text>
              <View style={styles.authorRow}>
                <View style={styles.authorAvatar}>
                  <Text style={styles.authorInitial}>{typedPost.authorName?.charAt(0) ?? "?"}</Text>
                </View>
                <Text style={styles.authorName}>{typedPost.authorName}</Text>
                {typedPost.authorCountry ? (
                  <Text style={styles.authorCountry}>· {typedPost.authorCountry}</Text>
                ) : null}
                <Text style={styles.postTime}>· {timeAgo(typedPost.createdAt)}</Text>
              </View>
              <Text style={styles.postDetailContent}>{typedPost.content}</Text>

              <Pressable
                style={styles.likeRow}
                onPress={handleLike}
              >
                <Ionicons
                  name={liked ? "heart" : "heart-outline"}
                  size={20}
                  color={liked ? "#E11D48" : Colors.textMuted}
                />
                <Text style={[styles.likeCount, liked && { color: "#E11D48" }]}>
                  {typedPost.likes + (liked ? 1 : 0)} likes
                </Text>
              </Pressable>
            </View>

            <Text style={styles.commentsTitle}>
              {typedPost.comments?.length ?? 0} Comments
            </Text>

            {typedPost.comments?.map((c: Comment) => (
              <View key={c.id} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>{c.authorName}</Text>
                  <Text style={styles.commentTime}>{timeAgo(c.createdAt)}</Text>
                </View>
                <Text style={styles.commentContent}>{c.content}</Text>
              </View>
            ))}

            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                value={comment}
                onChangeText={setComment}
                placeholder="Write a reply..."
                placeholderTextColor={Colors.textMuted}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.commentSendBtn,
                  !comment.trim() && styles.commentSendBtnDisabled,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={handleComment}
                disabled={!comment.trim() || commentMutation.isPending}
              >
                {commentMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="arrow-up" size={18} color="#fff" />
                )}
              </Pressable>
            </View>
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}

function PostCard({
  post,
  onPress,
  liked,
  onLike,
}: {
  post: Post;
  onPress: () => void;
  liked: boolean;
  onLike: (id: number) => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.postCard, pressed && { opacity: 0.9 }]}
      onPress={onPress}
    >
      <View style={styles.postCardHeader}>
        <View style={styles.catBadge}>
          <Text style={styles.catBadgeText}>{post.category}</Text>
        </View>
        <Text style={styles.postTime}>{timeAgo(post.createdAt)}</Text>
      </View>
      <Text style={styles.postTitle} numberOfLines={2}>{post.title}</Text>
      <Text style={styles.postExcerpt} numberOfLines={2}>{post.content}</Text>
      <View style={styles.postFooter}>
        <View style={styles.authorRow}>
          <View style={styles.authorAvatar}>
            <Text style={styles.authorInitial}>{post.authorName.charAt(0)}</Text>
          </View>
          <Text style={styles.authorName}>{post.authorName}</Text>
        </View>
        <View style={styles.postStats}>
          <Pressable
            style={styles.statItem}
            onPress={(e) => {
              e.stopPropagation();
              onLike(post.id);
            }}
            hitSlop={8}
          >
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={14}
              color={liked ? "#E11D48" : Colors.textMuted}
            />
            <Text style={[styles.statText, liked && { color: "#E11D48" }]}>
              {post.likes + (liked ? 1 : 0)}
            </Text>
          </Pressable>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.statText}>{post.commentCount}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;
  const bottomPadding = isWeb ? 34 : 100;

  const [category, setCategory] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  const { data: pageData, isLoading } = useGetCommunityPosts({ category: category || undefined });
  const createMutation = useCreateCommunityPost();
  const queryClient = useQueryClient();

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<typeof POST_CATEGORIES[number]>("Hospital Review");

  const handleLike = useCallback((postId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  }, []);

  const handleCreate = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    createMutation.mutate(
      {
        data: {
          title: newTitle,
          content: newContent,
          category: newCategory,
          authorName: "You",
          authorCountry: "International",
        },
      },
      {
        onSuccess: () => {
          setShowCompose(false);
          setNewTitle("");
          setNewContent("");
          queryClient.invalidateQueries({ queryKey: getGetCommunityPostsQueryKey() });
        },
      }
    );
  };

  const posts: Post[] = pageData?.posts ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={[styles.header, { paddingTop: topPadding + 10 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Expat Community</Text>
            <Text style={styles.headerSub}>Share healthcare experiences in Korea</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.composeBtn, pressed && { opacity: 0.8 }]}
            onPress={() => setShowCompose(true)}
          >
            <Feather name="edit-3" size={16} color="#059669" />
            <Text style={styles.composeBtnText}>Post</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.catPills}>
            {CATEGORIES.map((cat) => {
              const val = cat === "All" ? "" : cat;
              return (
                <Pressable
                  key={cat}
                  style={[styles.catPill, category === val && styles.catPillActive]}
                  onPress={() => setCategory(val)}
                >
                  <Text style={[styles.catPillText, category === val && styles.catPillTextActive]}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              liked={likedPosts.has(post.id)}
              onLike={handleLike}
              onPress={() => setSelectedPostId(post.id)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-group-outline" size={40} color={Colors.border} />
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyText}>Be the first to share your experience!</Text>
            <Pressable style={styles.emptyBtn} onPress={() => setShowCompose(true)}>
              <Text style={styles.emptyBtnText}>Create a Post</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {selectedPostId !== null && (
        <PostDetailModal
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
        />
      )}

      <Modal visible={showCompose} animationType="slide" transparent onRequestClose={() => setShowCompose(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Post</Text>
              <Pressable onPress={() => setShowCompose(false)}>
                <Feather name="x" size={22} color={Colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <View style={styles.catPills}>
                  {POST_CATEGORIES.map((c) => (
                    <Pressable
                      key={c}
                      style={[styles.catPill, newCategory === c && styles.catPillActiveGreen]}
                      onPress={() => setNewCategory(c)}
                    >
                      <Text style={[styles.catPillText, newCategory === c && styles.catPillTextActiveGreen]}>
                        {c}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.modalInput}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="Clear and descriptive title..."
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>Content</Text>
              <TextInput
                style={[styles.modalInput, { height: 130, textAlignVertical: "top" }]}
                value={newContent}
                onChangeText={setNewContent}
                placeholder="Share your experience or question..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={5}
              />

              <Pressable
                style={({ pressed }) => [
                  styles.publishBtn,
                  (!newTitle.trim() || !newContent.trim() || createMutation.isPending) && styles.publishBtnDisabled,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={handleCreate}
                disabled={!newTitle.trim() || !newContent.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.publishBtnText}>Publish Post</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: Colors.text,
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  headerSub: {
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  composeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  composeBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#059669",
  },
  catPills: {
    flexDirection: "row",
    gap: 6,
  },
  catPill: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  catPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catPillActiveGreen: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  catPillText: {
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  catPillTextActive: {
    color: "#fff",
  },
  catPillTextActiveGreen: {
    color: "#fff",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  postCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
    gap: 8,
  },
  postCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  catBadge: {
    backgroundColor: Colors.successLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  catBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.success,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  postTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
  },
  postTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
    lineHeight: 21,
  },
  postExcerpt: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  postFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 4,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  authorInitial: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: Colors.primary,
  },
  authorName: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  authorCountry: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  postStats: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.textMuted,
  },
  likeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 4,
  },
  likeCount: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textMuted,
  },
  loadingWrap: {
    paddingTop: 60,
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text,
    marginTop: 8,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  emptyBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#fff",
  },
  detailHeaderBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingTop: Platform.OS === "ios" ? 56 : 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  detailHeaderTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text,
  },
  postDetailCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  postDetailTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
    lineHeight: 28,
  },
  postDetailContent: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  commentsTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.text,
  },
  commentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 6,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  commentAuthor: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.text,
  },
  commentTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
  },
  commentContent: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text,
    minHeight: 44,
  },
  commentSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  commentSendBtnDisabled: {
    backgroundColor: Colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 14,
    maxHeight: "85%",
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text,
  },
  inputLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text,
    marginBottom: 14,
  },
  publishBtn: {
    backgroundColor: "#059669",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  publishBtnDisabled: {
    opacity: 0.5,
  },
  publishBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#fff",
  },
});
