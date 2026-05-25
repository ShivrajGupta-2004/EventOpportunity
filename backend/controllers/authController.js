// controllers/authController.js - Updated with Profile Management
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("../models/User");
const Admin = require("../models/Admin");
const SessionManager = require("../config/sessionManager");
const crypto = require('crypto');
/* =================================================================
   AUTH CONTROLLERS - Using SessionManager + Profile Management
   ================================================================= */

// ===== USER LOGIN =====
const userLogin = async (req, res) => {
    console.log("📩 User Login attempt:", req.body);
    const { username, password } = req.body;

    // Input validation
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    try {
        console.log("🔍 Searching for user in database...");
        console.log("🔍 Database connection state:", mongoose.connection.readyState);
        console.log("🔍 Database name:", mongoose.connection.name);

        // Find user by username or email
        const user = await User.findOne({
            $or: [
                { username: username.trim() },
                { email: username.toLowerCase().trim() }
            ]
        });

        console.log("🔍 Database query completed");
        console.log("🔍 User found:", !!user);

        if (!user) {
            console.log("❌ User not found:", username);

            // Debug: Check total users in database
            const userCount = await User.countDocuments();
            console.log("📊 Total users in database:", userCount);

            if (userCount === 0) {
                console.log("⚠️ WARNING: No users found in database! Registration may not be working.");
            } else {
                // Show sample usernames for debugging (first 3)
                const sampleUsers = await User.find({}, 'username email').limit(3);
                console.log("📋 Sample users in database:", sampleUsers.map(u => ({ username: u.username, email: u.email })));
            }

            return res.status(401).json({ message: "Invalid username or password" });
        }

        console.log("✅ User found:");
        console.log("   - Username:", user.username);
        console.log("   - Email:", user.email);
        console.log("   - Full Name:", user.fullName);

        // Compare password
        console.log("🔍 Comparing passwords...");
        const isMatch = await bcrypt.compare(password, user.password);
        console.log("🔍 Password match result:", isMatch);

        if (!isMatch) {
            console.log("❌ Password mismatch for user:", user.username);
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // ✅ CREATE USER SESSION USING SESSION MANAGER
        SessionManager.createUserSession(req, user);

        console.log("✅ User login successful for:", user.username);
        console.log("🔍 Session created:", SessionManager.getSessionInfo(req));

        res.json({
            message: "Login successful",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName
            }
        });

    } catch (err) {
        console.error("❌ User login error:", err);
        console.error("❌ Error stack:", err.stack);
        res.status(500).json({ message: "Server error. Please try again." });
    }
};

// ===== ADMIN LOGIN =====
const adminLogin = async (req, res) => {
    console.log("📩 Admin login attempt:", req.body);
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    try {
        console.log("🔍 Searching for admin in database...");
        
        const admin = await Admin.findOne({
            $or: [
                { username: username.trim() },
                { email: username.toLowerCase().trim() }
            ]
        });

        if (!admin) {
            console.log("❌ Admin not found:", username);
            
            // Debug: Check total admins in database
            const adminCount = await Admin.countDocuments();
            console.log("📊 Total admins in database:", adminCount);
            
            return res.status(401).json({ message: "Invalid admin credentials" });
        }

        console.log("✅ Admin found:");
        console.log("   - Username:", admin.username);
        console.log("   - Email:", admin.email);
        console.log("   - Full Name:", admin.fullName);

        // Compare password
        console.log("🔍 Comparing passwords...");
        const isMatch = await bcrypt.compare(password, admin.password);
        console.log("🔍 Password match result:", isMatch);

        if (!isMatch) {
            console.log("❌ Password mismatch for admin:", admin.username);
            return res.status(401).json({ message: "Invalid admin credentials" });
        }

        // ✅ CREATE ADMIN SESSION USING SESSION MANAGER
        SessionManager.createAdminSession(req, admin);

        console.log("✅ Admin login successful for:", admin.username);
        console.log("🔍 Session created:", SessionManager.getSessionInfo(req));

        res.json({
            message: "Admin login successful",
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                fullName: admin.fullName
            }
        });

    } catch (err) {
        console.error("❌ Admin login error:", err);
        res.status(500).json({ message: "Server error. Please try again." });
    }
};
// Add these functions to your existing authController.js

