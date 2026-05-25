const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    unique: true
  },
  gender: {
    type: String,
    enum: ["male", "female", "other", "Male", "Female", "Other"], // Accept both cases
    required: true,
    lowercase: true // Automatically convert to lowercase
  },
  dateOfBirth: {
    type: mongoose.Schema.Types.Mixed, // Accept both String and Date
    required: true,
    set: function(value) {
      // Convert string dates to Date objects
      if (typeof value === 'string') {
        return new Date(value);
      }
      return value;
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    enum: ["admin", "superAdmin"],
    default: "admin",
    lowercase: true // Automatically convert to lowercase
  }
}, { timestamps: true });

module.exports = mongoose.models.Admin || mongoose.model("Admin", adminSchema);