const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide a valid email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't return password hash by default in queries
    },
    role: {
      type: String,
      enum: {
        values: ['tourist', 'owner', 'admin'],
        message: '{VALUE} is not a supported role',
      },
      default: 'tourist',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    // Dedicated sub-document for tourism partners / property owners
    partnerProfile: {
      agencyName: {
        type: String,
        trim: true,
        default: '',
      },
      location: {
        type: String,
        trim: true,
        default: 'Sikkim',
      },
      verificationStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Suspended', 'Inactive'],
        default: 'Pending',
      },
      notes: {
        type: String,
        default: '',
      },
      reviewerNotes: {
        type: String,
        default: '',
      },
      reviewedAt: {
        type: Date,
        default: null,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: Hash password before saving if modified or new
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare candidate password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Helpful instance method to check if user has a specific role
userSchema.methods.hasRole = function (role) {
  return this.role === role;
};

// Helpful instance method to check if user is an approved owner
userSchema.methods.isApprovedOwner = function () {
  return (
    this.role === 'owner' &&
    this.partnerProfile?.verificationStatus === 'Approved'
  );
};

// Sanitize user object for JSON serialization (never leak password)
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;

