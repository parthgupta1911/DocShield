const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    required: true,
  },
  regno: {
    type: Number,
    unique: true,
    required: true,
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
    default: false,
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
    default: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
  subjectsTaught: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    },
  ],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
