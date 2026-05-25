// server.js - Updated with Session Manager
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cron = require("node-cron");

/* ---------- Import Session Manager ---------- */
const SessionManager = require("./config/sessionManager");

/* ---------- Import Routes ---------- */
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const eventRoutes = require("./routes/eventRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const staticRoutes = require("./routes/staticRoutes");
const receiptRoutes = require('./routes/receiptRoutes');

/* ---------- Import Controllers ---------- */
const authController = require('./controllers/authController');
/* ---------- Models (for cron job and debug) ---------- */
const Event = require('./models/Event');
const User = require("./models/User");
const Admin = require("./models/Admin");
const Application = require('./models/Application');
const dashboardRoutes = require('./routes/dashboardRoutes');
const app = express();

/* ---------- Middleware Configuration ---------- */

// CORS Configuration - Enhanced for Session Support
app.use(cors({
  origin: [
    'http://localhost:5500',    
    'http://127.0.0.1:5500',   
    'http://localhost:3000',    
    'http://127.0.0.1:3000'    
  ],
  credentials: true,              
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200
}));

// JSON Parser
app.use(express.json());
app.use('/api/receipts', receiptRoutes);

// Initialize Session Middleware using SessionManager
app.use(SessionManager.initializeSession());

// Session Logging Middleware
app.use(SessionManager.logSession);

// Serve Static Files
app.use(express.static(__dirname));

// Profile routes
app.get('/api/user/profile/:userId', authController.getUserProfile);
app.put('/api/user/profile/:userId', authController.updateUserProfile);
/* ---------- MongoDB Connection ---------- */
mongoose
  .connect("mongodb://127.0.0.1:27017/EventOpportunity")
  .then(() => {
    console.log("✅ MongoDB connected to EventOpportunity database");
    console.log("🔍 Database name:", mongoose.connection.name);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

/* ---------- Route Handlers ---------- */

// Static HTML Routes
app.use('/', staticRoutes);

// API Routes
app.use('/api', authRoutes);
app.use('/', userRoutes);           
app.use('/', adminRoutes);          
app.use('/api', eventRoutes);
app.use('/api', applicationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', dashboardRoutes); 
/* ---------- Enhanced Debug & Test Routes ---------- */

// Session Test Route - Enhanced with SessionManager
app.get('/api/session-test', (req, res) => {
  res.json({
    message: "Session test endpoint working",
    sessionInfo: SessionManager.getSessionInfo(req),
    debugInfo: SessionManager.getSessionDebugInfo(req)
  });
});

// Session Status Route
app.get('/api/session-status', (req, res) => {
  res.json(SessionManager.getSessionInfo(req));
});

// Simple Test Route
app.get('/test', (req, res) => {
  res.json({ 
    message: "Server is working", 
    timestamp: new Date().toISOString() 
  });
});

/* ---------- Cron Job - Auto Archive Past Events ---------- */
cron.schedule('0 0 * * *', async () => {
  try {
    const now = new Date();
    const past = await Event.find({ date: { $lt: now } });
    
    if (past.length > 0) {
      const pastColl = mongoose.connection.collection('pastevent');
      await pastColl.insertMany(past.map(e => e.toObject()));
      await Event.deleteMany({ date: { $lt: now } });
      
      console.log(`🔄 Moved ${past.length} old events to pastevent collection`);
    } else {
      console.log("📅 No past events to archive");
    }
  } catch (err) { 
    console.error('❌ Cron job error:', err); 
  }
});

/* ---------- Debug Stats Route ---------- */
app.get('/api/debug/stats', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const adminCount = await Admin.countDocuments();
    const eventCount = await Event.countDocuments();
    const applicationCount = await Application.countDocuments();
    
    res.json({
      database: mongoose.connection.name,
      connectionState: mongoose.connection.readyState,
      session: SessionManager.getSessionInfo(req),
      collections: {
        users: userCount,
        admins: adminCount,
        events: eventCount,
        applications: applicationCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Debug stats error:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ---------- Error Handling ---------- */
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ 
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

/* ---------- Start Server ---------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("🌐 CORS enabled for Live Server (port 5500)");
  console.log("🍪 Session management handled by SessionManager module");
  console.log("📁 MVC Architecture: Controllers + Routes organized");
  console.log("🔍 Available endpoints:");
  console.log("   🔐 AUTH: /api/login, /api/admin-login, /api/check-session, /api/logout");
  console.log("   👤 USER: /register, /check-username");
  console.log("   👨‍💼 ADMIN: /admin-register, /check-admin-username");
  console.log("   📅 EVENTS: /api/events (GET/POST), /api/events/:id (GET/PUT/DELETE)");
  console.log("   📝 APPLICATIONS: /api/applications (GET/POST), /api/applications/:id/status (PUT)");
  console.log("   🔧 DEBUG: /api/debug/stats, /api/session-test, /api/session-status");
  console.log("   🧪 TEST: /test");
});