const sendOTPForPasswordReset = async (req, res) => {
    console.log("🔐 Password reset OTP request:", req.body);
    const { userIdentifier } = req.body;

    if (!userIdentifier) {
        return res.status(400).json({ 
            success: false,
            message: "Username or email is required" 
        });
    }

    try {
        console.log("🔍 Searching for user:", userIdentifier);
        
        // Find user by username or email
        const user = await User.findOne({
            $or: [
                { username: userIdentifier.trim() },
                { email: userIdentifier.toLowerCase().trim() }
            ]
        });

        if (!user) {
            console.log("❌ User not found for password reset:", userIdentifier);
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }

        console.log("✅ User found for password reset:", user.username);

        // Generate secure OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        console.log("🔢 Generated OTP:", otp, "Expires at:", otpExpiry);

        // Save OTP to database
        await User.findByIdAndUpdate(user._id, {
            otp: otp,
            otpExpiry: otpExpiry,
            otpAttempts: 0
        });

        console.log("💾 OTP saved to database for user:", user.username);

        // Return success with full email for frontend to send
        res.json({
            success: true,
            message: "OTP generated successfully",
            fullEmail: user.email,
            name: user.fullName,
            otp: otp
        });

        console.log("✅ Password reset OTP process completed for:", user.username);

    } catch (error) {
        console.error("❌ Send OTP error:", error);
        res.status(500).json({ 
            success: false,
            message: "Failed to send OTP. Please try again." 
        });
    }
};
const verifyOTP = async (req, res) => {
    console.log("🔐 OTP verification request:", req.body);
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ 
            success: false,
            message: "Email and OTP are required" 
        });
    }

    try {
        console.log("🔍 Verifying OTP for email:", email);

        // Find user with matching email and valid OTP
        const user = await User.findOne({
            email: email.toLowerCase().trim(),
            otp: otp.trim(),
            otpExpiry: { $gt: new Date() } // OTP should not be expired
        });

        if (!user) {
            console.log("❌ Invalid or expired OTP for:", email);
            
            // Increment attempts for existing user (even if OTP is wrong)
            const existingUser = await User.findOne({ 
                email: email.toLowerCase().trim() 
            });
            
            if (existingUser) {
                await User.findByIdAndUpdate(existingUser._id, {
                    $inc: { otpAttempts: 1 }
                });
                
                // Check if too many attempts
                if (existingUser.otpAttempts >= 2) { // 3 total attempts (0,1,2)
                    await User.findByIdAndUpdate(existingUser._id, {
                        otp: null,
                        otpExpiry: null,
                        otpAttempts: 0
                    });
                    
                    return res.status(429).json({ 
                        success: false,
                        message: "Too many failed attempts. Please request a new OTP." 
                    });
                }
                
                const remainingAttempts = 3 - (existingUser.otpAttempts + 1);
                return res.status(400).json({ 
                    success: false,
                    message: `Invalid OTP. ${remainingAttempts} attempts remaining.` 
                });
            }
            
            return res.status(400).json({ 
                success: false,
                message: "Invalid or expired OTP" 
            });
        }

        console.log("✅ OTP verified successfully for user:", user.username);

        // Don't clear OTP yet - we'll clear it after password reset
        // Just mark as verified
        await User.findByIdAndUpdate(user._id, {
            otpAttempts: 0 // Reset attempts on successful verification
        });

        res.json({
            success: true,
            message: "OTP verified successfully",
            canResetPassword: true
        });

        console.log("✅ OTP verification completed for:", user.username);

    } catch (error) {
        console.error("❌ Verify OTP error:", error);
        res.status(500).json({ 
            success: false,
            message: "OTP verification failed. Please try again." 
        });
    }
};


