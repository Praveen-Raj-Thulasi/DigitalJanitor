import CleanupPlan from '../models/CleanupPlan.js';
import Scan from '../models/Scan.js';
import Activity from '../models/Activity.js';
import User from '../models/User.js';

// GET /api/cleanup-plans
export const getCleanupPlans = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [plans, total] = await Promise.all([
      CleanupPlan.find({ userId: req.user._id })
        .select('-actions')
        .populate('scanId', 'scanName fileCount clutterDebtScore')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      CleanupPlan.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      success: true,
      data: plans,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/cleanup-plans
export const createCleanupPlan = async (req, res, next) => {
  try {
    const { scanId, planName, actions } = req.body;

    // Ownership check on scan
    const scan = await Scan.findOne({ _id: scanId, userId: req.user._id });
    if (!scan) {
      return res.status(404).json({ success: false, message: 'Scan not found' });
    }

    // Validate each action type (allowlist)
    const allowedActionTypes = ['rename', 'move', 'archive', 'review'];
    const validatedActions = (actions || []).map((action) => {
      if (!allowedActionTypes.includes(action.actionType)) {
        throw Object.assign(new Error(`Invalid action type: ${action.actionType}`), { statusCode: 400 });
      }
      return {
        actionType: action.actionType,
        sourceRelativePath: action.sourceRelativePath,
        destinationRelativePath: action.destinationRelativePath,
        suggestedFilename: action.suggestedFilename,
        originalFilename: action.originalFilename,
        reason: action.reason,
        confidence: action.confidence,
        source: action.source || 'deterministic',
        approvalStatus: 'pending',
        executionStatus: 'not_executed',
      };
    });

    const plan = new CleanupPlan({
      userId: req.user._id,
      scanId,
      planName: planName || `Cleanup Plan ${new Date().toLocaleDateString()}`,
      actions: validatedActions,
      status: 'draft',
    });

    await plan.save();

    await Activity.create({
      userId: req.user._id,
      scanId,
      cleanupPlanId: plan._id,
      eventType: 'plan_created',
      details: { actionCount: validatedActions.length },
    });

    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

// GET /api/cleanup-plans/:id
export const getCleanupPlan = async (req, res, next) => {
  try {
    const plan = await CleanupPlan.findOne({ _id: req.params.id, userId: req.user._id }).populate(
      'scanId',
      'scanName fileCount clutterDebtScore'
    );
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Cleanup plan not found' });
    }
    res.json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/cleanup-plans/:id
export const updateCleanupPlan = async (req, res, next) => {
  try {
    const plan = await CleanupPlan.findOne({ _id: req.params.id, userId: req.user._id });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Cleanup plan not found' });
    }

    const { actionUpdates, status, planName } = req.body;

    if (planName) plan.planName = planName;

    // Handle action-level updates (approve/reject/edit)
    if (actionUpdates && Array.isArray(actionUpdates)) {
      for (const update of actionUpdates) {
        const action = plan.actions.id(update.actionId);
        if (!action) continue;

        const prevStatus = action.approvalStatus;

        if (update.approvalStatus) {
          const allowedStatuses = ['approved', 'rejected', 'edited', 'pending'];
          if (allowedStatuses.includes(update.approvalStatus)) {
            action.approvalStatus = update.approvalStatus;
          }
        }

        if (update.suggestedFilename !== undefined) {
          action.suggestedFilename = update.suggestedFilename;
          action.approvalStatus = 'edited';
        }

        if (update.destinationRelativePath !== undefined) {
          action.destinationRelativePath = update.destinationRelativePath;
          action.approvalStatus = 'edited';
        }

        // Log approval/rejection events
        if (prevStatus !== action.approvalStatus) {
          const eventType =
            action.approvalStatus === 'approved'
              ? 'action_approved'
              : action.approvalStatus === 'rejected'
                ? 'action_rejected'
                : 'action_edited';

          await Activity.create({
            userId: req.user._id,
            cleanupPlanId: plan._id,
            actionId: action._id.toString(),
            eventType,
            details: {
              actionType: action.actionType,
              sourceRelativePath: action.sourceRelativePath,
            },
          });
        }
      }
    }

    // Handle execution results reported by frontend
    if (req.body.executionResults && Array.isArray(req.body.executionResults)) {
      for (const result of req.body.executionResults) {
        const action = plan.actions.id(result.actionId);
        if (!action) continue;

        // Only update status for approved/edited actions
        if (action.approvalStatus !== 'approved' && action.approvalStatus !== 'edited') continue;
        if (action.executionStatus === 'success') continue; // don't re-execute

        action.executionStatus = result.success ? 'success' : 'failed';
        action.errorMessage = result.errorMessage || undefined;
        action.executedAt = new Date();

        const eventType = result.success ? 'action_executed' : 'action_failed';
        await Activity.create({
          userId: req.user._id,
          cleanupPlanId: plan._id,
          actionId: action._id.toString(),
          eventType,
          details: {
            actionType: action.actionType,
            sourceRelativePath: action.sourceRelativePath,
            errorMessage: result.errorMessage,
          },
        });

        if (result.success) {
          await User.findByIdAndUpdate(req.user._id, {
            $inc: { totalFilesOrganized: 1 },
          });
        }
      }
    }

    // Update plan status
    if (status) {
      const allowedPlanStatuses = ['draft', 'reviewing', 'confirmed', 'executing', 'complete', 'partial', 'cancelled'];
      if (allowedPlanStatuses.includes(status)) {
        plan.status = status;
        if (status === 'confirmed') plan.confirmedAt = new Date();
        if (status === 'complete' || status === 'partial') plan.completedAt = new Date();
      }
    }

    await plan.save();

    res.json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cleanup-plans/:id
export const deleteCleanupPlan = async (req, res, next) => {
  try {
    const plan = await CleanupPlan.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Cleanup plan not found' });
    }
    res.json({ success: true, message: 'Cleanup plan deleted' });
  } catch (error) {
    next(error);
  }
};
