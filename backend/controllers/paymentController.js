const Payment = require('../models/Payment');
const Application = require('../models/Application');
const Event = require('../models/Event');
const { sendSelectionEmail, sendPaymentEmail } = require('../services/emailService');
class PaymentController {

  /* ---------- GET ATTENDED USERS BY EVENT ID ---------- */
  /* ---------- GET ATTENDED USERS BY EVENT ID ---------- */
  static async getAttendedUsersByEvent(req, res) {
    try {
      const { eventId } = req.params;

      // Find all attended applications for this event
      const attendedApplications = await Application.find({
        eventId: eventId,
        status: 'approved',
        hasAttended: true
      }).select('userName userEmail userPhone applicationId');

      if (attendedApplications.length === 0) {
        return res.json({
          success: true,
          message: 'No attended users found for this event',
          users: []
        });
      }

      // Get all existing payments for this event
      const existingPayments = await Payment.find({
        eventId: String(eventId).trim()
      }).select('userName');

      // Create a Set of usernames who have already paid
      const paidUsernames = new Set(
        existingPayments.map(payment => String(payment.userName).trim().toLowerCase())
      );

      console.log('Event ID:', eventId);
      console.log('Total attended users:', attendedApplications.length);
      console.log('Paid usernames:', Array.from(paidUsernames));

      // Filter out users who have already paid
      const usersWithoutPayment = attendedApplications.filter(application => {
        const normalizedUsername = String(application.userName).trim().toLowerCase();
        const hasPaid = paidUsernames.has(normalizedUsername);

        console.log(`User: ${application.userName}, Normalized: ${normalizedUsername}, Has paid: ${hasPaid}`);

        return !hasPaid;
      });

      console.log('Users without payment:', usersWithoutPayment.length);

      res.json({
        success: true,
        users: usersWithoutPayment,
        count: usersWithoutPayment.length
      });

    } catch (error) {
      console.error('Error fetching attended users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch attended users'
      });
    }
  }
  /* ---------- GET USER DETAILS FOR PAYMENT ---------- */
  static async getUserDetailsForPayment(req, res) {
    try {
      const { eventId, userName } = req.params;

      // Find the application for this user and event
      const application = await Application.findOne({
        eventId: eventId,
        userName: userName,
        status: 'approved',
        hasAttended: true
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'User not found or not attended for this event'
        });
      }

      // Get event details for payment amount
      const event = await Event.findOne({ id: eventId });
      if (!event) {
        return res.status(404).json({
          success: false,
          error: 'Event not found'
        });
      }

      // Check if payment already exists
      const existingPayment = await Payment.findOne({
        eventId: eventId,
        userName: userName
      });

      // Generate unique transaction ID
      const transactionId = 'TXN' + Date.now() + Math.floor(Math.random() * 10000);

      res.json({
        success: true,
        userDetails: {
          userName: application.userName,
          userEmail: application.userEmail,
          userPhone: application.userPhone,
          eventName: event.name,
          paymentAmount: event.payment,
          transactionId: transactionId,
          applicationId: application.applicationId,
          paymentExists: !!existingPayment,
          existingPayment: existingPayment || null
        }
      });

    } catch (error) {
      console.error('Error fetching user details for payment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user details'
      });
    }
  }

  /* ---------- GENERATE UNIQUE TRANSACTION ID ---------- */
  static async generateUniqueTransactionId(req, res) {
    try {
      let transactionId;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        transactionId = 'TXN' + Date.now() + Math.floor(Math.random() * 10000);

        const existingPayment = await Payment.findOne({ transactionId });
        if (!existingPayment) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate unique transaction ID'
        });
      }

      res.json({
        success: true,
        transactionId: transactionId
      });

    } catch (error) {
      console.error('Error generating transaction ID:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate transaction ID'
      });
    }
  }

  /* ---------- CREATE PAYMENT ---------- */
  /* ---------- CREATE PAYMENT ---------- */
