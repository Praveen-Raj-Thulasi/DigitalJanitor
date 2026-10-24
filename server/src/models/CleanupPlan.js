import mongoose from 'mongoose';

const cleanupActionSchema = new mongoose.Schema({
  actionType: {
    type: String,
    enum: ['rename', 'move', 'archive', 'review', 'delete'],
    required: true,
  },
  sourceRelativePath: { type: String, required: true },
  destinationRelativePath: { type: String },
  suggestedFilename: { type: String },
  originalFilename: { type: String },
  reason: { type: String, required: true },
  confidence: { type: Number, min: 0, max: 1 },
  source: {
    type: String,
    enum: ['ai', 'deterministic', 'user'],
    default: 'deterministic',
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'edited'],
    default: 'pending',
  },
  executionStatus: {
    type: String,
    enum: ['not_executed', 'success', 'failed', 'rolled_back'],
    default: 'not_executed',
  },
  errorMessage: { type: String },
  executedAt: { type: Date },
  rolledBackAt: { type: Date },
});

const cleanupPlanSchema = new mongoose.Schema(
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
      required: true,
    },
    planName: { type: String, trim: true, maxlength: 200 },
    actions: [cleanupActionSchema],
    status: {
      type: String,
      enum: ['draft', 'reviewing', 'confirmed', 'executing', 'complete', 'partial', 'cancelled'],
      default: 'draft',
    },
    summary: {
      totalActions: { type: Number, default: 0 },
      approvedCount: { type: Number, default: 0 },
      rejectedCount: { type: Number, default: 0 },
      executedCount: { type: Number, default: 0 },
      failedCount: { type: Number, default: 0 },
    },
    confirmedAt: { type: Date },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

cleanupPlanSchema.index({ userId: 1, createdAt: -1 });
cleanupPlanSchema.index({ userId: 1, scanId: 1 });

// Auto-compute summary before save
cleanupPlanSchema.pre('save', function (next) {
  const actions = this.actions || [];
  this.summary = {
    totalActions: actions.length,
    approvedCount: actions.filter((a) => a.approvalStatus === 'approved' || a.approvalStatus === 'edited').length,
    rejectedCount: actions.filter((a) => a.approvalStatus === 'rejected').length,
    executedCount: actions.filter((a) => a.executionStatus === 'success').length,
    failedCount: actions.filter((a) => a.executionStatus === 'failed').length,
  };
  next();
});

const CleanupPlan = mongoose.model('CleanupPlan', cleanupPlanSchema);
export default CleanupPlan;
