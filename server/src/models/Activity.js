import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scan',
    },
    cleanupPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CleanupPlan',
    },
    actionId: { type: String }, // embedded action _id
    eventType: {
      type: String,
      enum: [
        'scan_started',
        'scan_completed',
        'scan_failed',
        'scan_cancelled',
        'plan_created',
        'action_approved',
        'action_rejected',
        'action_edited',
        'cleanup_confirmed',
        'action_executed',
        'action_failed',
        'action_rolled_back',
        'achievement_unlocked',
        'settings_updated',
        'ai_analysis_requested',
        'ai_analysis_complete',
        'ai_unavailable',
      ],
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

activitySchema.index({ userId: 1, timestamp: -1 });
activitySchema.index({ userId: 1, eventType: 1 });

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
