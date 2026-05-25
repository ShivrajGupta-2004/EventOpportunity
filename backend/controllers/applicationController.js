// controllers/applicationController.js - Enhanced with Complete Application Management
const Application = require("../models/Application");
const Event = require("../models/Event");
const User = require("../models/User");
const { sendSelectionEmail } = require('../services/emailService');
/* =================================================================
   APPLICATION CONTROLLERS - ENHANCED WITH ADMIN MANAGEMENT
   ================================================================= */

// ===== SUBMIT APPLICATION =====
const submitApplication = async (req, res) => {
  try {
    console.log("📩 Received application data:", req.body);
    console.log("🔍 Session data:", {
      userId: req.session.userId,
      username: req.session.username,
      email: req.session.email
    });
    
    // Get user data from session
    const userId = req.session.userId;
    const userEmail = req.session.email;
    const userName = req.session.username;
    
    const { eventId, eventName } = req.body;
    
    // Input validation
    if (!eventId || !eventName) {
      return res.status(400).json({ 
        success: false, 
        error: "Event ID and Event Name are required" 
      });
    }
    
    // Get full user details from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }
    
    // Check if user already applied for this event
    const existingApplication = await Application.findOne({ 
      eventId: eventId, 
      userId: userId 
    });
    
    if (existingApplication) {
      console.log("❌ User already applied for event:", eventId, "- User:", userName);
      return res.status(400).json({ 
        success: false, 
        error: "You have already applied for this event" 
      });
    }
    
    // Check if event exists
    const event = await Event.findOne({ id: eventId });
    if (!event) {
      console.log("❌ Event not found:", eventId);
      return res.status(404).json({ 
        success: false, 
        error: "Event not found" 
      });
    }
    
    const newApplication = new Application({
      eventId,
      eventName: eventName.trim(),
      userId: userId,
      userName: user.fullName,
      userEmail: user.email,
      userPhone: user.mobile || '',
      status: 'pending'
    });
    
    const savedApplication = await newApplication.save();
    console.log("✅ Application saved successfully:", savedApplication.applicationId);
    
    res.status(201).json({
      success: true,
      message: "Application submitted successfully!",
      applicationId: savedApplication.applicationId,
      data: savedApplication
    });
    
  } catch (error) {
    console.error("❌ Application submission error:", error);
    
    if (error.code === 11000) {
      res.status(400).json({ 
        success: false, 
        error: "You have already applied for this event" 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: "Failed to submit application. Please try again." 
      });
    }
  }
};

// ===== GET ALL APPLICATIONS (FOR ADMIN) =====
const getAllApplications = async (req, res) => {
  try {
    console.log("🔍 Admin fetching applications with filters:", req.query);
    const { status, eventId } = req.query;
    
    let query = {};
const { hasAttended } = req.query;

// Filter by status if provided
if (status) {
  query.status = status;
}

// Filter by eventId if provided
if (eventId) {
  query.eventId = eventId;
}

// Filter by attendance if provided
if (hasAttended !== undefined) {
  query.hasAttended = hasAttended === 'true';
}
    
    const applications = await Application.find(query)
      .sort({ applicationDate: -1 }); // Latest first
    
    console.log(`📋 Found ${applications.length} applications with query:`, query);
    
    res.json(applications);
    
  } catch (error) {
    console.error("❌ Error fetching applications:", error);
    res.status(500).json({ error: error.message });
  }
};

// ===== GET SINGLE APPLICATION BY ID (NEW) =====
const getApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;
    console.log("🔍 Fetching application by ID:", applicationId);
    
    const application = await Application.findOne({ applicationId: applicationId });
    
    if (!application) {
      console.log("❌ Application not found:", applicationId);
      return res.status(404).json({ error: "Application not found" });
    }
    
    console.log("✅ Application found:", application.applicationId);
    res.json(application);
    
  } catch (error) {
    console.error("❌ Error fetching application:", error);
    res.status(500).json({ error: error.message });
  }
};

// ===== CHECK IF USER APPLIED FOR SPECIFIC EVENT =====
const checkUserApplication = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.session.userId;
    
    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }
    
    const application = await Application.findOne({ 
      eventId: eventId, 
      userId: userId 
    });
    
    console.log("🔍 Application check for:", eventId, "User:", req.session.username, "- Found:", !!application);
    
    res.json({ 
      hasApplied: !!application,
      status: application ? application.status : null,
      applicationId: application ? application.applicationId : null,
      applicationDate: application ? application.applicationDate : null
    });
    
  } catch (error) {
    console.error("❌ Error checking application:", error);
    res.status(500).json({ error: error.message });
  }
};

