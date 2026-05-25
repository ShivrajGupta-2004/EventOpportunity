const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  applicationId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'APP' + Date.now() + Math.floor(Math.random() * 1000);
    }
  },
  eventId: {
    type: String,
    required: true,
    ref: 'Event'
  },
  eventName: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  userEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  userPhone: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  actionDate: {
    type: Date
  },
  adminNotes: {
    type: String,
    trim: true
  },
  hasAttended: {
    type: Boolean,
    default: false
  },
  attendanceDate: {
    type: Date
  },paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
},
paymentDate: {
    type: Date
},
paymentAmount: {
    type: Number
}
}, {
  timestamps: true,
  collection: 'applications'
});

applicationSchema.index({ eventId: 1, userEmail: 1 }, { unique: true });

module.exports = mongoose.models.Application || mongoose.model("Application", applicationSchema);