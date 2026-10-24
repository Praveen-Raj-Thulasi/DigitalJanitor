import Scan from '../models/Scan.js';
import CleanupPlan from '../models/CleanupPlan.js';
import Activity from '../models/Activity.js';
import User from '../models/User.js';

// GET /api/scans
export const getScans = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [scans, total] = await Promise.all([
      Scan.find({ userId: req.user._id })
        .select('-fileMetadata -duplicateGroups')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Scan.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      success: true,
      data: scans,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/scans/:id
export const getScan = async (req, res, next) => {
  try {
    const scan = await Scan.findOne({ _id: req.params.id, userId: req.user._id });
    if (!scan) {
      return res.status(404).json({ success: false, message: 'Scan not found' });
    }
    res.json({ success: true, data: scan });
  } catch (error) {
    next(error);
  }
};

// POST /api/scans
export const createScan = async (req, res, next) => {
  try {
    const {
      scanName,
      folderPath,
      fileCount,
      totalSizeBytes,
      categoryCounts,
      duplicateGroupCount,
      duplicateFileCount,
      potentialSpaceSavings,
      ambiguousFilenameCount,
      clutterDebtScore,
      scanOptions,
      fileMetadata,
      duplicateGroups,
      status,
    } = req.body;

    const scan = new Scan({
      userId: req.user._id,
      scanName: scanName || `Scan ${new Date().toLocaleDateString()}`,
      folderPath,
      fileCount: fileCount || 0,
      totalSizeBytes: totalSizeBytes || 0,
      categoryCounts,
      duplicateGroupCount: duplicateGroupCount || 0,
      duplicateFileCount: duplicateFileCount || 0,
      potentialSpaceSavings: potentialSpaceSavings || 0,
      ambiguousFilenameCount: ambiguousFilenameCount || 0,
      clutterDebtScore: clutterDebtScore || 0,
      scanOptions,
      fileMetadata: fileMetadata || [],
      duplicateGroups: duplicateGroups || [],
      status: status || 'complete',
      completedAt: status === 'complete' ? new Date() : undefined,
    });

    await scan.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalScans: 1 },
    });

    await Activity.create({
      userId: req.user._id,
      scanId: scan._id,
      eventType: 'scan_completed',
      details: {
        fileCount: scan.fileCount,
        clutterDebtScore: scan.clutterDebtScore,
        duplicateGroupCount: scan.duplicateGroupCount,
      },
    });

    res.status(201).json({ success: true, data: scan });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/scans/:id
export const deleteScan = async (req, res, next) => {
  try {
    const scan = await Scan.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!scan) {
      return res.status(404).json({ success: false, message: 'Scan not found' });
    }

    // Also delete associated cleanup plans
    await CleanupPlan.deleteMany({ scanId: req.params.id, userId: req.user._id });

    res.json({ success: true, message: 'Scan deleted' });
  } catch (error) {
    next(error);
  }
};

// GET /api/scans/stats - dashboard stats
export const getScanStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [scans, plans] = await Promise.all([
      Scan.find({ userId, status: 'complete' }).select(
        'clutterDebtScore fileCount potentialSpaceSavings categoryCounts duplicateGroupCount createdAt'
      ),
      CleanupPlan.find({ userId }).select('summary status createdAt'),
    ]);

    const latestScan = scans[0] || null;

    const totalFilesScanned = scans.reduce((sum, s) => sum + s.fileCount, 0);
    const totalDuplicateSpace = scans.reduce((sum, s) => sum + (s.potentialSpaceSavings || 0), 0);

    const totalApproved = plans.reduce((sum, p) => sum + (p.summary?.approvedCount || 0), 0);
    const totalExecuted = plans.reduce((sum, p) => sum + (p.summary?.executedCount || 0), 0);

    const avgClutter =
      scans.length > 0 ? Math.round(scans.reduce((sum, s) => sum + s.clutterDebtScore, 0) / scans.length) : 0;

    res.json({
      success: true,
      data: {
        latestClutterScore: latestScan?.clutterDebtScore || 0,
        totalFilesScanned,
        totalDuplicateSpace,
        totalApproved,
        totalExecuted,
        cleanupProgress: totalApproved > 0 ? Math.round((totalExecuted / totalApproved) * 100) : 0,
        avgClutterScore: avgClutter,
        totalScans: scans.length,
        latestScan,
      },
    });
  } catch (error) {
    next(error);
  }
};
