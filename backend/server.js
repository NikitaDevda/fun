const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// ===== MONGODB CONNECTION =====
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Atlas Connected Successfully!'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// ===== API ROUTES =====

// 1. REGISTER USER
app.post('/api/register', async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Password are required!'
      });
    }

    const existingUser = await User.findOne({ userId });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists! Please login.'
      });
    }

    const newUser = new User({
      userId,
      password,
      firstLogin: new Date(),
      lastLogin: new Date(),
      loginCount: 1
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully!',
      data: {
        userId: newUser.userId,
        firstLogin: newUser.firstLogin,
        loginCount: newUser.loginCount
      }
    });

  } catch (error) {
    console.error('❌ Register Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// 2. LOGIN USER
app.post('/api/login', async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Password are required!'
      });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found! Please register first.'
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password! Please try again.'
      });
    }

    user.lastLogin = new Date();
    user.loginCount = user.loginCount + 1;
    await user.save();

    res.json({
      success: true,
      message: 'Login successful!',
      data: {
        userId: user.userId,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount,
        firstLogin: user.firstLogin
      }
    });

  } catch (error) {
    console.error('❌ Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// 3. GET ALL USERS
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users: ' + error.message
    });
  }
});

// 4. DELETE USER
app.delete('/api/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const deleted = await User.findOneAndDelete({ userId });
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'User not found!'
      });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user: ' + error.message
    });
  }
});

// 5. HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running with MongoDB',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ API ready at http://localhost:${PORT}/api`);
});