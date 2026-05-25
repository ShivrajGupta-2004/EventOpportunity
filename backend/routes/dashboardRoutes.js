const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Event = require('../models/Event');
const Application = require('../models/Application');
const Payment = require('../models/Payment');

// ==================== GET DASHBOARD STATS ====================
router.get('/dashboard-stats', async (req, res) => {
    try {
        if (!req.session.adminId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const adminId = req.session.adminId;

        // Total users
        const totalUsers = await User.countDocuments();

        // Total events (no admin filter since Event model doesn't have adminId)
        const totalEvents = await Event.countDocuments();

        // Total payments
        const paymentsResult = await Payment.aggregate([
            { $group: { _id: null, total: { $sum: '$paymentAmount' } } }
        ]);
        const totalPayments = paymentsResult.length > 0 ? paymentsResult[0].total : 0;

        // Total applications
        const totalApplications = await Application.countDocuments();

        // Pending applications
        const pendingApplications = await Application.countDocuments({ status: 'pending' });

        // Completed payments
        const completedPayments = await Payment.countDocuments({ paymentStatus: 'completed' });

        res.json({
            totalUsers,
            totalEvents,
            totalPayments,
            totalApplications,
            pendingApplications,
            completedPayments
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ==================== GET MONTHLY EVENTS ====================
router.get('/monthly-events', async (req, res) => {
    try {
        if (!req.session.adminId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const currentYear = new Date().getFullYear();

        const results = await Event.aggregate([
            { 
                $match: { 
                    date: {
                        $gte: new Date(`${currentYear}-01-01`),
                        $lte: new Date(`${currentYear}-12-31`)
                    }
                } 
            },
            {
                $group: {
                    _id: { $month: '$date' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedResults = results.map(r => ({
            month: monthNames[r._id - 1],
            count: r.count
        }));

        res.json(formattedResults);

    } catch (error) {
        console.error('Error fetching monthly events:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ==================== GET MONTHLY PAYMENTS ====================
router.get('/monthly-payments', async (req, res) => {
    try {
        if (!req.session.adminId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const currentYear = new Date().getFullYear();

        const results = await Payment.aggregate([
            { 
                $match: { 
                    paymentDate: {
                        $gte: new Date(`${currentYear}-01-01`),
                        $lte: new Date(`${currentYear}-12-31`)
                    }
                } 
            },
            {
                $group: {
                    _id: { $month: '$paymentDate' },
                    amount: { $sum: '$paymentAmount' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedResults = results.map(r => ({
            month: monthNames[r._id - 1],
            amount: r.amount
        }));

        res.json(formattedResults);

    } catch (error) {
        console.error('Error fetching monthly payments:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ==================== GET MONTHLY APPLICATIONS (NEW) ====================
router.get('/monthly-applications', async (req, res) => {
    try {
        if (!req.session.adminId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const currentYear = new Date().getFullYear();

        const results = await Application.aggregate([
            { 
                $match: { 
                    applicationDate: {
                        $gte: new Date(`${currentYear}-01-01`),
                        $lte: new Date(`${currentYear}-12-31`)
                    }
                } 
            },
            {
                $group: {
                    _id: { $month: '$applicationDate' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedResults = results.map(r => ({
            month: monthNames[r._id - 1],
            count: r.count
        }));

        res.json(formattedResults);

    } catch (error) {
        console.error('Error fetching monthly applications:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;