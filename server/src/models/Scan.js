import mongoose from 'mongoose';

const scanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scanName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    folderPath: {
      // Relative or display path only — no actual filesystem access from backend
      type: String,
      trim: true,
      maxlength: 500,
    },
    fileCount: { type: Number, default: 0 },
    totalSizeBytes: { type: Number, default: 0 },
    categoryCounts: {
      images: { type: Number, default: 0 },
      videos: { type: Number, default: 0 },
      audio: { type: Number, default: 0 },
      documents: { type: Number, default: 0 },
      archives: { type: Number, default: 0 },
      code: { type: Number, default: 0 },
      data: { type: Number, default: 0 },
      temporary: { type: Number, default: 0 },
      unknown: { type: Number, default: 0 },
    },
    duplicateGroupCount: { type: Number, default: 0 },
    duplicateFileCount: { type: Number, default: 0 },
    potentialSpaceSavings: { type: Number, default: 0 },
    ambiguousFilenameCount: { type: Number, default: 0 },
    clutterDebtScore: { type: Number, default: 0, min: 0, max: 100 },
    scanOptions: {
      identifyFileTypes: { type: Boolean, default: true },
      findDuplicates: { type: Boolean, default: true },
      detectAmbiguousFilenames: { type: Boolean, default: true },
      suggestOrganization: { type: Boolean, default: true },
      generateFilenames: { type: Boolean, default: false },
      analyzeDocumentText: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ['pending', 'scanning', 'analyzing', 'complete', 'error', 'cancelled'],
      default: 'pending',
    },
    errorMessage: { type: String },
    completedAt: { type: Date },
    // Scan result metadata (not raw file contents)
    fileMetadata: [
      {
        name: String,
        relativePath: String,
        sizeBytes: Number,
        extension: String,
        category: String,
        mimeType: String,
        lastModified: Date,
        isAmbiguous: Boolean,
        isDuplicate: Boolean,
        duplicateGroupId: String,
        hash: String, // SHA-256 of content for duplicate detection
      },
    ],
    duplicateGroups: [
      {
        groupId: String,
        hash: String,
        sizeBytes: Number,
        count: Number,
        paths: [String],
      },
    ],
  },
  {
    timestamps: true,
  }
);

scanSchema.index({ userId: 1, createdAt: -1 });
scanSchema.index({ userId: 1, status: 1 });

const Scan = mongoose.model('Scan', scanSchema);
export default Scan;
