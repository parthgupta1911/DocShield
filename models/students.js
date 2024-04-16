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
  semesters: [
    {
      semesterNumber: {
        type: Number,
        required: true,
      },
      subjects: [
        {
          name: {
            type: String,
            required: true,
          },
          teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Reference to the User model
          },
          attendance: {
            type: Number,
            default: 0,
          },
          marks: {
            type: Number,
            default: 0,
          },
        },
      ],
    },
  ],
});

// Model for Students
const Student = mongoose.model("Students", studentSchema);

module.exports = Student;
