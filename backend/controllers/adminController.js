// controllers/adminController.js
const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");

/* =================================================================
   ADMIN CONTROLLERS
   ================================================================= */

// ===== ADMIN REGISTRATION =====
const registerAdmin = async (req, res) => {
  console.log("📩 Received Admin Registration Data:", req.body);
  const { fullName, email, username, mobile, gender, dateOfBirth, password } = req.body;

  // Input validation
  if (!fullName || !email || !username || !mobile || !gender || !dateOfBirth || !password) {
    return res.status(400).json({ 
      success: false, 
      error: "❌ All fields are required" 
    });
  }

  try {
    console.log("🔍 Checking for existing admins...");
    
    const existingEmail = await Admin.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      console.log("❌ Admin email already exists:", email);
      return res.status(400).json({ success: false, error: "❌ Email already registered (Admin)" });
    }

    const existingUsername = await Admin.findOne({ username });
    if (existingUsername) {
      console.log("❌ Admin username already exists:", username);
      return res.status(400).json({ success: false, error: "❌ Username already taken (Admin)" });
    }

    const existingMobile = await Admin.findOne({ mobile });
    if (existingMobile) {
      console.log("❌ Admin mobile already exists:", mobile);
      return res.status(400).json({ success: false, error: "❌ Mobile number already registered (Admin)" });
    }

    console.log("✅ All checks passed. Creating new admin...");

    // Hash password before saving
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log("🔒 Admin password hashed successfully");

    const newAdmin = new Admin({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      username: username.trim(),
      mobile,
      gender: gender.charAt(0).toUpperCase() + gender.slice(1),
      dateOfBirth: new Date(dateOfBirth), // Fixed: was 'dob' but should match your schema
      password: hashedPassword,
      isEmailVerified: true,
    });
    
    console.log("💾 Saving admin to database...");
    const savedAdmin = await newAdmin.save();
    console.log("✅ Admin saved successfully with ID:", savedAdmin._id);
    
    // Verify the admin was saved
    const adminCount = await Admin.countDocuments();
    console.log("📊 Total admins in database after registration:", adminCount);
    
    res.status(201).json({
      success: true,
      message: "✅ Admin registered successfully",
      adminId: savedAdmin._id,
      adminData: {
        fullName: savedAdmin.fullName,
        email: savedAdmin.email,
        username: savedAdmin.username,
        mobile: savedAdmin.mobile,
        gender: savedAdmin.gender,
      },
    });
  } catch (error) {
    console.error("❌ Admin Registration Error:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({ success: false, error: "❌ Admin registration failed. Please try again." });
  }
};

// ===== CHECK ADMIN USERNAME AVAILABILITY =====
const checkAdminUsername = async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }
    
    const exists = await Admin.findOne({ username: username.trim() });
    console.log("🔍 Admin username check for:", username, "- Exists:", !!exists);
    
    res.json({ exists: !!exists });
  } catch (error) {
    console.error("❌ Admin username check error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ===== GET ADMIN PROFILE =====
const getAdminProfile = async (req, res) => {
  try {
    console.log("🔍 Getting admin profile for session:", req.session);
    
    if (!req.session || !req.session.admin || !req.session.admin.id) {
      return res.status(401).json({ error: "Not authenticated as admin" });
    }

    const admin = await Admin.findById(req.session.admin.id).select('-password');
    
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    console.log("✅ Admin profile found:", {
      id: admin._id,
      username: admin.username,
      fullName: admin.fullName
    });

    res.json({
      success: true,
      admin: {
        fullName: admin.fullName,
        username: admin.username,
        email: admin.email,
        mobile: admin.mobile,
        gender: admin.gender,
        dateOfBirth: admin.dateOfBirth,
        createdAt: admin.createdAt
      }
    });
  } catch (error) {
    console.error("❌ Get admin profile error:", error);
    res.status(500).json({ error: "Server error getting profile" });
  }
};

// ===== UPDATE ADMIN PROFILE =====
const updateAdminProfile = async (req, res) => {
  try {
    console.log("📝 Updating admin profile:", req.body);
    
    if (!req.session || !req.session.admin || !req.session.admin.id) {
      return res.status(401).json({ error: "Not authenticated as admin" });
    }

    const { fullName, username, email, mobile, gender, dateOfBirth } = req.body;

    // Input validation
    if (!fullName || !username || !email || !mobile || !gender || !dateOfBirth) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if username or email is being changed to existing one (excluding current admin)
    const adminId = req.session.admin.id;
    
    const existingUsername = await Admin.findOne({ 
      username: username.trim(), 
      _id: { $ne: adminId } 
    });
    if (existingUsername) {
      return res.status(400).json({ error: "Username already taken" });
    }

    const existingEmail = await Admin.findOne({ 
      email: email.toLowerCase().trim(), 
      _id: { $ne: adminId } 
    });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Update the admin
    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      {
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.toLowerCase().trim(),
        mobile: mobile.trim(),
        gender: gender,
        dateOfBirth: new Date(dateOfBirth)
      },
      { new: true, select: '-password' }
    );

    if (!updatedAdmin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    console.log("✅ Admin profile updated successfully");

    res.json({
      success: true,
      message: "Profile updated successfully",
      admin: {
        fullName: updatedAdmin.fullName,
        username: updatedAdmin.username,
        email: updatedAdmin.email,
        mobile: updatedAdmin.mobile,
        gender: updatedAdmin.gender,
        dateOfBirth: updatedAdmin.dateOfBirth,
        createdAt: updatedAdmin.createdAt
      }
    });
  } catch (error) {
    console.error("❌ Update admin profile error:", error);
    res.status(500).json({ error: "Server error updating profile" });
  }
};

module.exports = {
  registerAdmin,
  checkAdminUsername,
  getAdminProfile,
  updateAdminProfile
};