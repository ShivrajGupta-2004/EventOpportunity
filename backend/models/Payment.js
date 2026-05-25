const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'TXN' + Date.now() + Math.floor(Math.random() * 10000);
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
  paymentAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMode: {
    type: String,
    required: true,
    enum: ['credit-card', 'debit-card', 'net-banking', 'upi', 'wallet', 'bank-transfer']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  adminNotes: {
    type: String,
    trim: true
  },
  applicationId: {
    type: String,
    ref: 'Application'
  }
}, {
  timestamps: true,
  collection: 'payments'
});

// Index for faster queries
paymentSchema.index({ eventId: 1 });
paymentSchema.index({ userEmail: 1 });
paymentSchema.index({ transactionId: 1 });

module.exports = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);