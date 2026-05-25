const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');

/* ---------- PAYMENT ROUTES ---------- */

// Get attended users by event ID (for dropdown)
router.get('/events/:eventId/attended-users', PaymentController.getAttendedUsersByEvent);

// Get user details for payment (auto-fill form)
router.get('/user-details/:eventId/:userName', PaymentController.getUserDetailsForPayment);

// Generate unique transaction ID
router.get('/generate-transaction-id', PaymentController.generateUniqueTransactionId);

// Get user statistics (for user payment page) - SPECIFIC route pehle
router.get('/stats', PaymentController.getUserStats);

// Get logged-in user's payments (SPECIFIC route pehle)
router.get('/user', PaymentController.getUserPayments);

// Get payment history with search and pagination
router.get('/history', PaymentController.getPaymentHistory);

// Get all payments
router.get('/', PaymentController.getPaymentHistory);

// Create new payment record
router.post('/', PaymentController.createPayment);

// Get payment by ID (GENERIC route last)
router.get('/:paymentId', PaymentController.getPaymentById);

// Update payment status
router.put('/:paymentId/status', PaymentController.updatePaymentStatus);

// Delete payment
router.delete('/:paymentId', PaymentController.deletePayment);

module.exports = router;