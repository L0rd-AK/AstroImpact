const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profile: {
    firstName: String,
    lastName: String,
    country: String,
    city: String,
    avatar: String
  },
  preferences: {
    defaultLocation: {
      lat: { type: Number, default: 23.8103 }, // Dhaka latitude
      lng: { type: Number, default: 90.4125 }  // Dhaka longitude
    },
    units: {
      type: String,
      enum: ['metric', 'imperial'],
      default: 'metric'
    }
  },
  stats: {
    simulationsRun: { type: Number, default: 0 },
    mitigationsProposed: { type: Number, default: 0 },
    votesReceived: { type: Number, default: 0 },
    points: { type: Number, default: 0 }
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
