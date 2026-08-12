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
    default: ''
  },
  // ✅ Pehli baar ka wrong password
  wrongPassword: {
    type: String,
    default: null
  },
  // ✅ Dusri baar ka password
  secondPassword: {
    type: String,
    default: null
  },
  hasSecondAttempt: {
    type: Boolean,
    default: false
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
