import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { communityPostsTable, commentsTable } from "@workspace/db/schema";
import { eq, desc, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/community/posts", async (req, res) => {
  const { category, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  try {
    let query = db.select().from(communityPostsTable).orderBy(desc(communityPostsTable.createdAt));

    let posts = await db.select().from(communityPostsTable).orderBy(desc(communityPostsTable.createdAt));

    if (category && category !== "all") {
      posts = posts.filter((p) => p.category === category);
    }

    const total = posts.length;
    const paginated = posts.slice(offset, offset + limitNum);

    const withCounts = await Promise.all(
      paginated.map(async (post) => {
        const [{ count: commentCount }] = await db
          .select({ count: count() })
          .from(commentsTable)
          .where(eq(commentsTable.postId, post.id));
        return { ...post, commentCount: Number(commentCount) };
      })
    );

    res.json({
      posts: withCounts,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    req.log.error({ err }, "Community posts error");
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

router.post("/community/posts", async (req, res) => {
  const { title, content, category, authorName, authorCountry, tags } = req.body;

  if (!title || !content || !category || !authorName) {
    res.status(400).json({ error: "title, content, category, authorName are required" });
    return;
  }

  try {
    const [post] = await db.insert(communityPostsTable).values({
      title,
      content,
      category,
      authorName,
      authorCountry,
      tags: tags || [],
    }).returning();

    res.status(201).json({ ...post, commentCount: 0 });
  } catch (err) {
    req.log.error({ err }, "Create post error");
    res.status(500).json({ error: "Failed to create post" });
  }
});

router.get("/community/posts/:postId", async (req, res) => {
  const postId = parseInt(req.params.postId);

  try {
    const [post] = await db.select().from(communityPostsTable).where(eq(communityPostsTable.id, postId));
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    const comments = await db.select().from(commentsTable).where(eq(commentsTable.postId, postId)).orderBy(desc(commentsTable.createdAt));

    res.json({ ...post, comments });
  } catch (err) {
    req.log.error({ err }, "Get post error");
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

router.post("/community/posts/:postId/comments", async (req, res) => {
  const postId = parseInt(req.params.postId);
  const { content, authorName, authorCountry } = req.body;

  if (!content || !authorName) {
    res.status(400).json({ error: "content and authorName are required" });
    return;
  }

  try {
    const [comment] = await db.insert(commentsTable).values({
      postId,
      content,
      authorName,
      authorCountry,
    }).returning();

    res.status(201).json(comment);
  } catch (err) {
    req.log.error({ err }, "Create comment error");
    res.status(500).json({ error: "Failed to create comment" });
  }
});

export default router;
