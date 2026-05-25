// config/database.js
const mongoose = require("mongoose");

// ===== DATABASE CONNECTION CONFIGURATION =====
const connectDB = async () => {
  try {
    // Connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
    };

    // Connect to MongoDB
    await mongoose.connect("mongodb://127.0.0.1:27017/EventOpportunity", options);
    
    console.log("✅ MongoDB connected to EventOpportunity database");
    console.log("🔍 Database name:", mongoose.connection.name);
    console.log("🔍 Connection host:", mongoose.connection.host);
    console.log("🔍 Connection port:", mongoose.connection.port);
    
    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('✅ Mongoose connected to MongoDB');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('❌ Mongoose disconnected from MongoDB');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('👋 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });
    
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    console.error("❌ Error details:", err.message);
    
    // Retry connection after 5 seconds
    console.log("🔄 Retrying connection in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

// ===== CHECK DATABASE CONNECTION STATUS =====
const checkConnection = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  const state = mongoose.connection.readyState;
  console.log(`🔍 Database connection state: ${states[state]} (${state})`);
  
  return {
    isConnected: state === 1,
    state: states[state],
    database: mongoose.connection.name
  };
};

// ===== GET DATABASE INFO =====
const getDatabaseInfo = () => {
  return {
    name: mongoose.connection.name,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    readyState: mongoose.connection.readyState,
    collections: Object.keys(mongoose.connection.collections)
  };
};

module.exports = {
  connectDB,
  checkConnection,
  getDatabaseInfo
};