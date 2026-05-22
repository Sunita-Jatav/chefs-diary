// models/Follow.js — The Social Graph
//
// WHAT THIS MODEL DOES:
// Every follow relationship is ONE document in this collection.
// It represents a directed edge: follower ──follows──▶ following
//
// WHY NOT STORE THIS IN THE USER DOCUMENT?
// Imagine @GordonRamsay has 2 million followers.
// If we stored follower IDs in User.followers[], that's one array
// with 2 million ObjectIds = 24MB per document.
// MongoDB's hard limit is 16MB. The document literally cannot exist.
//
// With this model:
//   - "Who follows @chef?"  → db.follows.find({ following: chefId })
//     [uses the { following: 1 } index — instant regardless of fan count]
//   - "Does @alice follow @bob?" → db.follows.findOne({ follower: alice, following: bob })
//     [uses the unique compound index — O(log n)]
//
// THE TWO RELATIONSHIP TYPES:
//
// 1. 'follow' (default, one-way, Instagram-style):
//    Status: 'active' immediately on creation.
//    Used for recipe discovery — "I want to see this chef's recipes."
//
// 2. 'connection' (two-way, LinkedIn-style):
//    Status starts as 'pending' when @alice sends a connection request.
//    Status becomes 'connected' when @bob accepts.
//    Two documents are created (alice→bob and bob→alice) upon acceptance.
//    Used for professional networking — "I want this person in my culinary network."

import mongoose from 'mongoose';

const { Schema } = mongoose;

const FollowSchema = new Schema(
  {
    follower: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    following: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    connectionType: {
      type:    String,
      enum:    ['follow', 'connection'],
      default: 'follow',
    },
    // Status flow for 'follow': active (immediately)
    // Status flow for 'connection': pending → connected | rejected
    status: {
      type:    String,
      enum:    ['active', 'pending', 'connected', 'rejected', 'blocked'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// ── CRITICAL: Unique compound index ───────────────────────────────────────
// This prevents @alice from following @bob twice.
// The unique constraint is enforced at the database level, not just application code.
// If a duplicate insert is attempted, MongoDB throws an error with code 11000,
// which the controller catches and returns as a friendly "Already following" response.
FollowSchema.index(
  { follower: 1, following: 1 },
  { unique: true, name: 'unique_follow_pair' }
);

// ── Additional indexes for graph traversal ────────────────────────────────
// "Get all people that @alice follows" — used for the Following list
FollowSchema.index({ follower: 1, status: 1, createdAt: -1 });

// "Get all people who follow @bob" — used for the Followers list
FollowSchema.index({ following: 1, status: 1, createdAt: -1 });

// "Get all pending connection requests sent to @bob"
FollowSchema.index({ following: 1, connectionType: 1, status: 1 });

export default mongoose.model('Follow', FollowSchema);