static async createPayment(req, res) {
  try {
    const {
      eventId,
      userName,
      userEmail,
      userPhone,
      transactionId,
      paymentAmount,
      paymentMode,
      adminNotes
    } = req.body;

    // Validate required fields
    if (!eventId || !userName || !userEmail || !userPhone || !transactionId || !paymentAmount || !paymentMode) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be provided'
      });
    }

    // Check if transaction ID is unique
    const existingPayment = await Payment.findOne({ transactionId });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        error: 'Transaction ID already exists'
      });
    }

    // Get event details
    const event = await Event.findOne({ id: eventId });
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Find the application
    const application = await Application.findOne({
      eventId: eventId,
      userName: userName,
      status: 'approved',
      hasAttended: true
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found or user not attended'
      });
    }

    // Create payment record
    const payment = new Payment({
      transactionId,
      eventId,
      eventName: event.name,
      userName,
      userEmail,
      userPhone,
      paymentAmount: Number(paymentAmount),
      paymentMode,
      paymentStatus: 'completed',
      adminNotes: adminNotes || '',
      applicationId: application.applicationId
    });

    await payment.save();

    // Update application payment status
    await Application.findOneAndUpdate(
      { applicationId: application.applicationId },
      {
        paymentStatus: 'paid',
        paymentDate: new Date(),
        paymentAmount: Number(paymentAmount)
      }
    );

    // ⭐ SEND PAYMENT CONFIRMATION EMAIL ⭐
    try {
      console.log(`📧 Sending payment confirmation email to: ${userEmail}`);
      
      const emailResult = await sendPaymentEmail(
        userEmail,
        userName,
        event.name,
        event, // Full event object
        {
          transactionId: payment.transactionId,
          paymentAmount: payment.paymentAmount,
          paymentMode: payment.paymentMode,
          paymentDate: payment.paymentDate
        }
      );
      
      if (emailResult.success) {
        console.log('✅ Payment confirmation email sent successfully');
      } else {
        console.log('⚠️ Payment email failed but payment recorded:', emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Payment email error (non-critical):', emailError);
      // Email fail ho jaye toh bhi payment successful rahega
    }
    // ⭐ EMAIL CODE END ⭐

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      payment: payment
    });

  } catch (error) {
    console.error('Error creating payment:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate payment record'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create payment record'
    });
  }
}
  /* ---------- GET PAYMENT HISTORY ---------- */
  static async getPaymentHistory(req, res) {
    try {
      const { page = 1, limit = 10, search = '', eventId = '' } = req.query;

      // Build search query
      let searchQuery = {};

      if (search) {
        searchQuery.$or = [
          { transactionId: { $regex: search, $options: 'i' } },
          { userName: { $regex: search, $options: 'i' } },
          { userEmail: { $regex: search, $options: 'i' } },
          { eventName: { $regex: search, $options: 'i' } },
          { paymentMode: { $regex: search, $options: 'i' } }
        ];
      }

      if (eventId) {
        searchQuery.eventId = eventId;
      }

      // Get payments with pagination
      const payments = await Payment.find(searchQuery)
        .sort({ paymentDate: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const totalPayments = await Payment.countDocuments(searchQuery);

      res.json({
        success: true,
        payments: payments,
        totalPages: Math.ceil(totalPayments / limit),
        currentPage: parseInt(page),
        totalPayments: totalPayments
      });

    } catch (error) {
      console.error('Error fetching payment history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment history'
      });
    }
  }

  /* ---------- GET PAYMENT BY ID ---------- */
  static async getPaymentById(req, res) {
    try {
      const { paymentId } = req.params;

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }

      res.json({
        success: true,
        payment: payment
      });

    } catch (error) {
      console.error('Error fetching payment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment'
      });
    }
  }

  /* ---------- UPDATE PAYMENT STATUS ---------- */
  static async updatePaymentStatus(req, res) {
    try {
      const { paymentId } = req.params;
      const { paymentStatus, adminNotes } = req.body;

      if (!['pending', 'completed', 'failed'].includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid payment status'
        });
      }

      const payment = await Payment.findByIdAndUpdate(
        paymentId,
        {
          paymentStatus,
          adminNotes: adminNotes || payment.adminNotes
        },
        { new: true }
      );

      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }

      res.json({
        success: true,
        message: 'Payment status updated successfully',
        payment: payment
      });

    } catch (error) {
      console.error('Error updating payment status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update payment status'
      });
    }
  }

  /* ---------- DELETE PAYMENT ---------- */
  static async deletePayment(req, res) {
    try {
      const { paymentId } = req.params;

      const payment = await Payment.findByIdAndDelete(paymentId);
      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }

      // Update application payment status back to pending
      if (payment.applicationId) {
        await Application.findOneAndUpdate(
          { applicationId: payment.applicationId },
          {
            paymentStatus: 'pending',
            paymentDate: null,
            paymentAmount: null
          }
        );
      }

      res.json({
        success: true,
        message: 'Payment deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting payment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete payment'
      });
    }
  }
  // Add this function in paymentController.js

  static async getUserPayments(req, res) {
    try {
      console.log('Session data:', req.session);

      // Try multiple session keys
      const userEmail = req.session.userEmail || req.session.email;

      if (!userEmail) {
        console.log('No email in session. Full session:', req.session);
        return res.status(401).json({
          error: 'Unauthorized',
          debug: 'No user email in session'
        });
      }

      console.log('Fetching payments for:', userEmail);

      const payments = await Payment.find({ userEmail })
        .sort({ paymentDate: -1 })
        .lean();

      console.log('Found payments:', payments.length);

      res.json({ success: true, payments });
    } catch (error) {
      console.error('Error fetching user payments:', error);
      res.status(500).json({ error: 'Failed to fetch payments' });
    }
  }
  /* ---------- GET USER STATISTICS ---------- */
  /* ---------- GET USER STATISTICS ---------- */
  static async getUserStats(req, res) {
    try {
      const userEmail = req.session.userEmail || req.session.email;

      if (!userEmail) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get all attended applications with event payment
      const Application = require('../models/Application');
      const Event = require('../models/Event');

      const attendedApps = await Application.find({
        userEmail: userEmail,
        status: 'approved',
        hasAttended: true
      });

      let totalEarnings = 0;
      let paymentReceived = 0;
      let pendingPayments = 0;

      // Calculate earnings for each attended event
      for (const app of attendedApps) {
        const event = await Event.findOne({ id: app.eventId });
        if (event) {
          const eventPayment = event.payment || 0;
          totalEarnings += eventPayment;

          // Check if payment received for this event
          const payment = await Payment.findOne({
            userEmail: userEmail,
            eventId: app.eventId,
            paymentStatus: 'completed'
          });

          if (payment) {
            paymentReceived += eventPayment;
          } else {
            pendingPayments += eventPayment;
          }
        }
      }

      const stats = {
        paymentReceived,
        pendingPayments,
        totalEarnings,
        totalEvents: attendedApps.length
      };

      res.json({ success: true, stats });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }
  /* ---------- GET PAYMENT STATISTICS ---------- */
  static async getPaymentStats(req, res) {
    try {
      const totalPayments = await Payment.countDocuments();
      const completedPayments = await Payment.countDocuments({ paymentStatus: 'completed' });
      const pendingPayments = await Payment.countDocuments({ paymentStatus: 'pending' });
      const failedPayments = await Payment.countDocuments({ paymentStatus: 'failed' });

      // Calculate total revenue
      const revenueResult = await Payment.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, totalRevenue: { $sum: '$paymentAmount' } } }
      ]);

      const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

      res.json({
        success: true,
        stats: {
          totalPayments,
          completedPayments,
          pendingPayments,
          failedPayments,
          totalRevenue,
          completionRate: totalPayments > 0 ? ((completedPayments / totalPayments) * 100).toFixed(2) : 0
        }
      });

    } catch (error) {
      console.error('Error fetching payment stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment statistics'
      });
    }
  }
}

module.exports = PaymentController;