const resetPassword = async (req, res) => {
    console.log("🔐 Password reset request for email:", req.body.email);
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).json({ 
            success: false,
            message: "Email and new password are required" 
        });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ 
            success: false,
            message: "Password must be at least 8 characters long" 
        });
    }

    try {
        console.log("🔍 Finding user for password reset:", email);

        // Find user with valid OTP (must be verified first)
        const user = await User.findOne({
            email: email.toLowerCase().trim(),
            otp: { $ne: null }, // OTP should exist
            otpExpiry: { $gt: new Date() } // OTP should not be expired
        });

        if (!user) {
            console.log("❌ Invalid reset attempt - no valid OTP found for:", email);
            return res.status(400).json({ 
                success: false,
                message: "Invalid reset session. Please request a new OTP." 
            });
        }

        console.log("✅ User found for password reset:", user.username);

        // Hash the new password
        console.log("🔐 Hashing new password...");
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password and clear OTP data
        await User.findByIdAndUpdate(user._id, {
            password: hashedPassword,
            otp: null,
            otpExpiry: null,
            otpAttempts: 0
        });

        console.log("✅ Password updated successfully for user:", user.username);

        res.json({
            success: true,
            message: "Password reset successfully",
            redirect: "/userLogin.html"
        });

        console.log("✅ Password reset process completed for:", user.username);

    } catch (error) {
        console.error("❌ Reset password error:", error);
        res.status(500).json({ 
            success: false,
            message: "Password reset failed. Please try again." 
        });
    }
};
// ===== CHECK SESSION =====
const checkSession = (req, res) => {
    console.log("🔍 Session check - Session ID:", req.sessionID);
    
    // Use SessionManager to get session info
    const sessionInfo = SessionManager.getSessionInfo(req);
    console.log("🔍 Session info from SessionManager:", sessionInfo);

    if (sessionInfo.authenticated) {
        res.json({
            loggedIn: true,
            userType: sessionInfo.userType,
            username: sessionInfo.username,
            userId: sessionInfo.userId || sessionInfo.adminId,
            email: sessionInfo.email
        });
    } else {
        res.json({ loggedIn: false });
    }
};

// ===== GET USER PROFILE BY ID =====
const getUserProfile = async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log("🔍 Getting profile for user ID:", userId);

        // Check if user is authenticated
        if (!SessionManager.isAuthenticated(req)) {
            return res.status(401).json({ 
                success: false,
                message: "Authentication required",
                redirect: '/userLogin.html' 
            });
        }

        // Check if requesting user's own profile or admin
        const sessionInfo = SessionManager.getSessionInfo(req);
        if (sessionInfo.userType === 'user' && sessionInfo.userId !== userId) {
            return res.status(403).json({ 
                success: false,
                message: "Access denied. You can only view your own profile." 
            });
        }

        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }

        console.log("✅ User profile fetched for:", user.username);
        res.json({ 
            success: true,
            user: user
        });

    } catch (error) {
        console.error("❌ Get user profile error:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error fetching profile" 
        });
    }
};