// ===== UPDATE APPLICATION STATUS (APPROVE/REJECT) - ENHANCED =====
// ===== UPDATE APPLICATION STATUS (APPROVE/REJECT) - ENHANCED =====
const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, adminNotes } = req.body;
    
    console.log(`📝 Admin ${req.session.username || req.session.admin?.username} updating application ${applicationId} to status: ${status}`);
    console.log("📝 Admin notes:", adminNotes);
    
    // Validate status
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ 
        error: "Invalid status. Must be 'approved', 'rejected', or 'pending'" 
      });
    }
    
    // Check admin authentication
    if (!req.session.admin && req.session.userType !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    const updatedApplication = await Application.findOneAndUpdate(
      { applicationId: applicationId },
      { 
        status: status,
        actionDate: new Date(),
        adminNotes: adminNotes || '',
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!updatedApplication) {
      console.log("❌ Application not found:", applicationId);
      return res.status(404).json({ error: "Application not found" });
    }
    
    console.log(`✅ Application ${status}:`, updatedApplication.applicationId);
    
    // ⭐ EMAIL BHEJNE KA CODE - YAHAN ADD KAREIN ⭐
    if (status === 'approved' || status === 'rejected') {
      try {
        // Event details fetch karein
        const event = await Event.findOne({ id: updatedApplication.eventId });
        
        if (event) {
          console.log(`📧 Sending ${status} email to:`, updatedApplication.userEmail);
          
          const emailResult = await sendSelectionEmail(
            updatedApplication.userEmail,
            updatedApplication.userName,
            updatedApplication.eventName,
            event, // Full event object with all details
            status
          );
          
          if (emailResult.success) {
            console.log('✅ Email sent successfully');
          } else {
            console.log('⚠️ Email failed but application updated:', emailResult.error);
          }
        } else {
          console.log('⚠️ Event not found for email notification');
        }
      } catch (emailError) {
        console.error('❌ Email error (non-critical):', emailError);
        // Email fail ho jaye toh bhi application update successful rahega
      }
    }
    // ⭐ EMAIL CODE END ⭐
    
    res.json({
      success: true,
      message: `Application ${status} successfully`,
      data: updatedApplication
    });
    
  } catch (error) {
    console.error("❌ Error updating application status:", error);
    res.status(500).json({ error: error.message });
  }
};

// ===== DELETE APPLICATION =====
const deleteApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    console.log("🗑️ Admin", req.session.username || req.session.admin?.username, "deleting application:", applicationId);
    
    // Check admin authentication
    if (!req.session.admin && req.session.userType !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    const result = await Application.deleteOne({ applicationId: applicationId });
    
    if (result.deletedCount === 0) {
      console.log("❌ Application not found for deletion:", applicationId);
      return res.status(404).json({ error: "Application not found" });
    }
    
    console.log("✅ Application deleted successfully");
    res.json({ 
      success: true, 
      message: "Application deleted successfully" 
    });
    
  } catch (error) {
    console.error("❌ Error deleting application:", error);
    res.status(500).json({ error: error.message });
  }
};

