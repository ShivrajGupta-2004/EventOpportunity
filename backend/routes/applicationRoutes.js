// routes/applicationRoutes.js - Fixed Version
const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");

// Submit Application
router.post("/applications", applicationController.submitApplication);

// Get Application Statistics (Admin Dashboard) - Move this UP
router.get("/applications/stats", applicationController.getApplicationStats);

// Manual Cleanup Trigger (Admin only) - Move this UP  
router.post("/applications/cleanup", applicationController.triggerCleanup);

// Check if User Applied for Specific Event - Move this UP
router.get("/applications/check/:eventId", applicationController.checkUserApplication);

// Get Applications by Email - Move this UP
router.get("/applications/email/:email", applicationController.getApplicationsByEmail);

// Get Current User's Applications - Move this UP
router.get("/user/applications", applicationController.getUserApplications);

// Get All Applications (Admin only) - MUST be before parameterized route
router.get("/applications", applicationController.getAllApplications);

// Get Single Application by ID - MUST be AFTER /applications
router.get("/applications/:applicationId", applicationController.getApplicationById);

// Update Application Status (Admin only)
router.put("/applications/:applicationId/status", applicationController.updateApplicationStatus);

// Mark attendance for approved applications
router.put("/applications/:applicationId/attendance", applicationController.markAttendance);

// Delete Application (Admin only) - Keep at end
router.delete("/applications/:applicationId", applicationController.deleteApplication);


module.exports = router;