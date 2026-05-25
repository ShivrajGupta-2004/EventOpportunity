// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const SessionManager = require("../config/sessionManager"); // ADD THIS LINE

/* =================================================================
   AUTH ROUTES
   ================================================================= */
// User Login
router.post("/login", authController.userLogin);
// Admin Login  
router.post("/admin-login", authController.adminLogin);
// Check Session
router.get("/check-session", authController.checkSession);
// Logout
router.post("/logout", authController.logout);
// Add these lines to your existing authRoutes.js
router.post('/forgot-password', authController.sendOTPForPasswordReset);
router.post('/verify-otp', authController.verifyOTP);  
router.post('/reset-password', authController.resetPassword);
// ADD THESE NEW ROUTES:
// Admin Profile Routes
router.get("/admin/profile", SessionManager.requireAdminAuth, authController.getAdminProfile);
router.put("/admin/profile", SessionManager.requireAdminAuth, authController.updateAdminProfile);

module.exports = router;