// ===== GET APPLICATIONS BY CURRENT USER =====
const getUserApplications = async (req, res) => {
  try {
    const userId = req.session.userId;
    
    console.log("🔍 Fetching applications for user:", req.session.username, "ID:", userId);
    
    const applications = await Application.find({ 
      userId: userId 
    }).sort({ applicationDate: -1 });
    
    console.log(`📋 Found ${applications.length} applications for user:`, req.session.username);
    
    res.json({
      success: true,
      applications: applications,
      count: applications.length
    });
    
  } catch (error) {
    console.error("❌ Error fetching user applications:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// ===== GET APPLICATIONS BY EMAIL (FOR PROFILE PAGE) =====
const getApplicationsByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    
    console.log("🔍 Fetching applications by email:", email);
    console.log("🔍 Session user:", req.session.username, "Session email:", req.session.email);
    
    // Verify user is requesting their own applications or admin
    if (req.session.userType === 'user' && req.session.email !== email) {
      return res.status(403).json({ 
        success: false, 
        error: "Access denied. You can only view your own applications." 
      });
    }
    
    // Search applications using userEmail field
    const applications = await Application.find({ 
      userEmail: email.toLowerCase().trim()
    }).sort({ applicationDate: -1 });
    
    console.log(`📋 Found ${applications.length} applications for email:`, email);
    
    res.json({
      success: true,
      applications: applications,
      count: applications.length
    });
    
  } catch (error) {
    console.error("❌ Error fetching applications by email:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// ===== AUTO-DELETE REJECTED APPLICATIONS (1 WEEK OLD) =====
const cleanupRejectedApplications = async () => {
  try {
    console.log("🧹 Starting cleanup of old rejected applications...");
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Find rejected applications older than 1 week
    const oldRejectedApps = await Application.find({
      status: 'rejected',
      actionDate: { $lt: oneWeekAgo }
    });
    
    if (oldRejectedApps.length === 0) {
      console.log("✅ No old rejected applications to cleanup");
      return { deleted: 0 };
    }
    
    console.log(`🗑️ Found ${oldRejectedApps.length} rejected applications older than 1 week`);
    console.log("🗑️ Applications to delete:", oldRejectedApps.map(app => ({
      id: app.applicationId,
      userName: app.userName,
      eventName: app.eventName,
      rejectedDate: app.actionDate
    })));
    
    // Delete the old rejected applications
    const deleteResult = await Application.deleteMany({
      status: 'rejected',
      actionDate: { $lt: oneWeekAgo }
    });
    
    console.log(`✅ Cleanup completed: ${deleteResult.deletedCount} rejected applications deleted`);
    
    return { 
      deleted: deleteResult.deletedCount,
      applications: oldRejectedApps.map(app => app.applicationId)
    };
    
  } catch (error) {
    console.error("❌ Error during rejected applications cleanup:", error);
    throw error;
  }
};
// Mark attendance for approved applications
const markAttendance = async (req, res) => {
  try {
    const { applicationId } = req.params;  // Yeh sahi hai?
    const { hasAttended } = req.body;
    
    console.log('Marking attendance for:', applicationId); // Add this line
    console.log('Request body:', req.body); // Add this line
    
    const application = await Application.findOne({ applicationId: applicationId });
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    application.hasAttended = hasAttended;
    application.attendanceDate = hasAttended ? new Date() : null;
    
    await application.save();
    
    console.log('Attendance marked successfully'); // Add this line
    
    res.json({
      message: `Application marked as ${hasAttended ? 'attended' : 'not attended'}`,
      application
    });
    
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};
// ===== MANUAL CLEANUP TRIGGER (FOR ADMIN) =====
const triggerCleanup = async (req, res) => {
  try {
    console.log("🧹 Manual cleanup triggered by admin:", req.session.username || req.session.admin?.username);
    
    // Check admin authentication
    if (!req.session.admin && req.session.userType !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    const result = await cleanupRejectedApplications();
    
    res.json({
      success: true,
      message: `Cleanup completed: ${result.deleted} rejected applications deleted`,
      deleted: result.deleted,
      applicationIds: result.applications
    });
    
  } catch (error) {
    console.error("❌ Error in manual cleanup:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// ===== GET APPLICATION STATISTICS (FOR ADMIN DASHBOARD) =====
const getApplicationStats = async (req, res) => {
  try {
    console.log("📊 Fetching application statistics...");
    
    // Check admin authentication
    if (!req.session.admin && req.session.userType !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    const stats = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Format stats
    const formattedStats = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    };
    
    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });
    
    // Get recent applications (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentApplications = await Application.countDocuments({
      applicationDate: { $gte: thirtyDaysAgo }
    });
    
    console.log("📊 Application statistics:", formattedStats);
    
    res.json({
      success: true,
      stats: formattedStats,
      recentApplications: recentApplications
    });
    
  } catch (error) {
    console.error("❌ Error fetching application statistics:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

module.exports = {
  submitApplication,
  getAllApplications,
  getApplicationById,
  checkUserApplication,
  updateApplicationStatus,
  deleteApplication,
  getUserApplications,
  getApplicationsByEmail,
  cleanupRejectedApplications,
  triggerCleanup,   
  markAttendance,
  getApplicationStats
};