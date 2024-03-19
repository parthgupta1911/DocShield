const bcrypt = require("bcryptjs");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");
const User = require("./../models/user"); // Adjust the path according to your project structure
const Document = require("./../models/document");
const cryptoUtils = require("./../utils/cryptoUtils"); // Ensure this module is implemented

exports.addDocument = async (req, res) => {
  try {
    const {
      email,
      password,
      documentName,
      message,
      privateKey,
      documentType,
      signature,
    } = req.body;

    const teacher = await User.findOne({ email: email });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    if (teacher.role !== "teacher") {
      return res
        .status(403)
        .json({ message: "Access denied. User is not a teacher." });
    }

    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Password incorrect" });
    }

    const key = ec.keyFromPublic(teacher.publicKey, "hex");
    const validSignature = key.verify(message, signature);

    if (!validSignature) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    const encryptedobj = cryptoUtils.encrypt(message, privateKey);
    const encryptedData = encryptedobj.encryptedData;

    const newDocument = new Document({
      teacherId: teacher._id,
      documentName,
      encryptedData,
      documentType,
    });
    await newDocument.save();

    res.status(201).json({
      message: "Document uploaded successfully",
      documentId: newDocument._id,
    });
  } catch (error) {
    console.error("Error in uploading document:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
