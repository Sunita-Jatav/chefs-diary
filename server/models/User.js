// models/User.js — Chef's Diary User Schema
//
// This model serves two simultaneous purposes:
//   1. Standard authentication (email, password, username)
//   2. The "LinkedIn for Chefs" professional profile layer
//
// DESIGN PHILOSOPHY:
//   - Skills and portfolio are EMBEDDED because they are always loaded
//     together with the profile and are bounded in size.
//   - Follower/following counts are DENORMALIZED integers for
//     instant display on feed cards without expensive COUNT queries.
//   - The actual follower graph (who follows whom) lives in Follow.js.
//   - `password` is stored as a bcrypt hash; the raw plaintext is
//     NEVER saved. select: false ensures it never leaks in queries.

import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';

const { Schema } = mongoose;

// ─────────────────────────────────────────────────────────────────────────
// SUB-SCHEMAS
// ─────────────────────────────────────────────────────────────────────────

// A single endorsement record within a skill
// _id: false because we don't need to reference individual endorsements
const EndorsementSchema = new Schema({
  user:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  endorsedAt:  { type: Date, default: Date.now },
}, { _id: false });

// A single skill entry on the chef's public profile
// Similar to LinkedIn's Skills section — community-endorsed
const SkillSchema = new Schema({
  name: {
    type:     String,
    required: true,
    trim:     true,
    // Examples: "Knife Skills", "Tempering Chocolate", "Sourdough Fermentation"
  },
  category: {
    type:    String,
    enum:    ['technique', 'cuisine', 'dietary', 'equipment', 'management', 'other'],
    default: 'technique',
  },
  // endorsedBy stores the ObjectIds of users who endorsed this skill.
  // WHY embed here instead of a separate Endorsement collection?
  // A chef with 30 skills and 100 endorsers per skill = 3,000 ObjectIds.
  // 3,000 × 12 bytes = 36KB — comfortably within MongoDB's 16MB doc limit.
  // This lets us check "did @user endorse this skill?" with a fast $in query.
  endorsedBy:   [EndorsementSchema],
  endorseCount: { type: Number, default: 0 }, // Denormalized for fast display
}, { _id: true }); // _id: true so frontend can target individual skills for endorsement

// A professional experience entry — the chef's career timeline
// Equivalent to a LinkedIn "Position" entry
const PortfolioItemSchema = new Schema({
  role:           { type: String, required: true, trim: true },  // "Head Pastry Chef"
  establishment:  { type: String, required: true, trim: true },  // "The Ritz London"
  location:       { type: String, trim: true },                  // "London, UK"
  employmentType: {
    type:    String,
    enum:    ['full-time', 'part-time', 'freelance', 'stage', 'popup', 'self-employed', 'apprenticeship'],
    default: 'full-time',
  },
  startDate:    { type: Date, required: true },
  endDate:      { type: Date, default: null },    // null = current role
  isCurrentRole:{ type: Boolean, default: false },
  description:  { type: String, maxlength: 600, default: '' },
  // Key achievements or highlights from this role (bullet points on the profile)
  highlights:   [{ type: String, maxlength: 200 }],
  mediaUrl:     { type: String, default: '' },   // Photo from this workplace
}, { _id: true, timestamps: true });

// ─────────────────────────────────────────────────────────────────────────
// MAIN USER SCHEMA
// ─────────────────────────────────────────────────────────────────────────

