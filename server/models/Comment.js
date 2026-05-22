// models/Comment.js — Polymorphic Comments
//
// "POLYMORPHIC" means one Comment document can belong to either a Recipe
// OR a Post — the same collection handles both parent types.
//
// HOW IT WORKS:
//   targetType: 'Recipe'  +  targetId: ObjectId  →  comment on a recipe
//   targetType: 'Post'    +  targetId: ObjectId  →  comment on a post
//
// Mongoose's `refPath` feature makes .populate('targetId') smart enough
// to look up the correct model based on the value of targetType.
//
// WHY NOT TWO SEPARATE COLLECTIONS (RecipeComment, PostComment)?
//   - Identical fields → duplicate schema code
//   - No shared "recent comments by this user" query across both types
//   - More models to maintain when adding new comment-able content types
//
// WHY NOT EMBED COMMENTS IN Recipe/Post?
//   - Comments can number in the thousands
//   - We need to PAGINATE them (load 10 at a time, then "Load more")
//   - Pagination on embedded arrays requires loading the entire parent document first
//   - With this model: db.comments.find({ targetId }).skip(20).limit(10) — instant
//
// NESTING DEPTH (one level max):
//   This is a product decision. Deep nesting (replies to replies to replies...)
//   creates confusing UI and complex tree-fetching queries. We support:
//     - Root comment (parentComment: null)
//     - One reply level (parentComment: <root comment _id>)
//   No deeper nesting. If a user replies to a reply, it's promoted to
//   the root comment thread in the UI.

import mongoose from 'mongoose';

const { Schema } = mongoose;

const CommentSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    // ── Polymorphic Target ──────────────────────────────────────────────
    targetType: {
      type:     String,
      required: true,
      enum:     ['Recipe', 'Post'],
      // IMPORTANT: These strings must exactly match the model names
      // registered in mongoose.model('Recipe', ...) and mongoose.model('Post', ...)
    },
    targetId: {
      type:    Schema.Types.ObjectId,
      required:true,
      // refPath tells Mongoose: "look at this document's targetType field
      // to know which collection to join when you .populate('targetId')"
      refPath: 'targetType',
    },

    // ── Content ──────────────────────────────────────────────────────────
    content: {
      type:     String,
      required: true,
      maxlength:[1000, 'Comment cannot exceed 1000 characters'],
      trim:     true,
    },

    // ── Threading ────────────────────────────────────────────────────────
    // null = this is a root-level comment
    // ObjectId = this is a reply to that comment
    parentComment: {
      type:    Schema.Types.ObjectId,
      ref:     'Comment',
      default: null,
    },
    isReply:    { type: Boolean, default: false },
    replyCount: { type: Number,  default: 0, min: 0 },

    // ── Social ───────────────────────────────────────────────────────────
    likes:     [{ type: Schema.Types.ObjectId, ref: 'User' }],
    likeCount: { type: Number, default: 0, min: 0 },

    // ── Moderation ───────────────────────────────────────────────────────
    // Soft-delete: we set isDeleted: true instead of removing the document.
    // This preserves the comment thread structure when a parent comment is deleted.
    // The frontend renders deleted comments as "[Comment removed]".
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date,    default: null  },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────

// PRIMARY: Fetch all root-level comments for a target, newest first
// Used for the main comment section on a recipe or post
CommentSchema.index(
  { targetType: 1, targetId: 1, parentComment: 1, createdAt: -1 },
  { name: 'target_comments' }
);

// REPLIES: Fetch all replies to a specific comment, oldest first
// oldest-first makes reply threads feel like a conversation
CommentSchema.index(
  { parentComment: 1, createdAt: 1 },
  { name: 'comment_replies' }
);

// USER HISTORY: "All comments by this chef" for profile page
CommentSchema.index({ author: 1, createdAt: -1 });

export default mongoose.model('Comment', CommentSchema);