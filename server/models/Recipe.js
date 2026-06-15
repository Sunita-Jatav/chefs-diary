// models/Recipe.js — Chef's Diary Recipe Schema

import mongoose from 'mongoose';

const { Schema } = mongoose;

// ─────────────────────────────────────────────────────────────────────────
// SUB-SCHEMAS
// ─────────────────────────────────────────────────────────────────────────

const IngredientSchema = new Schema({
  name:                { type: String, required: true, trim: true },
  quantity:            { type: String, required: true },
  unit:                { type: String, default: '' },
  notes:               { type: String, default: '' },
  isOptional:          { type: Boolean, default: false },
  aiSubstitutionCache: { type: String, default: '' },
}, { _id: false });

const StepSchema = new Schema({
  order:       { type: Number, required: true },
  instruction: { type: String, required: true, maxlength: 1500 },
  duration:    { type: String, default: '' },
  technique:   { type: String, default: '' },
  tips:        { type: String, default: '' },
  mediaUrl:    { type: String, default: '' },
  isKeyStep:   { type: Boolean, default: false },
}, { _id: true });

const MediaItemSchema = new Schema({
  url:     { type: String, required: true },
  type:    { type: String, enum: ['image', 'video'], default: 'image' },
  caption: { type: String, default: '', maxlength: 200 },
  isCover: { type: Boolean, default: false },
}, { _id: false });

const EmotionalContextSchema = new Schema({
  story: { type: String, default: '', maxlength: 3000 },
  mood: {
    type:    String,
    enum:    ['nostalgic', 'celebratory', 'comforting', 'adventurous', 'healing', 'romantic', 'spiritual', 'playful', ''],
    default: '',
  },
  culturalOrigin:  { type: String, default: '', trim: true },
  regionOfOrigin:  { type: String, default: '', trim: true },
  countryOfOrigin: { type: String, default: '', trim: true },
  season: {
    type:    String,
    enum:    ['spring', 'summer', 'autumn', 'winter', 'year-round', ''],
    default: '',
  },
  occasion:      { type: String, default: '', maxlength: 100 },
  isAIGenerated: { type: Boolean, default: false },
}, { _id: false });

const DedicationSchema = new Schema({
  dedicatedTo:  { type: String, default: '', maxlength: 100 },
  relationship: { type: String, default: '', maxlength: 60  },
  message:      { type: String, default: '', maxlength: 400 },
}, { _id: false });

const FamilyLegacySchema = new Schema({
  isHeirloom:          { type: Boolean, default: false },
  estimatedGeneration: { type: Number,  default: null  },
  originStory:         { type: String,  default: '', maxlength: 500 },
  familyName:          { type: String,  default: '', maxlength: 100 },
}, { _id: false });

// ─────────────────────────────────────────────────────────────────────────
// MAIN RECIPE SCHEMA
// ─────────────────────────────────────────────────────────────────────────

