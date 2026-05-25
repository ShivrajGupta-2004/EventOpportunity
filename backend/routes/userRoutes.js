
// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

/* =================================================================
   USER ROUTES
   ================================================================= */

// User Registration
router.post("/register", userController.registerUser);

// Check Username Availability
router.post("/check-username", userController.checkUsername);

module.exports = router;