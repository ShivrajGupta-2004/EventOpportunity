const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ["corporate", "real-estate", "social", "sport", "educational", "entertainment", "community"]
  },
  payment: {
    type: Number,
    required: true,
    min: 0
  },
  timing: {
    type: String,
    required: true,
    trim: true
  },
  dressCode: {
    type: String,
    required: true,
    trim: true
  },
  participants: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'events'
});

// ✅ Safe model export - prevents OverwriteModelError
module.exports = mongoose.models.Event || mongoose.model("Event", eventSchema);