// routes/eventRoutes.js
const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");

/* =================================================================
   EVENT ROUTES
   ================================================================= */

// Get all events (with search & filters)
router.get("/events", eventController.getAllEvents);

// Get single event by ID
router.get("/events/:id", eventController.getEventById);

// Create new event
router.post("/events", eventController.createEvent);

// Update event
router.put("/events/:id", eventController.updateEvent);

// Delete event
router.delete("/events/:id", eventController.deleteEvent);

// Archive past events
router.post("/archive-past-events", eventController.archivePastEvents);

module.exports = router;