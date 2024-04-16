const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: [true, "email already in use"],
    lowercase: true,
    required: [true, "must have email"],
  },
  regno: {
    type: Number,
    unique: [true, "registration number already in use"],
    required: [true, "must have registration number"],
  },
  photo: {
    type: String,
    default: "default.jpg",
  },
  password: {
    type: String,
    required: true,
  },
  passwordChanged: {
    type: Boolean,
    default: false, // Default value set to false for passwordChanged
  },
  role: {
    type: String,
    enum: ["teacher", "admin"],
    required: true,
  },
  iv: {
    type: String,
    trim: true,
  },
  publicKey: {
    type: String,
    trim: true,
  },
  encKey: {
    type: String,
    trim: true,
  },
  firstLogin: {
    type: Boolean,
    default: true, // Default value set to true for first login
  },
  subjectsTaught: [
    {
      name: {
        type: String,
        required: true,
      },
      students: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
        },
      ],
    },
  ],
});
//userSchema.index({ verified: 1, verificationCodeExpires: 1 });

const User = mongoose.model("Users", userSchema);

module.exports = User;
