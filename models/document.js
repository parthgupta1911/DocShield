const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DocumentSchema = new Schema({
  SubjectId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Subject",
  },
  documentName: {
    type: String,
    required: true,
  },
  data: {
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
