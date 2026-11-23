import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, Button, Badge, Modal, Input, Textarea, Label, Select } from "@/components/shared-ui";
import { MessageCircle, Heart, User, Users, Clock, Plus, Globe } from "lucide-react";
import { useGetCommunityPosts, useCreateCommunityPost, useGetCommunityPost, useCreateComment } from "@workspace/api-client-react";
import { formatDate } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/contexts/auth-context";
import LoginPromptModal from "@/components/login-prompt-modal";

// Map UI label → DB category value
const CATEGORY_OPTIONS = [
  { label: "All",                value: ""               },
  { label: "Hospital Review",    value: "hospital_reviews" },
  { label: "Symptom Discussion", value: "symptoms"         },
  { label: "Tips & Advice",      value: "post_care"        },
  { label: "General",            value: "general"          },
];

// Map DB value → display label
const CATEGORY_LABEL: Record<string, string> = {
  hospital_reviews: "Hospital Review",
  symptoms:         "Symptom Discussion",
  post_care:        "Tips & Advice",
  general:          "General",
};

function PostDetailView({ id, onClose }: { id: number; onClose: () => void }) {
  const { data: post, isLoading } = useGetCommunityPost(id);
  const commentMutation = useCreateComment();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, login } = useAuthContext();
  const [comment, setComment] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    if (!isAuthenticated) { setLoginOpen(true); return; }
    commentMutation.mutate(
      { postId: id, data: { content: comment, authorName: user?.firstName || user?.email || "User" } },
      {
        onSuccess: () => {
          setComment("");
          queryClient.invalidateQueries({ queryKey: [`/api/community/posts/${id}`] });
        },
      }
    );
  };

  return (
    <>
      <Modal isOpen={true} onClose={onClose} title="Community Thread">
        {isLoading ? (
          <div className="p-8 text-center animate-pulse">Loading post...</div>
        ) : post ? (
          <div className="space-y-6">
            <div>
              <Badge className="mb-3">{CATEGORY_LABEL[post.category] || post.category}</Badge>
              <h1 className="text-2xl font-display font-bold text-foreground mb-3">{post.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b border-border">
                <span className="flex items-center gap-1"><User className="w-4 h-4" /> {post.authorName}</span>
                <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> {post.authorCountry || "International"}</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {formatDate(post.createdAt)}</span>
              </div>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
              {post.tags && post.tags.length > 0 && (
                <div className="flex gap-2 mt-6">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">#{tag}</Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-muted/30 -mx-6 px-6 py-6 border-t border-border mt-8">
              <h3 className="font-bold text-lg mb-4">{post.comments?.length || 0} Comments</h3>
              <div className="space-y-4 mb-6">
                {post.comments?.map((c) => (
                  <div key={c.id} className="bg-card p-4 rounded-xl border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">{c.authorName}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-foreground/90">{c.content}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleComment} className="flex gap-2">
                <Input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={isAuthenticated ? "Write a helpful response..." : "Sign in to reply…"}
                  className="flex-1 bg-white"
                  disabled={commentMutation.isPending}
                />
                <Button
                  type="submit"
                  disabled={!comment.trim() || commentMutation.isPending}
                  onClick={!isAuthenticated ? (e) => { e.preventDefault(); setLoginOpen(true); } : undefined}
                >
                  Reply
                </Button>
              </form>
            </div>
          </div>
        ) : null}
      </Modal>
      <LoginPromptModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} actionLabel="post a reply" />
    </>
  );
}

export default function Community() {
  const [category, setCategory] = useState("");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  const { user, isAuthenticated } = useAuthContext();
  const { data: pageData, isLoading } = useGetCommunityPosts({ category: category || undefined });
  const createMutation = useCreateCommunityPost();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postCat, setPostCat] = useState("hospital_reviews");

  const handleNewPost = () => {
    if (!isAuthenticated) { setLoginOpen(true); return; }
    setIsComposeOpen(true);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        data: {
          title,
          content,
          category: postCat,
          authorName: user?.firstName
            ? [user.firstName, user.lastName].filter(Boolean).join(" ")
            : user?.email || "Anonymous",
          authorCountry: undefined,
        },
      },
      {
        onSuccess: () => {
          setIsComposeOpen(false);
          setTitle("");
          setContent("");
          queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
        },
      }
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl mx-auto pb-12">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 bg-gradient-to-r from-primary to-accent p-8 rounded-3xl text-white shadow-xl shadow-primary/20">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Expat Health Community</h1>
          <p className="text-lg text-white/80 max-w-xl">
            Share experiences, recommend doctors, and help others navigate healthcare in Korea.
          </p>
        </div>
        <Button
          size="lg"
          onClick={handleNewPost}
          className="bg-white text-primary hover:bg-white/90 shadow-lg border-0 shrink-0"
        >
          <Plus className="w-5 h-5 mr-2" /> New Post
        </Button>
      </div>

      {/* Category filters */}
      <div className="flex overflow-x-auto pb-2 gap-2 snap-x hide-scrollbar">
        {CATEGORY_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={category === opt.value ? "default" : "outline"}
            onClick={() => setCategory(opt.value)}
            className={`rounded-full shrink-0 snap-start ${category === opt.value ? "" : "bg-card hover:bg-primary/5 border-border"}`}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Posts list */}
      <div className="space-y-4">
        {isLoading ? (
          [1, 2, 3].map((i) => <Card key={i} className="h-32 animate-pulse bg-muted/40" />)
        ) : pageData?.posts?.length ? (
          pageData.posts.map((post, idx) => (
            <motion.div key={post.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card
                className="p-5 hover:border-primary/40 cursor-pointer transition-all hover:shadow-xl group"
                onClick={() => setSelectedPostId(post.id)}
              >
                <div className="flex flex-col md:flex-row gap-4 md:items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                        {CATEGORY_LABEL[post.category] || post.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDate(post.createdAt)}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors mb-2">{post.title}</h3>
                    <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">{post.content}</p>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4 shrink-0 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs">
                        {post.authorName.charAt(0)}
                      </div>
                      <div className="text-sm font-medium">{post.authorName}</div>
                    </div>
                    <div className="flex gap-4 text-muted-foreground text-sm font-medium">
                      <span className="flex items-center gap-1.5 hover:text-rose-500"><Heart className="w-4 h-4" /> {post.likes}</span>
                      <span className="flex items-center gap-1.5 hover:text-primary"><MessageCircle className="w-4 h-4" /> {post.commentCount}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="py-16 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No posts in this category yet.</p>
            <Button variant="outline" className="mt-4" onClick={handleNewPost}>
              Be the first to post
            </Button>
          </div>
        )}
      </div>

      {/* Compose modal */}
      <Modal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} title="Create a Post">
        <form onSubmit={handleCreatePost} className="space-y-4">
          <div>
            <Label className="mb-2 block">Category</Label>
            <Select value={postCat} onChange={(e) => setPostCat(e.target.value)}>
              {CATEGORY_OPTIONS.filter((o) => o.value).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Keep it clear and descriptive..."
              required
            />
          </div>
          <div>
            <Label className="mb-2 block">Details</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your experience or ask a question..."
              className="min-h-[200px]"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={createMutation.isPending || !title || !content}
          >
            {createMutation.isPending ? "Posting..." : "Publish Post"}
          </Button>
        </form>
      </Modal>

      {selectedPostId && (
        <PostDetailView id={selectedPostId} onClose={() => setSelectedPostId(null)} />
      )}

      <LoginPromptModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        actionLabel="create a post"
      />
    </motion.div>
  );
}
