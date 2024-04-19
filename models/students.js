const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  enrollmentNumber: {
    type: String,
    required: true,
  },
  subjects: [
    {
      subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
      attendance: {
        type: Number,
        default: 0,
      },
      totalattendance: {
        type: Number,
        default: 0,
      },
      marks: {
        type: Number,
        default: 0,
      },
      totalmarks: {
        type: Number,
        default: 0,
      },
    },
  ],
});

// Model for Students
const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
