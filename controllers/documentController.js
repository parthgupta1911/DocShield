const User = require("./../models/user"); // Adjust the path according to your project structure
const Document = require("./../models/document");
const { encryptWithPublicKey } = require("./cryptoUtils"); // Ensure this module is implemented

exports.addDocument = {
  uploadDocument: async (req, res) => {
    try {
      const { userId, documentName, documentContent, signature } = req.body;

      const teacher = await User.findById(userId);
      if (!teacher || teacher.role !== "teacher") {
        return res.status(404).send("Teacher not found or invalid role");
      }
      const key = ec.keyFromPublic(teacher.publicKey, "hex");
      const validSignature = key.verify(message, signature);

      if (!validSignature) {
        return res.status(401).send("Invalid signature");
      }

      const encryptedData = encryptWithPublicKey(
        teacher.publicKey,
        documentContent
      );

      const newDocument = new Document({
        teacherId: userId,
        documentName,
        encryptedData,
      });
      await newDocument.save();

      res.status(201).send({
        message: "Document uploaded successfully",
        documentId: newDocument._id,
      });
    } catch (error) {
      console.error("Error in uploading document:", error);
      res.status(500).send("Internal server error");
    }
  },
};