// ===== UPDATE USER PROFILE =====
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log("🔄 Updating profile for user ID:", userId);
        console.log("🔄 Update data:", req.body);

        // Check if user is authenticated
        if (!SessionManager.isAuthenticated(req)) {
            return res.status(401).json({ 
                success: false,
                message: "Authentication required",
                redirect: '/userLogin.html' 
            });
        }

        // Check if updating user's own profile or admin
        const sessionInfo = SessionManager.getSessionInfo(req);
        if (sessionInfo.userType === 'user' && sessionInfo.userId !== userId) {
            return res.status(403).json({ 
                success: false,
                message: "Access denied. You can only update your own profile." 
            });
        }

        const updateData = req.body;

        // Remove sensitive fields that shouldn't be updated through this endpoint
        delete updateData.password;
        delete updateData._id;
        delete updateData.__v;
        delete updateData.isEmailVerified;

        // Validate required fields
        if (updateData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(updateData.email)) {
                return res.status(400).json({ 
                    success: false,
                    message: "Invalid email format" 
                });
            }
            updateData.email = updateData.email.toLowerCase().trim();
        }

        if (updateData.mobile) {
            const mobileRegex = /^[0-9]{10}$/;
            if (!mobileRegex.test(updateData.mobile)) {
                return res.status(400).json({ 
                    success: false,
                    message: "Mobile number must be 10 digits" 
                });
            }
        }

        // Check for duplicate email or mobile (excluding current user)
        if (updateData.email || updateData.mobile) {
            const duplicateQuery = {
                _id: { $ne: userId }
            };

            if (updateData.email && updateData.mobile) {
                duplicateQuery.$or = [
                    { email: updateData.email },
                    { mobile: updateData.mobile }
                ];
            } else if (updateData.email) {
                duplicateQuery.email = updateData.email;
            } else if (updateData.mobile) {
                duplicateQuery.mobile = updateData.mobile;
            }

            const existingUser = await User.findOne(duplicateQuery);
            if (existingUser) {
                let conflictField = 'Email';
                if (existingUser.mobile === updateData.mobile) {
                    conflictField = 'Mobile number';
                }
                return res.status(400).json({ 
                    success: false,
                    message: `${conflictField} already exists` 
                });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            updateData, 
            { 
                new: true, 
                runValidators: true 
            }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }

        // Update session with new data if it's the current user
        if (sessionInfo.userId === userId) {
            req.session.username = updatedUser.username;
            req.session.email = updatedUser.email;
        }

        console.log("✅ User profile updated for:", updatedUser.username);
        res.json({ 
            success: true,
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error("❌ Update user profile error:", error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                success: false,
                message: "Validation error",
                errors: Object.values(error.errors).map(e => e.message)
            });
        }

        if (error.code === 11000) {
            let field = 'field';
            if (error.keyPattern.email) field = 'Email';
            if (error.keyPattern.mobile) field = 'Mobile number';
            if (error.keyPattern.username) field = 'Username';
            
            return res.status(400).json({ 
                success: false,
                message: `${field} already exists`
            });
        }

        res.status(500).json({ 
            success: false,
            message: "Server error updating profile" 
        });
    }
};

// ===== LOGOUT =====
const logout = async (req, res) => {
    console.log("👋 Logout request for user:", req.session.username);

    try {
        // Use SessionManager to destroy session
        await SessionManager.destroySession(req, res);
        res.json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("❌ Logout error:", error);
        res.status(500).json({ message: "Could not log out" });
    }
};

// ===== GET ADMIN PROFILE =====
const getAdminProfile = async (req, res) => {
    try {
        // Check if admin is authenticated
        if (!SessionManager.isAdmin(req)) {
            return res.status(401).json({ 
                message: "Admin authentication required",
                redirect: '/adminLogin.html' 
            });
        }

        const adminId = req.session.adminId;
        const admin = await Admin.findById(adminId).select('-password');
        
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        console.log("✅ Admin profile fetched for:", admin.username);
        res.json({ admin });

    } catch (error) {
        console.error("❌ Get admin profile error:", error);
        res.status(500).json({ message: "Server error fetching profile" });
    }
};

// ===== UPDATE ADMIN PROFILE =====
const updateAdminProfile = async (req, res) => {
    try {
        // Check if admin is authenticated
        if (!SessionManager.isAdmin(req)) {
            return res.status(401).json({ 
                message: "Admin authentication required",
                redirect: '/adminLogin.html' 
            });
        }

        const adminId = req.session.adminId;
        const updateData = req.body;

        // Remove sensitive fields
        delete updateData.password;
        delete updateData._id;

        const admin = await Admin.findByIdAndUpdate(
            adminId, 
            updateData, 
            { new: true, runValidators: true }
        ).select('-password');

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        // Update session with new data
        req.session.username = admin.username;
        req.session.email = admin.email;

        console.log("✅ Admin profile updated for:", admin.username);
        res.json({ 
            message: "Profile updated successfully",
            admin 
        });

    } catch (error) {
        console.error("❌ Update admin profile error:", error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: "Validation error",
                errors: Object.values(error.errors).map(e => e.message)
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({ 
                message: "Username or email already exists"
            });
        }

        res.status(500).json({ message: "Server error updating profile" });
    }
};

module.exports = {
    userLogin,
    adminLogin,
    checkSession,
    getUserProfile,      // NEW - Added for profile management
    updateUserProfile,   // NEW - Added for profile management
    logout,
    sendOTPForPasswordReset,
    verifyOTP,
    resetPassword,
    getAdminProfile,
    updateAdminProfile
};