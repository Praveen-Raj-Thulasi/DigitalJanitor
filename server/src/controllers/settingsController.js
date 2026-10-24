import User from '../models/User.js';
import Activity from '../models/Activity.js';

// GET /api/settings
export const getSettings = async (req, res, next) => {
  try {
    res.json({ success: true, data: req.user.preferences });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/settings
export const updateSettings = async (req, res, next) => {
  try {
    const allowed = [
      'theme',
      'defaultScanOptions',
      'aiEnabled',
      'autoCleanup',
      'dataRetentionDays',
      'notifications',
    ];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[`preferences.${key}`] = req.body[key];
      }
    }

    // Never allow auto cleanup to be set without explicit intent
    if (updates['preferences.autoCleanup'] === true) {
      // We allow it but log it
      await Activity.create({
        userId: req.user._id,
        eventType: 'settings_updated',
        details: { key: 'autoCleanup', value: true },
      });
    }

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true });

    res.json({ success: true, data: user.preferences });
  } catch (error) {
    next(error);
  }
};
