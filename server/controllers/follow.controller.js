// controllers/follow.controller.js
import Follow from '../models/Follow.js';
import User   from '../models/User.js';

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/network/follow/:userId
// @access  Protected
// Toggle follow — if already following, unfollow. If not, follow.
// Also maintains denormalized follower/following counts on User.
// ─────────────────────────────────────────────────────────────────
export const toggleFollow = async (req, res) => {
  try {
    const followingId = req.params.userId; // The user being followed
    const followerId  = req.user._id;      // The logged-in user

    // Can't follow yourself
    if (followingId === followerId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You can't follow yourself.",
      });
    }

    // Check if the target user exists
    const targetUser = await User.findById(followingId).select('_id isPrivate displayName');
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      follower:  followerId,
      following: followingId,
    });

    if (existingFollow) {
      // ── UNFOLLOW ──
      await Follow.findByIdAndDelete(existingFollow._id);

      // Decrement counts atomically on both users
      await Promise.all([
        User.findByIdAndUpdate(followerId,  { $inc: { followingCount: -1 } }),
        User.findByIdAndUpdate(followingId, { $inc: { followerCount:  -1 } }),
      ]);

      return res.status(200).json({
        success:   true,
        following: false,
        message:   `Unfollowed ${targetUser.displayName}.`,
      });

    } else {
      // ── FOLLOW ──
      await Follow.create({
        follower:       followerId,
        following:      followingId,
        connectionType: 'follow',
        status:         targetUser.isPrivate ? 'pending' : 'active',
      });

      // Increment counts
      await Promise.all([
        User.findByIdAndUpdate(followerId,  { $inc: { followingCount: 1 } }),
        User.findByIdAndUpdate(followingId, { $inc: { followerCount:  1 } }),
      ]);

      return res.status(200).json({
        success:   true,
        following: true,
        message:   targetUser.isPrivate
          ? `Follow request sent to ${targetUser.displayName}.`
          : `Now following ${targetUser.displayName}!`,
      });
    }

  } catch (error) {
    // Duplicate key = race condition where two simultaneous follow requests fired
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Already following this user.' });
    }
    console.error('toggleFollow error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/network/follow-status/:userId
// @access  Protected
// Returns whether the logged-in user follows the target user.
// ─────────────────────────────────────────────────────────────────
export const getFollowStatus = async (req, res) => {
  try {
    const follow = await Follow.findOne({
      follower:  req.user._id,
      following: req.params.userId,
    });

    return res.status(200).json({
      success:   true,
      following: !!follow,
      status:    follow?.status || null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/network/followers/:userId
// @access  Public — paginated follower list
// ─────────────────────────────────────────────────────────────────
export const getFollowers = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      Follow.find({ following: req.params.userId, status: 'active' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('follower', 'username displayName avatarUrl culinaryTitle isVerifiedChef'),
      Follow.countDocuments({ following: req.params.userId, status: 'active' }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        followers: follows.map(f => f.follower),
        pagination: { currentPage: page, totalPages: Math.ceil(total / limit), total },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/network/following/:userId
// @access  Public — paginated following list
// ─────────────────────────────────────────────────────────────────
export const getFollowing = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      Follow.find({ follower: req.params.userId, status: 'active' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('following', 'username displayName avatarUrl culinaryTitle isVerifiedChef'),
      Follow.countDocuments({ follower: req.params.userId, status: 'active' }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        following: follows.map(f => f.following),
        pagination: { currentPage: page, totalPages: Math.ceil(total / limit), total },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/network/suggestions
// @access  Protected
// Returns up to 6 chef suggestions — users the logged-in user
// doesn't follow yet, sorted by follower count.
// ─────────────────────────────────────────────────────────────────
export const getSuggestions = async (req, res) => {
  try {
    // Get IDs of people the user already follows
    const alreadyFollowing = await Follow.find({
      follower: req.user._id,
      status:   'active',
    }).select('following');

    const excludeIds = [
      req.user._id,
      ...alreadyFollowing.map(f => f.following),
    ];

    const suggestions = await User.find({
      _id:           { $nin: excludeIds },
      accountActive: true,
    })
      .sort({ followerCount: -1 })
      .limit(6)
      .select('username displayName avatarUrl culinaryTitle isVerifiedChef followerCount cuisineSpecialties');

    return res.status(200).json({ success: true, data: { suggestions } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};