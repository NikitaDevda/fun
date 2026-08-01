const mongoose = require('mongoose');
const User = require('../models/User');

// MongoDB connection for Vercel
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI)
      .then(mongoose => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use POST.' 
    });
  }

  try {
    await connectDB();
    
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Password are required!'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ userId });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists! Please login.'
      });
    }

    // Create new user
    const newUser = new User({
      userId,
      password,  // Plain text password
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
};