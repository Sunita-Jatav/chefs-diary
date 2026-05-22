// models/Post.js — Chef's Diary Culinary Network Feed Post
//
// This is NOT a recipe. It is a LinkedIn-style status post for the
// professional culinary network feed. Think of the difference as:
//
//   Recipe.js = "Here is my grandmother's biryani, and the story behind it."
//   Post.js   = "Looking for a pastry chef for a weekend pop-up in Bandra. DM me."
//
// The `postType` enum is what powers the LinkedIn-for-Chefs experience.
// The frontend renders a different card layout for each type:
//   - 'job_opportunity' shows a "Apply" button
//   - 'collab_request' shows "Express Interest"
//   - 'recipe_share' shows a linked recipe card
//   - 'question' shows a community discussion thread
//
// Posts can optionally attach a Recipe from Recipe.js, allowing chefs
// to share their recipes WITH professional commentary on the same post.

import mongoose from 'mongoose';

const { Schema } = mongoose;

const PostSchema = new Schema(
  {
    author:  { type: Schema.Types.ObjectId, ref: 'User', required: true },

    // ── Content ──────────────────────────────────────────────────────────
    content:   { type: String, required: true, maxlength: 2000, trim: true },
    mediaUrls: [{ type: String }], // Cloudinary URLs for attached images

    // ── Post Type — The Core of the Culinary Network ────────────────────
    // This field drives the frontend card template and the feed algorithm.
    postType: {
      type:    String,
      enum: [
        'general',        // Regular update — "Just got back from Lyon!"
        'recipe_share',   // Sharing a recipe with commentary
        'seeking_chef',   // "Looking for a sous chef / pastry specialist"
        'job_opportunity',// "We're hiring a Head Chef at [Restaurant]"
        'collab_request', // "Anyone up for a weekend pop-up in Pune?"
        'tip_technique',  // "Here's how I get perfect caramel every time"
        'question',       // "What's your go-to emulsifier for vegan mayo?"
        'milestone',      // "Just got my first Michelin star!"
      ],
      default: 'general',
    },

    // ── Optional Recipe Reference ─────────────────────────────────────────
    // When postType is 'recipe_share', this links to the full Recipe document.
    // The frontend fetches the recipe card data separately via populate().
    attachedRecipe: { type: Schema.Types.ObjectId, ref: 'Recipe', default: null },

    // ── Mentions & Discovery ─────────────────────────────────────────────
    mentionedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    tags:           [{ type: String, trim: true }],

    // ── Social Metrics ───────────────────────────────────────────────────
    likes:        [{ type: Schema.Types.ObjectId, ref: 'User' }],
    likeCount:    { type: Number, default: 0, min: 0 },
    commentCount: { type: Number, default: 0, min: 0 },

    // ── Status & Visibility ───────────────────────────────────────────────
    status: {
      type:    String,
      enum:    ['draft', 'published', 'deleted'],
      default: 'published',
    },
    visibility: {
      type:    String,
      enum:    ['public', 'connections_only'],
      default: 'public',
    },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────
PostSchema.index({ author: 1, createdAt: -1 });                     // "Posts by this user"
PostSchema.index({ postType: 1, status: 1, createdAt: -1 });        // "All job postings"
PostSchema.index({ status: 1, visibility: 1, createdAt: -1 });      // Main network feed
PostSchema.index({ mentionedUsers: 1, createdAt: -1 });             // "Posts mentioning me"
PostSchema.index({ tags: 1, status: 1 });                           // Tag-based discovery

export default mongoose.model('Post', PostSchema);