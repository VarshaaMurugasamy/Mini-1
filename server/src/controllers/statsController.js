const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { getModelMetrics } = require('../services/aiService');

// @route   GET /api/stats/dashboard
// @desc    Get complete real-time dashboard analytics, category breakdown & AI metrics
// @access  Private (Support Engineer, Admin)
exports.getDashboardStats = async (req, res) => {
  try {
    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: 'Open' });
    const inProgressTickets = await Ticket.countDocuments({ status: 'In Progress' });
    const resolvedTickets = await Ticket.countDocuments({ status: { $in: ['Resolved', 'Closed'] } });
    const urgentTickets = await Ticket.countDocuments({ priority: { $in: ['High', 'Urgent'] } });

    // Category distribution aggregation
    const categoryAgg = await Ticket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const categories = [
      'Network Issues',
      'Hardware Issues',
      'Software Issues',
      'Login and Authentication',
      'Database Issues',
      'Email and Communication',
      'Other / Unknown'
    ];

    const categoryBreakdown = {};
    categories.forEach(cat => { categoryBreakdown[cat] = 0; });
    categoryAgg.forEach(item => {
      if (item._id) categoryBreakdown[item._id] = item.count;
    });

    // Status breakdown
    const statusAgg = await Ticket.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const statusBreakdown = { Open: 0, 'In Progress': 0, Resolved: 0, Closed: 0 };
    statusAgg.forEach(item => {
      if (item._id) statusBreakdown[item._id] = item.count;
    });

    // Priority breakdown
    const priorityAgg = await Ticket.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    const priorityBreakdown = { Low: 0, Medium: 0, High: 0, Urgent: 0 };
    priorityAgg.forEach(item => {
      if (item._id) priorityBreakdown[item._id] = item.count;
    });

    // AI Confidence Analytics
    const aiTickets = await Ticket.find({ 'aiPrediction.confidence': { $exists: true } })
      .select('aiPrediction.confidence aiPrediction.confidenceLevel aiPrediction.isLowConfidence');

    let totalConfidence = 0;
    let highConfCount = 0;
    let lowConfCount = 0;

    aiTickets.forEach(t => {
      const conf = t.aiPrediction?.confidence || 0;
      totalConfidence += conf;
      if (conf >= 0.70) highConfCount++;
      if (t.aiPrediction?.isLowConfidence || conf < 0.40) lowConfCount++;
    });

    const avgConfidence = aiTickets.length > 0 ? (totalConfidence / aiTickets.length).toFixed(3) : 0;

    // Fetch official ML evaluation metrics from Python service
    const mlModelMetrics = await getModelMetrics();

    // Engineers count
    const totalEngineers = await User.countDocuments({ role: 'support_engineer' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // Recent 5 tickets
    const recentTickets = await Ticket.find()
      .populate('customer', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      stats: {
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        urgentTickets,
        totalEngineers,
        totalCustomers,
        avgConfidence: parseFloat(avgConfidence),
        highConfCount,
        lowConfCount,
        categoryBreakdown,
        statusBreakdown,
        priorityBreakdown,
        mlModelMetrics,
        recentTickets
      }
    });
  } catch (error) {
    console.error('Error compiling dashboard stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error generating dashboard statistics.'
    });
  }
};
