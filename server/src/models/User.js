import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    preferences: {
      theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
      defaultScanOptions: {
        identifyFileTypes: { type: Boolean, default: true },
        findDuplicates: { type: Boolean, default: true },
        detectAmbiguousFilenames: { type: Boolean, default: true },
        suggestOrganization: { type: Boolean, default: true },
        generateFilenames: { type: Boolean, default: false },
        analyzeDocumentText: { type: Boolean, default: false },
      },
      aiEnabled: { type: Boolean, default: true },
      autoCleanup: { type: Boolean, default: false },
      dataRetentionDays: { type: Number, default: 90 },
      notifications: { type: Boolean, default: true },
    },
    totalScans: { type: Number, default: 0 },
    totalFilesOrganized: { type: Number, default: 0 },
    cleanStreak: { type: Number, default: 0 },
    lastCleanupAt: { type: Date },
    achievements: [
      {
        id: String,
        unlockedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Never return passwordHash
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

// Index on email is already enforced by unique constraint

const User = mongoose.model('User', userSchema);
export default User;
