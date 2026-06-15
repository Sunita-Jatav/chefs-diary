// models/User.js — Chef's Diary User Schema
import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';

const { Schema } = mongoose;

// ─────────────────────────────────────────────────────────────────────────
// SUB-SCHEMAS
// ─────────────────────────────────────────────────────────────────────────

const EndorsementSchema = new Schema({
  user:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  endorsedAt: { type: Date, default: Date.now },
}, { _id: false });

const SkillSchema = new Schema({
  name: {
    type:     String,
    required: true,
    trim:     true,
  },
  category: {
    type:    String,
    enum:    ['technique', 'cuisine', 'dietary', 'equipment', 'management', 'other'],
    default: 'technique',
  },
  endorsedBy:   [EndorsementSchema],
  endorseCount: { type: Number, default: 0 },
}, { _id: true });

const PortfolioItemSchema = new Schema({
  role:           { type: String, required: true, trim: true },
  establishment:  { type: String, required: true, trim: true },
  location:       { type: String, trim: true },
  employmentType: {
    type:    String,
    enum:    ['full-time', 'part-time', 'freelance', 'stage', 'popup', 'self-employed', 'apprenticeship'],
    default: 'full-time',
  },
  startDate:    { type: Date, required: true },
  endDate:      { type: Date, default: null },
  isCurrentRole:{ type: Boolean, default: false },
  description:  { type: String, maxlength: 600, default: '' },
  highlights:   [{ type: String, maxlength: 200 }],
  mediaUrl:     { type: String, default: '' },
}, { _id: true, timestamps: true });

// ─────────────────────────────────────────────────────────────────────────
// MAIN USER SCHEMA
// ─────────────────────────────────────────────────────────────────────────

const UserSchema = new Schema(
  {
    // ── Authentication ───────────────────────────────────────────────────
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,       // unique: true auto-creates an index — no Schema.index() needed
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select:    false,      // Never returned in queries by default
    },

    // ── Public Identity ──────────────────────────────────────────────────
    username: {
      type:      String,
      required:  [true, 'Username is required'],
      unique:    true,       // unique: true auto-creates an index — no Schema.index() needed
      trim:      true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match:     [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    displayName: {
      type:      String,
      required:  [true, 'Display name is required'],
      trim:      true,
      maxlength: 60,
    },
    avatarUrl:     { type: String, default: '' },
    coverImageUrl: { type: String, default: '' },
    bio:           { type: String, maxlength: 300, default: '' },
    location:      { type: String, maxlength: 100, default: '' },

    // ── Chef Profile — The LinkedIn Layer ───────────────────────────────
    culinaryTitle: {
      type:      String,
      trim:      true,
      default:   '',
      maxlength: 100,
    },
    culinaryPhilosophy: {
      type:      String,
      maxlength: 600,
      default:   '',
    },
    yearsOfExperience:  { type: Number, default: 0, min: 0, max: 70 },
    cuisineSpecialties: [{ type: String, trim: true }],
    dietaryExpertise:   [{ type: String, trim: true }],
    skills:             [SkillSchema],
    portfolio:          [PortfolioItemSchema],

    // ── Social Graph Counters (Denormalized) ─────────────────────────────
    followerCount:  { type: Number, default: 0, min: 0 },
    followingCount: { type: Number, default: 0, min: 0 },
    recipeCount:    { type: Number, default: 0, min: 0 },
    postCount:      { type: Number, default: 0, min: 0 },

    // ── Saved Content ────────────────────────────────────────────────────
    savedRecipes: [{ type: Schema.Types.ObjectId, ref: 'Recipe' }],

    // ── AI Recommendation Vector ─────────────────────────────────────────
    preferenceVector: { type: [Number], default: [] },

    // ── Account Settings ─────────────────────────────────────────────────
    role: {
      type:    String,
      enum:    ['home_cook', 'professional_chef', 'food_blogger', 'culinary_student', 'admin'],
      default: 'home_cook',
    },
    isVerifiedChef: { type: Boolean, default: false },
    isPrivate:      { type: Boolean, default: false },
    accountActive:  { type: Boolean, default: true  },

    // ── External Social Links ────────────────────────────────────────────
    socialLinks: {
      instagram: { type: String, default: '', trim: true },
      youtube:   { type: String, default: '', trim: true },
      website:   { type: String, default: '', trim: true },
      tiktok:    { type: String, default: '', trim: true },
    },

    // ── Password Reset (never returned in normal queries) ────────────────
    passwordResetToken:   { type: String, select: false },
    passwordResetExpires: { type: Date,   select: false },
  },
  { timestamps: true }
);

// ─────────────────────────────────────────────────────────────────────────
// INDEXES
// Note: email and username are NOT listed here because unique: true
// in the field definition already creates those indexes automatically.
// Adding them again here would cause the duplicate index warnings you saw.
// ─────────────────────────────────────────────────────────────────────────

UserSchema.index(
  {
    displayName:        'text',
    culinaryTitle:      'text',
    cuisineSpecialties: 'text',
    dietaryExpertise:   'text',
    bio:                'text',
  },
  {
    weights: {
      displayName:        10,
      culinaryTitle:       8,
      cuisineSpecialties:  5,
      dietaryExpertise:    3,
      bio:                 1,
    },
    name: 'chef_text_search',
  }
);

UserSchema.index({ followerCount: -1 });
UserSchema.index({ role: 1, isVerifiedChef: 1, followerCount: -1 });
UserSchema.index({ createdAt: -1 });

// ─────────────────────────────────────────────────────────────────────────
// PRE-SAVE HOOK
// async function with NO `next` parameter — required for Mongoose 7+
// Mongoose resolves the promise automatically; passing next causes the
// "next is not a function" crash you saw earlier.
// ─────────────────────────────────────────────────────────────────────────

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// ─────────────────────────────────────────────────────────────────────────
// INSTANCE METHODS
// ─────────────────────────────────────────────────────────────────────────

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

// ─────────────────────────────────────────────────────────────────────────
// STATIC METHODS
// ─────────────────────────────────────────────────────────────────────────

UserSchema.statics.findByCredentials = async function (email, candidatePassword) {
  const user = await this.findOne({ email, accountActive: true }).select('+password');

  if (!user) throw new Error('Invalid email or password');

  const isMatch = await user.comparePassword(candidatePassword);
  if (!isMatch) throw new Error('Invalid email or password');

  return user;
};

export default mongoose.model('User', UserSchema);