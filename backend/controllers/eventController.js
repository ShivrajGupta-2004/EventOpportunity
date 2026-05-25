// controllers/eventController.js
const mongoose = require("mongoose");
const Event = require("../models/Event");

/* =================================================================
   EVENT CONTROLLERS
   ================================================================= */

// ===== GET ALL EVENTS (WITH SEARCH & FILTERS) =====
const getAllEvents = async (req, res) => {
  try {
    const { search, type, location, maxPayment } = req.query;
    
    // Build query object
    let query = { date: { $gte: new Date() } };
    
    // Add search functionality
    if (search) {
      query.$or = [
        { id: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add type filter
    if (type) {
      query.type = type;
    }
    
    // Add location filter
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    // Add payment filter
    if (maxPayment) {
      query.payment = { $lte: parseInt(maxPayment) };
    }
    
    const events = await Event.find(query).sort({ date: 1 });
    console.log(`📅 Found ${events.length} events matching criteria`);
    
    res.json(events);
  } catch (err) { 
    console.error("❌ Error fetching events:", err);
    res.status(500).json({ error: err.message }); 
  }
};

// ===== GET SINGLE EVENT BY ID =====
const getEventById = async (req, res) => {
  try {
    const event = await Event.findOne({ id: req.params.id });
    
    if (!event) {
      console.log("❌ Event not found with ID:", req.params.id);
      return res.status(404).json({ error: "❌ Event not found" });
    }
    
    console.log("✅ Event found:", event.name);
    res.json(event);
  } catch (err) {
    console.error("❌ Error fetching event:", err);
    res.status(500).json({ error: err.message });
  }
};

// ===== CREATE NEW EVENT =====
const createEvent = async (req, res) => {
  try {
    console.log("📩 Received event data:", req.body);
    
    // Check if event ID already exists
    const existingEvent = await Event.findOne({ id: req.body.id });
    if (existingEvent) {
      console.log("❌ Event ID already exists:", req.body.id);
      return res.status(400).json({ error: "❌ Event ID already exists. Please use a unique ID." });
    }
    
    const event = new Event(req.body);
    const savedEvent = await event.save();
    
    console.log("✅ Event saved successfully:", savedEvent.name, "- ID:", savedEvent.id);
    res.status(201).json(savedEvent);
  } catch (err) { 
    console.error("❌ Error saving event:", err);
    
    if (err.code === 11000) {
      res.status(400).json({ error: "❌ Event ID already exists. Please use a unique ID." });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
};

// ===== UPDATE EVENT =====
const updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    console.log(`📝 Updating event with ID: ${eventId}`);
    
    const updatedEvent = await Event.findOneAndUpdate(
      { id: eventId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedEvent) {
      console.log("❌ Event not found for update:", eventId);
      return res.status(404).json({ error: "❌ Event not found" });
    }
    
    console.log("✅ Event updated successfully:", updatedEvent.name);
    res.json(updatedEvent);
  } catch (err) {
    console.error("❌ Error updating event:", err);
    res.status(400).json({ error: err.message });
  }
};

// ===== DELETE EVENT =====
const deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    console.log(`🗑️ Deleting event with ID: ${eventId}`);
    
    const result = await Event.deleteOne({ id: eventId });
    
    if (result.deletedCount === 0) {
      console.log("❌ Event not found for deletion:", eventId);
      return res.status(404).json({ error: "❌ Event not found" });
    }
    
    console.log("✅ Event deleted successfully");
    res.json({ ok: true, message: "✅ Event deleted successfully" });
  } catch (err) { 
    console.error("❌ Error deleting event:", err);
    res.status(500).json({ error: err.message }); 
  }
};

// ===== ARCHIVE PAST EVENTS =====
const archivePastEvents = async (req, res) => {
  try {
    const now = new Date();
    const past = await Event.find({ date: { $lt: now } });
    
    if (past.length > 0) {
      const pastColl = mongoose.connection.collection('pastevent');
      await pastColl.insertMany(past.map(e => e.toObject()));
      await Event.deleteMany({ date: { $lt: now } });
      
      console.log(`🔄 Moved ${past.length} old events to pastevent collection`);
      res.json({ 
        success: true, 
        message: `✅ Archived ${past.length} past events`,
        count: past.length 
      });
    } else {
      console.log("📅 No past events to archive");
      res.json({ 
        success: true, 
        message: "📅 No past events to archive",
        count: 0 
      });
    }
  } catch (err) {
    console.error('❌ Archive error:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  archivePastEvents
};