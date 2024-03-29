const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the schema for encrypted documents
const DocumentSchema = new Schema({
  teacherId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Users",
  },
  documentName: {
    type: String,
    required: true,
  },
  encryptedData: {
    type: String,
    required: true,
  },
  documentType: {
    type: String,
    required: true,
    enum: ["marks", "attendance", "etc"], // Define acceptable types here
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Document", DocumentSchema);
