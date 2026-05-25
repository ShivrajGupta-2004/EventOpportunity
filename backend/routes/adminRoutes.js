const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authController = require("../controllers/authController");

/* ADMIN ROUTES */

// Admin Registration
router.post("/admin-register", adminController.registerAdmin);

// Admin Login
router.post("/admin-login", authController.adminLogin);

// Check Session
router.get("/check-session", authController.checkSession);

// Check Admin Username Availability
router.post("/check-admin-username", adminController.checkAdminUsername);

// Admin Profile Routes (ADD THESE)
router.get("/admin/profile", adminController.getAdminProfile);
router.put("/admin/profile", adminController.updateAdminProfile);

module.exports = router;