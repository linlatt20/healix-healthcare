import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const communityPostsTable = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  authorName: text("author_name").notNull(),
  authorCountry: text("author_country"),
  likes: integer("likes").notNull().default(0),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const commentsTable = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => communityPostsTable.id),
  content: text("content").notNull(),
  authorName: text("author_name").notNull(),
  authorCountry: text("author_country"),
  likes: integer("likes").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPostSchema = createInsertSchema(communityPostsTable).omit({ id: true, likes: true, createdAt: true });
export const insertCommentSchema = createInsertSchema(commentsTable).omit({ id: true, likes: true, createdAt: true });

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof communityPostsTable.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof commentsTable.$inferSelect;
