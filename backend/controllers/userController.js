// controllers/userController.js
const bcrypt = require("bcrypt");
const User = require("../models/User");
const multer = require('multer');
const path = require('path');

/* =================================================================
   USER CONTROLLERS
   ================================================================= */

// ===== USER REGISTRATION =====
const registerUser = async (req, res) => {
  console.log("📩 Received User Registration Data:", req.body);
  const { fullName, email, username, mobile, gender, dateOfBirth, password } = req.body;

  // Input validation
  if (!fullName || !email || !username || !mobile || !gender || !dateOfBirth || !password) {
    return res.status(400).json({ 
      success: false, 
      error: "❌ All fields are required" 
    });
  }

  try {
    console.log("🔍 Checking for existing users...");
    
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      console.log("❌ Email already exists:", email);
      return res.status(400).json({ success: false, error: "❌ Email already registered" });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      console.log("❌ Username already exists:", username);
      return res.status(400).json({ success: false, error: "❌ Username already taken" });
    }

    const existingMobile = await User.findOne({ mobile });
    if (existingMobile) {
      console.log("❌ Mobile already exists:", mobile);
      return res.status(400).json({ success: false, error: "❌ Mobile number already registered" });
    }

    console.log("✅ All checks passed. Creating new user...");

    // Hash password before saving
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log("🔒 Password hashed successfully");

    const newUser = new User({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      username: username.trim(),
      mobile,
      gender,
      dateOfBirth: new Date(dateOfBirth),
      password: hashedPassword,
      isEmailVerified: true,
    });
    
    console.log("💾 Saving user to database...");
    const savedUser = await newUser.save();
    console.log("✅ User saved successfully with ID:", savedUser._id);
    
    // Verify the user was saved
    const userCount = await User.countDocuments();
    console.log("📊 Total users in database after registration:", userCount);
    
    res.status(201).json({
      success: true,
      message: "✅ User registered successfully",
      userId: savedUser._id,
      userData: {
        fullName: savedUser.fullName,
        email: savedUser.email,
        username: savedUser.username,
        mobile: savedUser.mobile,
        gender: savedUser.gender,
      },
    });
  } catch (error) {
    console.error("❌ User Registration Error:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({ success: false, error: "❌ User registration failed. Please try again." });
  }
};

// ===== CHECK USERNAME AVAILABILITY =====
const checkUsername = async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }
    
    const exists = await User.findOne({ username: username.trim() });
    console.log("🔍 Username check for:", username, "- Exists:", !!exists);
    
    res.json({ exists: !!exists });
  } catch (error) {
    console.error("❌ Username check error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ===== GET USER PROFILE =====
const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("🔍 Fetching profile for user ID:", userId);
    
    // Make sure user can only access their own profile
    if (req.session.userId !== userId) {
      console.log("❌ Access denied - User trying to access different profile");
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own profile.'
      });
    }
    
    const user = await User.findById(userId).select('-password'); // Exclude password
    
    if (!user) {
      console.log("❌ User not found with ID:", userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log("✅ Profile fetched successfully for:", user.username);
    res.json({
      success: true,
      user: user
    });
    
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

// ===== UPDATE USER PROFILE =====
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const updateData = req.body;
    console.log("📝 Updating profile for user ID:", userId);
    console.log("📝 Update data:", updateData);
    
    // Make sure user can only update their own profile
    if (req.session.userId !== userId) {
      console.log("❌ Access denied - User trying to update different profile");
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own profile.'
      });
    }
    
    // Remove sensitive fields that shouldn't be updated here
    delete updateData.password;
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.username; // Username shouldn't be changed
    
    // Validate email format if email is being updated
    if (updateData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        console.log("❌ Invalid email format:", updateData.email);
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
      
      // Check if email already exists (excluding current user)
      const existingUser = await User.findOne({
        email: updateData.email,
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        console.log("❌ Email already exists:", updateData.email);
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }
    
    // Validate mobile number if mobile is being updated
    if (updateData.mobile) {
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(updateData.mobile)) {
        console.log("❌ Invalid mobile format:", updateData.mobile);
        return res.status(400).json({
          success: false,
          message: 'Invalid mobile number format'
        });
      }
      
      // Check if mobile already exists (excluding current user)
      const existingUser = await User.findOne({
        mobile: updateData.mobile,
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        console.log("❌ Mobile already exists:", updateData.mobile);
        return res.status(400).json({
          success: false,
          message: 'Mobile number already exists'
        });
      }
    }
    
    // Calculate age if date of birth is provided
    if (updateData.dateOfBirth) {
      const dob = new Date(updateData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      updateData.age = age;
      console.log("📅 Calculated age:", age);
    }
    
    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        ...updateData,
        updatedAt: new Date()
      },
      { 
        new: true,
        runValidators: true
      }
    ).select('-password');
    
    if (!updatedUser) {
      console.log("❌ User not found during update:", userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update session email if it was changed
    if (updateData.email && req.session.email !== updateData.email) {
      req.session.email = updateData.email;
      console.log("📧 Session email updated to:", updateData.email);
    }
    
    console.log("✅ Profile updated successfully for:", updatedUser.username);
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('❌ Update profile error:', error);
    
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyValue)[0];
      console.log("❌ Duplicate key error for field:", field);
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// ===== PROFILE IMAGE UPLOAD SETUP =====
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images/') // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// ===== UPLOAD PROFILE IMAGE =====
const uploadProfileImage = (req, res) => {
  upload.single('profileImage')(req, res, async function (err) {
    if (err) {
      console.error('❌ Image upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'Image upload failed'
      });
    }
    
    if (!req.file) {
      console.log("❌ No image file provided");
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }
    
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        console.log("❌ User not authenticated for image upload");
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }
      
      // Update user's profile image path
      const imageUrl = `/images/${req.file.filename}`;
      console.log("📷 Uploading image:", imageUrl);
      
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { 
          profileImage: imageUrl,
          updatedAt: new Date()
        },
        { new: true }
      ).select('-password');
      
      if (!updatedUser) {
        console.log("❌ User not found during image update:", userId);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      console.log("✅ Profile image uploaded successfully for:", updatedUser.username);
      res.json({
        success: true,
        message: 'Profile image uploaded successfully',
        imageUrl: imageUrl,
        user: updatedUser
      });
      
    } catch (error) {
      console.error('❌ Database update error during image upload:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile image',
        error: error.message
      });
    }
  });
};

// ===== GET USER BY EMAIL (FOR ADMIN) =====
const getUserByEmail = async (req, res) => {
  try {
    const email = req.params.email;
    console.log("🔍 Fetching user by email:", email);
    
    const user = await User.findOne({ email: email }).select('-password');
    
    if (!user) {
      console.log("❌ User not found with email:", email);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log("✅ User found:", user.username);
    res.json({
      success: true,
      user: user
    });
    
  } catch (error) {
    console.error('❌ Get user by email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

// ===== GET ALL USERS (ADMIN ONLY) =====
const getAllUsers = async (req, res) => {
  try {
    console.log("👥 Fetching all users (admin request)");
    
    // Check if user is admin
    if (req.session.userType !== 'admin') {
      console.log("❌ Non-admin trying to access all users");
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    
    console.log("✅ Fetched", users.length, "users");
    res.json({
      success: true,
      users: users,
      count: users.length
    });
    
  } catch (error) {
    console.error('❌ Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

module.exports = {
  registerUser,
  checkUsername,
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  getUserByEmail,
  getAllUsers
};