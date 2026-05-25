// routes/staticRoutes.js
const express = require("express");
const path = require("path");
const router = express.Router();

/* =================================================================
   STATIC HTML ROUTES
   ================================================================= */

// Home Page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../homePage.html'));
});

// User Login Page
router.get('/userLogin.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../userLogin.html'));
});

// User Registration Page
router.get('/userRegister.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../userRegister.html'));
});

// Admin Login Page
router.get('/adminLogin.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../adminLogin.html'));
});

// Admin Registration Page
router.get('/adminRegister.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../adminRegister.html'));
});

// Event Page
router.get('/event.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../event.html'));
});

// Admin Dashboard Page
router.get('/adminPage.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../adminPage.html'));
});

// Profile Page
router.get('/profile.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../profile.html'));
});

module.exports = router;