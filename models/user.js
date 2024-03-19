const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    unique: [true, "email already in use"],
    lowercase: true,
    required: [true, "must have email"],
  },
  photo: {
    type: String,
    default: "default.jpg",
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["teacher", "admin"],
    required: true,
  },
  publicKey: {
    type: String,
    required: true,
    trim: true,
  },
  firstLogin: {
    type: Boolean,
    default: true, // Default value set to true for first login
  },
});
//userSchema.index({ verified: 1, verificationCodeExpires: 1 });

const User = mongoose.model("Users", userSchema);

module.exports = User;
