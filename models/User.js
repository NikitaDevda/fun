// const mongoose = require('mongoose');

// const UserSchema = new mongoose.Schema({
//   userId: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true
//   },
//   password: {
//     type: String,
//     required: true
//   },
//   firstLogin: {
//     type: Date,
//     default: Date.now
//   },
//   lastLogin: {
//     type: Date,
//     default: Date.now
//   },
//   loginCount: {
//     type: Number,
//     default: 0
//   }
// }, {
//   timestamps: true
// });

// // Prevent model recompilation error in serverless environment
// module.exports = mongoose.models.User || mongoose.model('User', UserSchema);









const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  firstLogin: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  loginCount: {
    type: Number,
    default: 0
  },
  // ✅ Wrong attempts track karne ke liye
  wrongAttempts: {
    type: Number,
    default: 0
  },
  lastWrongAttempt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);

