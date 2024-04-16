const bcrypt = require("bcryptjs");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");
const User = require("../models/user");
const { sendMail } = require("./../utils/sendemail");
const Student = require("../models/students");
const pdfkit = require("pdfkit");
const crypto = require("crypto");

exports.createMultipleStudents = async (req, res, next) => {
  try {
    const students = req.body.students;
    if (!students || !Array.isArray(students)) {
      return res.status(400).json({ error: "Invalid request format" });
    }
    const lastStudent = await Student.findOne(
      {},
      {},
      { sort: { enrollmentNumber: -1 } }
    );

    let enrollmentNumber = 1;

    if (lastStudent && lastStudent.enrollmentNumber) {
      enrollmentNumber = parseInt(lastStudent.enrollmentNumber) + 1;
    }

    for (let student of students) {
      student.enrollmentNumber = enrollmentNumber.toString();
      enrollmentNumber++;
    }

    await Student.create(students);

    res.status(201).json({ message: "Students created successfully" });
  } catch (error) {
    console.error("Error creating students:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.eccadmin = async (req, res, next) => {
  try {
    const { signature, message } = req.body;

    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }
    const key = ec.keyFromPublic(admin.publicKey, "hex");
    const validSignature = key.verify(message, signature);

    if (!validSignature) {
      return res.status(401).json({ message: "Invalid digital signature" });
    }
    next();
  } catch (error) {
    res
      .status(401)
      .json({ message: "Authentication failed", error: error.message });
  }
};
exports.eccuser = async (req, res, next) => {
  try {
    const { signature, message } = req.body;

    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(401).json({ message: "no such user" });
    }
    const key = ec.keyFromPublic(user.publicKey, "hex");
    const validSignature = key.verify(message, signature);

    if (!validSignature) {
      return res.status(401).json({ message: "Invalid digital signature" });
    }
    next();
  } catch (error) {
    res
      .status(401)
      .json({ message: "Authentication failed", error: error.message });
  }
};
exports.addsubj = async (req, res) => {
  try {
    const { teacherEmail, subjectName, studentsEnrollmentNumbers } = req.body;
    const teacher = await User.findOne({ email: teacherEmail });

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }
    const students = await Student.find({
      enrollmentNumber: { $in: studentsEnrollmentNumbers },
    });
    if (students.length !== studentsEnrollmentNumbers.length) {
      return res.status(404).json({ error: "One or more students not found" });
    }
    const subjectObject = {
      name: subjectName,
      students: students.map((student) => student._id),
    };
    teacher.subjectsTaught.push(subjectObject);
    await teacher.save();
    res.status(200).json({ message: "Subject taught added successfully" });
  } catch (error) {
    console.error("Error adding subject taught:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.addTeacher = async (req, res) => {
  try {
    const { name, email, role = "teacher" } = req.body;
    const lastUser = await User.findOne({}, {}, { sort: { regno: -1 } });
    let regno = 1;
    if (lastUser && lastUser.regno) {
      regno = lastUser.regno + 1;
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    const initialPassword = Math.random().toString(36).substring(2, 10);
    console.log(initialPassword);
    const hashedPassword = await bcrypt.hash(initialPassword, 12);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      firstLogin: true,
      regno,
    });
    await sendMail({
      to: email,
      subject: "Welcome to DocShield - Your Credentials",
      text: `Welcome to DocShield!\n\nYour initial password is: ${initialPassword}\n\nPlease keep your credentials safe and change your password upon first login.\n\nYou can download your digital certificate after it`,
    });
    await newUser.save();

    res.status(201).json({
      message: "Teacher added successfully",
      user: {
        id: newUser._id,
        name,
        email,
        role,
        firstLogin: newUser.firstLogin,
        regno, // Include the registration number in the response
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to add teacher", error: error.message });
  }
};

exports.signRequestMiddleware = (req, res, next) => {
  try {
    if (!req.body.privateKey || !req.body.message) {
      return res
        .status(400)
        .json({ message: "Missing privateKey or message in the request body" });
    }

    const keyPair = ec.keyFromPrivate(req.body.privateKey);
    const signatureObject = keyPair.sign(req.body.message);
    const signature = signatureObject.toDER("hex");
    req.body.signature = signature;
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to sign the request", error: error.message });
  }
};
function encryptData(data, key, iv) {
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  return Buffer.from(
    cipher.update(data, "utf8", "hex") + cipher.final("hex")
  ).toString("base64"); // Encrypts data and converts to hex and base64
}
function decryptdata(encryptedData, key, iv) {
  const buff = Buffer.from(encryptedData, "base64");
  encryptedData = buff.toString("utf-8");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  return decipher.update(encryptedData, "hex", "utf8") + decipher.final("utf8");
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Password incorrect" });
    }

    if (user.firstLogin) {
      const keyPair = ec.genKeyPair();
      const publicKey = keyPair.getPublic("hex");
      const privateKey = keyPair.getPrivate("hex");
      let encryptionKey = crypto
        .createHash("sha512")
        .update(privateKey)
        .digest("hex")
        .substring(0, 32);
      const iv = crypto
        .createHash("sha512")
        .update(privateKey)
        .digest("hex")
        .substring(0, 16);
      console.log(privateKey + "\n");
      const encryptedPrivateKey = encryptData(privateKey, encryptionKey, iv);
      await User.updateOne(
        { email },
        { encKey: encryptionKey, publicKey, iv, firstLogin: false }
      );

      const pdfBuffer = await generateCertificatePdf(
        user.name,
        user.email,
        encryptedPrivateKey
      );
      res.setHeader("Content-Type", "application/pdf");
      res.send(pdfBuffer);

      return;
    } else {
      if (!user.passwordChanged) {
        return res.status(401).json({
          message: "Please change your password",
          changePasswordUrl: "/api/teacher/change-password",
        });
      }
      return res
        .status(200)
        .json({ message: "Login successful", id: user._id });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
exports.changePassword = async (req, res) => {
  try {
    const { email, oldPassword, newPassword, signature, message } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const key = ec.keyFromPublic(user.publicKey, "hex");
    const validSignature = key.verify(message, signature);
    if (!validSignature) {
      return res.status(401).json({ message: "Invalid signature" });
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Old password does not match" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.passwordChanged = true;
    await user.save();
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.extract = async (req, res, next) => {
  try {
    const { email, encprivateKey } = req.body.pdf;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "User not found with provided email" });
    }
    // console.log(user.encKey, user.iv);
    const decryptedKey = decryptdata(encprivateKey, user.encKey, user.iv);
    req.body.privateKey = decryptedKey;
    // console.log(req.body.privateKey);
    next();
  } catch (error) {
    return res.status(400).json({ message: "Invalid digital certificate" });
  }
};
async function generateCertificatePdf(name, email, encryptedPrivateKey) {
  return new Promise((resolve, reject) => {
    const doc = new pdfkit();
    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });

    // Write header and content
    doc.text("DocShield Digital Certificate", {
      align: "center",
      fontSize: 20,
    });
    doc.moveDown();
    doc.text(`Name: ${name}`, { align: "center" });
    doc.text(`Email: ${email}`, { align: "center" });
    doc.moveDown();
    doc.text("This digital certificate signifies it.", { align: "center" });
    doc.moveDown();

    // console.log(name, email, privateKey, encryptedPrivateKey);
    doc.text("Your encrypted private key:", { align: "center" });
    doc.moveDown();
    doc.text(encryptedPrivateKey, { align: "center" });

    doc.end();
  });
}
exports.getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: "teacher" });
    res.status(200).json({ teachers });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