const UserSchema = new Schema(
  {
    // ── Authentication ──────────────────────────────────────────────────
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true, // Always stored as lowercase — prevents duplicate signups
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    // Field is named 'password' but the stored value is ALWAYS a bcrypt hash.
    // The pre-save hook below transforms it before it ever touches the database.
    // select: false means password is NEVER returned by default in any query.
    // To get it, you must explicitly do User.findOne().select('+password')
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select:    false,
    },

    // ── Public Identity ─────────────────────────────────────────────────
    username: {
      type:      String,
      required:  [true, 'Username is required'],
      unique:    true,
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
    avatarUrl:    { type: String, default: '' },
    coverImageUrl:{ type: String, default: '' },
    bio:          { type: String, maxlength: 300, default: '' },
    location:     { type: String, maxlength: 100, default: '' }, // "Mumbai, India"

    // ── Chef Profile — The "LinkedIn" Layer ─────────────────────────────
    // This section transforms a basic user account into a culinary professional profile.
    culinaryTitle: {
      type:      String,
      trim:      true,
      default:   '',
      maxlength: 100,
      // Examples: "Executive Pastry Chef", "Home Cook & Food Blogger"
    },
    culinaryPhilosophy: {
      type:      String,
      maxlength: 600,
      default:   '',
      // The chef's personal statement — their "about me" as a culinary professional
    },
    yearsOfExperience: { type: Number, default: 0, min: 0, max: 70 },

    // Arrays of strings — bounded, always displayed on profile
    cuisineSpecialties: [{ type: String, trim: true }],  // ["Italian", "South Indian", "Molecular"]
    dietaryExpertise:   [{ type: String, trim: true }],  // ["Vegan", "Gluten-Free", "Kosher"]

    // Embedded sub-documents (see design rationale at top of file)
    skills:    [SkillSchema],
    portfolio: [PortfolioItemSchema],

    // ── Social Graph Counters (Denormalized) ────────────────────────────
    // These integers are maintained by the Follow.js model's post-save hooks.
    // WHY store them here if Follow.js has the ground truth?
    // Because displaying "1,204 followers" on 50 feed cards would require
    // 50 separate COUNT queries against the follows collection.
    // With denormalized counters, it's one field on an already-fetched document.
    followerCount:  { type: Number, default: 0, min: 0 },
    followingCount: { type: Number, default: 0, min: 0 },
    recipeCount:    { type: Number, default: 0, min: 0 },
    postCount:      { type: Number, default: 0, min: 0 },

    // ── Saved / Bookmarked Content ───────────────────────────────────────
    // Stored as an array of ObjectIds — only loaded when the user visits
    // their "Saved Recipes" page, not on every profile fetch.
    savedRecipes: [{ type: Schema.Types.ObjectId, ref: 'Recipe' }],

    // ── Account Settings & Role ──────────────────────────────────────────
    // The 'role' field drives access control and UI differences.
    // A 'professional_chef' gets a verified badge and the full portfolio UI.
    // A 'home_cook' gets the simplified onboarding and memory-first UI.
    role: {
      type:    String,
      enum:    ['home_cook', 'professional_chef', 'food_blogger', 'culinary_student', 'admin'],
      default: 'home_cook',
    },
    isVerifiedChef: { type: Boolean, default: false }, // Admin-granted verification
    isPrivate:      { type: Boolean, default: false }, // Private account — follow requests only
    accountActive:  { type: Boolean, default: true  }, // Soft-delete / suspension flag

    // ── External Social Links ────────────────────────────────────────────
    socialLinks: {
      instagram: { type: String, default: '', trim: true },
      youtube:   { type: String, default: '', trim: true },
      website:   { type: String, default: '', trim: true },
      tiktok:    { type: String, default: '', trim: true },
    },

    // ── Password Reset ───────────────────────────────────────────────────
    // These fields are ONLY populated during the password-reset flow.
    // select: false ensures they never leak into regular profile fetches.
    passwordResetToken:   { type: String, select: false },
    passwordResetExpires: { type: Date,   select: false },
  },
  {
    // timestamps: true automatically adds `createdAt` and `updatedAt`
    // fields that Mongoose manages for you.
    timestamps: true,
  }
);

// ─────────────────────────────────────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────────────────────────────────────

// email and username are declared unique: true in the schema,
// which automatically creates a unique index. We add these
// for explicit documentation and to ensure Mongoose creates them.
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });

// Compound text index for the "Search Chefs" feature.
// MongoDB text search supports "find chefs who know fermentation in Tokyo"
UserSchema.index(
  {
    displayName:        'text',
    culinaryTitle:      'text',
    cuisineSpecialties: 'text',
    dietaryExpertise:   'text',
    bio:                'text',
  },
  {
    // Weights determine relevance ranking in text search results.
    // A match on displayName is worth 3x more than a match in bio.
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

// For the "Discover Chefs" leaderboard and sorting
UserSchema.index({ followerCount: -1 });
UserSchema.index({ role: 1, isVerifiedChef: 1, followerCount: -1 });
UserSchema.index({ createdAt: -1 });

// ─────────────────────────────────────────────────────────────────────────
// MIDDLEWARE (Pre-save hooks)
// ─────────────────────────────────────────────────────────────────────────

// Password hashing — runs before every .save() call
// this.isModified('password') is CRITICAL.
// Without it, the password would be re-hashed on EVERY save,
// even for profile updates that don't touch the password.
// bcrypt.hash with saltRounds=12 is the industry standard in 2025.
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// INSTANCE METHODS
// ─────────────────────────────────────────────────────────────────────────

// comparePassword: used during login to verify a submitted password
// against the stored hash. bcrypt.compare is timing-safe (resistant
// to timing attacks that could reveal valid usernames).
UserSchema.methods.comparePassword = async function (candidatePassword) {
  // 'this.password' is the stored hash.
  // This method is only callable on a document fetched with .select('+password')
  return bcrypt.compare(candidatePassword, this.password);
};

// toJSON: strips sensitive fields before any JSON serialization.
// This is the safety net — even if a controller accidentally
// returns the full user object, the password never leaks.
UserSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  return userObject;
};

// ─────────────────────────────────────────────────────────────────────────
// STATIC METHODS
// ─────────────────────────────────────────────────────────────────────────

// findByCredentials: used by the login controller.
// Returns the user with their password hash for comparison.
UserSchema.statics.findByCredentials = async function (email, candidatePassword) {
  // +password explicitly overrides select: false for this query only
  const user = await this.findOne({ email, accountActive: true }).select('+password');

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isMatch = await user.comparePassword(candidatePassword);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  return user;
};

export default mongoose.model('User', UserSchema);