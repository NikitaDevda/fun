const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Data directory
const DATA_DIR = process.env.DATA_DIR || './data';

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    console.log('📁 Data directory created');
  }
}

// ==================== FILE OPERATIONS ====================

// Get user file path
function getUserFilePath(userId) {
  const sanitizedId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(DATA_DIR, `user_${sanitizedId}.txt`);
}

// Read user data from file (NO ENCRYPTION)
async function readUserFile(userId) {
  try {
    const filePath = getUserFilePath(userId);
    const content = await fs.readFile(filePath, 'utf8');
    
    const lines = content.split('\n');
    const userData = {};
    
    lines.forEach(line => {
      const [key, ...valueParts] = line.split(': ');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(': ').trim();
        if (key === 'password') {
          userData[key] = value;  // Plain text password
        } else if (key === 'loginCount') {
          userData[key] = parseInt(value) || 0;
        } else if (key === 'firstLogin' || key === 'lastLogin') {
          userData[key] = new Date(value);
        } else {
          userData[key] = value;
        }
      }
    });
    
    return userData;
  } catch (error) {
    return null;
  }
}

// Write user data to file (NO ENCRYPTION)
async function writeUserFile(userId, userData) {
  const filePath = getUserFilePath(userId);
  
  const content = `userId: ${userId}
password: ${userData.password || ''}
firstLogin: ${userData.firstLogin ? new Date(userData.firstLogin).toISOString() : new Date().toISOString()}
lastLogin: ${userData.lastLogin ? new Date(userData.lastLogin).toISOString() : new Date().toISOString()}
loginCount: ${userData.loginCount || 0}
createdAt: ${new Date().toISOString()}
`;
  
  await fs.writeFile(filePath, content, 'utf8');
  return true;
}

// Get all users
async function getAllUsers() {
  try {
    const files = await fs.readdir(DATA_DIR);
    const users = [];
    
    for (const file of files) {
      if (file.startsWith('user_') && file.endsWith('.txt')) {
        const userId = file.replace('user_', '').replace('.txt', '');
        const userData = await readUserFile(userId);
        if (userData) {
          users.push(userData);
        }
      }
    }
    
    return users;
  } catch (error) {
    return [];
  }
}

// Delete user file
async function deleteUserFile(userId) {
  try {
    const filePath = getUserFilePath(userId);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

// ==================== API ROUTES ====================

// 1. REGISTER USER (Plain text password)
app.post('/api/register', async (req, res) => {
  try {
    console.log('📝 Register request:', req.body);
    
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Password are required!'
      });
    }

    // Check if user already exists
    const existingUser = await readUserFile(userId);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists! Please login.'
      });
    }

    // Create new user - ORIGINAL PASSWORD (NO ENCRYPTION)
    const userData = {
      userId,
      password: password,  // 👈 Plain text password
      firstLogin: new Date(),
      lastLogin: new Date(),
      loginCount: 1
    };

    await writeUserFile(userId, userData);
    console.log(`✅ User "${userId}" registered successfully! Password: "${password}"`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully!',
      data: {
        userId: userData.userId,
        password: userData.password,  // 👈 Original password in response
        firstLogin: userData.firstLogin,
        loginCount: userData.loginCount
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

// 2. LOGIN USER (Plain text password check)
app.post('/api/login', async (req, res) => {
  try {
    console.log('🔑 Login request:', req.body);
    
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Password are required!'
      });
    }

    // Read user data from file
    const userData = await readUserFile(userId);
    
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: 'User not found! Please register first.'
      });
    }

    // Check password - DIRECT COMPARE (NO ENCRYPTION)
    if (userData.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password! Please try again.'
      });
    }

    // Update login info
    userData.lastLogin = new Date();
    userData.loginCount = (userData.loginCount || 0) + 1;
    await writeUserFile(userId, userData);

    console.log(`✅ User "${userId}" logged in successfully!`);

    res.json({
      success: true,
      message: 'Login successful!',
      data: {
        userId: userData.userId,
        password: userData.password,  // 👈 Original password
        lastLogin: userData.lastLogin,
        loginCount: userData.loginCount,
        firstLogin: userData.firstLogin
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
    const users = await getAllUsers();
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
    const deleted = await deleteUserFile(userId);
    
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
app.get('/api/health', async (req, res) => {
  try {
    await ensureDataDir();
    res.json({
      status: 'OK',
      message: 'Server is running (Plain Text Passwords)',
      dataDir: DATA_DIR,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  await ensureDataDir();
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API URL: http://localhost:${PORT}/api`);
  console.log(`📁 Data directory: ${path.resolve(DATA_DIR)}`);
  console.log(`🔓 Passwords saved in ORIGINAL/PLAIN TEXT format`);
  console.log(`✅ Ready to handle login requests!`);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});