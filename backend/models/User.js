const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'other']
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  age: {
    type: Number
  },
  profileImage: {
    type: String,
    default: null
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  otp: {
  type: String,
  default: null
},
otpExpiry: {
  type: Date,
  default: null
},
otpAttempts: {
  type: Number,
  default: 0
}
}, {
  timestamps: true
});


// Calculate age before saving
userSchema.pre('save', function(next) {
  if (this.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    this.age = age;
  }
  next();
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);