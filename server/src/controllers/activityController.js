import Activity from '../models/Activity.js';

// GET /api/activity
export const getActivity = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const skip = (page - 1) * limit;

    const filter = { userId: req.user._id };
    if (req.query.eventType) {
      filter.eventType = req.query.eventType;
    }
    if (req.query.scanId) {
      filter.scanId = req.query.scanId;
    }

    const [activities, total] = await Promise.all([
      Activity.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit),
      Activity.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: activities,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};