const RecipeSchema = new Schema(
  {
    // ── Core Identity ────────────────────────────────────────────────────
    author:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title:       { type: String, required: true, trim: true, maxlength: 150 },
    slug:        { type: String, unique: true }, // Auto-generated in pre-save hook
    description: { type: String, maxlength: 600, default: '' },

    // ── Media ────────────────────────────────────────────────────────────
    coverImageUrl: { type: String, default: '' },
    mediaGallery:  [MediaItemSchema],

    // ── Technical Recipe Data ────────────────────────────────────────────
    ingredients: [IngredientSchema],
    steps:       [StepSchema],
    servings:    { type: Number, default: 4, min: 1 },
    prepTime:    { type: Number, default: null },
    cookTime:    { type: Number, default: null },
    restTime:    { type: Number, default: null },
    totalTime:   { type: Number, default: null }, // Auto-computed in pre-save

    difficulty: {
      type:    String,
      enum:    ['beginner', 'intermediate', 'advanced', 'professional'],
      default: 'beginner',
    },

    cuisineType: [{ type: String, trim: true }],
    dietaryTags: [{ type: String, trim: true }],
    tags:        [{ type: String, trim: true }],

    // ── The Emotional Layer ───────────────────────────────────────────────
    // default: () => ({}) creates a fresh empty object per document —
    // avoids the JS shared-reference gotcha with object defaults.
    emotionalContext: { type: EmotionalContextSchema, default: () => ({}) },
    dedication:       { type: DedicationSchema,       default: () => ({}) },
    familyLegacy:     { type: FamilyLegacySchema,     default: () => ({}) },

    // ── Interaction Data ──────────────────────────────────────────────────
    likes:       [{ type: Schema.Types.ObjectId, ref: 'User' }],
    likeCount:   { type: Number, default: 0 },
    saveCount:   { type: Number, default: 0 },
    viewCount:   { type: Number, default: 0 },
    commentCount:{ type: Number, default: 0 },
    
    ratings: [
      {
        user:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
        value: { type: Number, required: true, min: 1, max: 5 },
      }
    ],
    averageRating: { type: Number, default: 0 },
    ratingCount:   { type: Number, default: 0, min: 0 },

    // ── AI Metadata ───────────────────────────────────────────────────────
    aiGeneratedStory:    { type: Boolean, default: false },
    aiSubstitutionCache: { type: Map, of: String, default: () => new Map() },
    embedding:           { type: [Number], default: [] },

    // ── Status & Visibility ───────────────────────────────────────────────
    status: {
      type:    String,
      enum:    ['draft', 'published', 'archived'],
      default: 'draft',
    },
    visibility: {
      type:    String,
      enum:    ['public', 'connections_only', 'private'],
      default: 'public',
    },
  },
  { timestamps: true }
);

// ─────────────────────────────────────────────────────────────────────────
// PRE-SAVE HOOK
// Pure async — NO next parameter. Required for Mongoose 7+.
// Mongoose resolves the returned promise automatically.
// Passing `next` as a parameter causes "next is not a function" crash.
// ─────────────────────────────────────────────────────────────────────────

RecipeSchema.pre('save', async function () {
  // ── Auto-generate slug from title ────────────────────────────────────
  // Only runs when title changes or slug doesn't exist yet (new document).
  if (this.isModified('title') || !this.slug) {
    const baseSlug = this.title
      .toLowerCase()
      .normalize('NFD')                // Decompose accents: "café" → "cafe"
      .replace(/[\u0300-\u036f]/g, '') // Strip accent marks
      .replace(/[^a-z0-9\s-]/g, '')   // Remove special characters
      .replace(/\s+/g, '-')            // Spaces → hyphens
      .replace(/-+/g, '-')             // Collapse multiple hyphens
      .trim();

    // Check for slug collision — two chefs could both post "Chocolate Cake"
    const existing = await mongoose.model('Recipe').findOne({
      slug: baseSlug,
      _id:  { $ne: this._id }, // Exclude the current document for updates
    });

    // Append a short base-36 timestamp suffix only if a collision exists
    this.slug = existing
      ? `${baseSlug}-${Date.now().toString(36)}`
      : baseSlug;
  }

  // ── Auto-compute totalTime ──────────────────────────────────────────
  const prep = this.prepTime || 0;
  const cook = this.cookTime || 0;
  const rest = this.restTime || 0;
  if (prep || cook || rest) {
    this.totalTime = prep + cook + rest;
  }
});

// ─────────────────────────────────────────────────────────────────────────
// INDEXES
// slug is NOT listed here — unique: true on the field already creates
// that index. Adding it again causes the duplicate index warning.
// ─────────────────────────────────────────────────────────────────────────

RecipeSchema.index(
  {
    title:                            'text',
    tags:                             'text',
    cuisineType:                      'text',
    'emotionalContext.culturalOrigin':'text',
    description:                      'text',
  },
  {
    weights: {
      title:                            10,
      cuisineType:                       5,
      tags:                              4,
      'emotionalContext.culturalOrigin': 3,
      description:                       1,
    },
    name: 'recipe_text_search',
  }
);

RecipeSchema.index({ author: 1, status: 1 });
RecipeSchema.index({ likeCount: -1, createdAt: -1 });
RecipeSchema.index({ status: 1, visibility: 1, createdAt: -1 });
RecipeSchema.index({ cuisineType: 1, status: 1 });
RecipeSchema.index({ dietaryTags: 1, status: 1 });

export default mongoose.model('Recipe', RecipeSchema);