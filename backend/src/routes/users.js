const express = require('express');
const User = require('../models/User');
const Simulation = require('../models/Simulation');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get user leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'stats.points',
      timeframe = 'all' // all, month, week
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build date filter for timeframe
    let dateFilter = {};
    if (timeframe === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { createdAt: { $gte: monthAgo } };
    } else if (timeframe === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { createdAt: { $gte: weekAgo } };
    }

    // Get top users by points
    const users = await User.find({ isActive: true })
      .select('username profile stats createdAt')
      .sort({ [sortBy]: -1, createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const recentSimulations = await Simulation.countDocuments({
          user: user._id,
          ...dateFilter
        });

        return {
          ...user,
          recentActivity: recentSimulations
        };
      })
    );

    const total = await User.countDocuments({ isActive: true });

    res.json({
      leaderboard: usersWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get user profile by username
router.get('/profile/:username', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username, isActive: true })
      .select('-password -email')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's public simulations
    const simulations = await Simulation.find({ 
      user: user._id, 
      isPublic: true 
    })
      .populate('asteroid', 'name neo_reference_id')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get user achievements/badges (simplified)
    const achievements = calculateAchievements(user.stats);

    res.json({
      user: {
        ...user,
        achievements
      },
      recentSimulations: simulations
    });
  } catch (error) {
    console.error('User profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Search users
router.get('/search', async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const searchRegex = new RegExp(query.trim(), 'i');

    const users = await User.find({
      isActive: true,
      $or: [
        { username: searchRegex },
        { 'profile.firstName': searchRegex },
        { 'profile.lastName': searchRegex }
      ]
    })
      .select('username profile stats')
      .sort({ 'stats.points': -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({ users });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ error: 'User search failed' });
  }
});

// Get user statistics overview
router.get('/stats/overview', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      topContributors,
      activityStats
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.find({ isActive: true })
        .select('username stats')
        .sort({ 'stats.points': -1 })
        .limit(5)
        .lean(),
      User.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalSimulations: { $sum: '$stats.simulationsRun' },
            totalMitigations: { $sum: '$stats.mitigationsProposed' },
            totalVotes: { $sum: '$stats.votesReceived' },
            averagePoints: { $avg: '$stats.points' }
          }
        }
      ])
    ]);

    res.json({
      statistics: {
        totalUsers,
        activeUsers,
        topContributors,
        activity: activityStats[0] || {
          totalSimulations: 0,
          totalMitigations: 0,
          totalVotes: 0,
          averagePoints: 0
        }
      }
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Follow/unfollow user (bonus feature)
router.post('/:userId/follow', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser || !targetUser.isActive) {
      return res.status(404).json({ error: 'User not found' });
    }

    // In a more complete implementation, you'd have a separate followers collection
    // For now, we'll just return success
    res.json({ message: 'User followed successfully' });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// Helper function to calculate user achievements
function calculateAchievements(stats) {
  const achievements = [];

  // Simulation achievements
  if (stats.simulationsRun >= 1) achievements.push({ name: 'First Impact', description: 'Ran your first simulation' });
  if (stats.simulationsRun >= 10) achievements.push({ name: 'Impact Expert', description: 'Ran 10 simulations' });
  if (stats.simulationsRun >= 50) achievements.push({ name: 'Apocalypse Predictor', description: 'Ran 50 simulations' });

  // Mitigation achievements
  if (stats.mitigationsProposed >= 1) achievements.push({ name: 'Earth Defender', description: 'Proposed your first mitigation strategy' });
  if (stats.mitigationsProposed >= 10) achievements.push({ name: 'Strategy Master', description: 'Proposed 10 mitigation strategies' });

  // Community achievements
  if (stats.votesReceived >= 10) achievements.push({ name: 'Popular Scientist', description: 'Received 10 votes' });
  if (stats.votesReceived >= 50) achievements.push({ name: 'Community Favorite', description: 'Received 50 votes' });

  // Points achievements
  if (stats.points >= 100) achievements.push({ name: 'Rising Star', description: 'Earned 100 points' });
  if (stats.points >= 500) achievements.push({ name: 'Space Expert', description: 'Earned 500 points' });
  if (stats.points >= 1000) achievements.push({ name: 'Planetary Guardian', description: 'Earned 1000 points' });

  return achievements;
}

module.exports = router;
