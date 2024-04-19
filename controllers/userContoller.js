const bcrypt = require("bcryptjs");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");
const pdfkit = require("pdfkit");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Subject = require("./../models/Subject");
const User = require("../models/user");
const Student = require("../models/students");
const { sendMail } = require("./../utils/sendemail");

exports.getStudents = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.myemail });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.role === "admin") {
      let students = await Student.find();
      for (let i = 0; i < students.length; i++) {
        let subjects = [];
        for (let j = 0; j < students[i].subjects.length; j++) {
          const subject = await Subject.findById(students[i].subjects[j]._id);
          if (subject) {
            const teacher = await User.findById(subject.teacher);
            if (teacher) {
              subjects.push({
                subject: subject.name,
                teacher: {
                  regno: teacher.regno,
                  email: teacher.email,
                  name: teacher.name,
                },
                attendance: students[i].subjects[j].attendance,
                totalattendance: students[i].subjects[j].totalattendance,
                marks: students[i].subjects[j].marks,
                totalmarks: students[i].subjects[j].totalmarks,
              });
            }
          }
        }

        students[i].subjects = subjects;
      }

      return res.status(200).json({ students });
    } else {
      return res
        .status(400)
        .json({ message: "you do not have access to this route" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

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

    const user = await User.findOne({ email: req.body.myemail });
    if (!user) {
      return res.status(401).json({ message: "no such user" });
    }
    const key = ec.keyFromPublic(user.publicKey, "hex");
    const validSignature = key.verify(message, signature);

    if (!validSignature) {
      return res.status(401).json({ message: "Invalid digital certificate" });
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
    const { regno, subjectName, studentsEnrollmentNumbers } = req.body;
    const teacher = await User.findOne({ regno });
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }
    const existingSubject = await Subject.findOne({
      name: subjectName,
      teacher: teacher._id,
    });

    if (existingSubject) {
      for (const enrollmentNumber of studentsEnrollmentNumbers) {
        const student = await Student.findOne({ enrollmentNumber });
        if (student && !existingSubject.students.includes(student._id)) {
          student.subjects.push(existingSubject._id);
          await student.save();
          existingSubject.students.push(student._id);
        }
      }
      await existingSubject.save();
    } else {
      const students = await Student.find({
        enrollmentNumber: { $in: studentsEnrollmentNumbers },
      });

      const subject = new Subject({
        name: subjectName,
        teacher: teacher._id,
        students: students.map((student) => student._id),
      });

      await subject.save();

      for (const student of students) {
        student.subjects.push(subject._id);
        await student.save();
      }

      teacher.subjectsTaught.push(subject._id);
      await teacher.save();
    }

    res.status(200).json({ message: "Subject allotted successfully" });
  } catch (error) {
    console.error("Error adding subject taught:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.check = async (req, res, next) => {
  try {
    const { myemail } = req.body;
    const user = await User.findOne({ email: myemail });
    if (myemail != req.body.pdf.email) {
      return res
        .status(403)
        .json({ error: "Do'nt use anyone elses digital certificate" });
    }
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.active) {
      next();
    } else {
      return res.status(403).json({
        error:
          "user is not active please activate your account by contacting admin",
      });
    }
  } catch (error) {
    console.error("Error checking password and login status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.check2 = async (req, res, next) => {
  try {
    const { myemail } = req.body;
    const user = await User.findOne({ email: myemail });
    if (myemail != req.body.pdf.email) {
      return res
        .status(403)
        .json({ error: "Do'nt use anyone elses digital certificate" });
    }
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    next();
  } catch (error) {
    console.error("Error checking password and login status:", error);
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
    const { myemail, password } = req.body;

    const user = await User.findOne({ email: myemail });
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

      const encryptedPrivateKey = encryptData(privateKey, encryptionKey, iv);
      await User.updateOne(
        { email: myemail },
        { encKey: encryptionKey, publicKey, iv, firstLogin: false }
      );

      return res.status(200).json({
        encryptedPrivateKey,
        name: user.name,
        email: myemail,
      });
    } else {
      if (!user.passwordChanged) {
        return res.status(401).json({
          message: "Please change your password",
          changePasswordUrl: "/api/teacher/change-password",
        });
      }
      if (user.active == false) {
        return res.status(401).json({
          message:
            "your account has been deactivated, Please contact admin for help",
        });
      }
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      return res
        .status(200)
        .json({ message: "Login successful", email: user.email, token });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
exports.authjwt = (req, res, next) => {
  const token = req.body.token;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Authentication token is required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ err, message: "Invalid or expired token" });
    }

    req.body.myemail = decoded.email;
    next();
  });
};
exports.changePassword = async (req, res) => {
  try {
    const { myemail, oldPassword, newPassword, signature, message } = req.body;
    const user = await User.findOne({ email: myemail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Old password does not match" });
    }
    const key = ec.keyFromPublic(user.publicKey, "hex");
    const validSignature = key.verify(message, signature);

    if (!validSignature) {
      user.active = false;
      await user.save();
      await sendMail({
        to: myemail,
        subject: "YOUR PASSWORD HAS BEEN BREACHED",
        text: `Someone tried to log into your account with correct email and password but wrong digital certificate thus your account has been deactivated to activate it change your password`,
      });
      return res.status(401).json({ message: "Invalid signature" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.passwordChanged = true;
    user.active = true;
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
    const decryptedKey = decryptdata(encprivateKey, user.encKey, user.iv);
    req.body.privateKey = decryptedKey;
    next();
  } catch (error) {
    req.body.privateKey = "a12";
    next();
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
    const user = await User.findOne({ email: req.body.myemail });
    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "You don't have access to this resource" });
    }
    const teachers = await User.find({ role: "teacher" });

    const populatedTeachers = await Promise.all(
      teachers.map(async (teacher) => {
        const subjectsTaught = await Subject.find({ teacher: teacher._id });
        const populatedSubjects = await Promise.all(
          subjectsTaught.map(async (subject) => {
            const populatedStudents = await Promise.all(
              subject.students.map(async (studentId) => {
                const student = await Student.findById(studentId);
                const { name, enrollmentNumber } = student.toObject();
                return { name, enrollmentNumber };
              })
            );
            return { name: subject.name, students: populatedStudents };
          })
        );
        return {
          name: teacher.name,
          email: teacher.email,
          regno: teacher.regno,
          active: teacher.active,
          subjectsTaught: populatedSubjects,
        };
      })
    );

    res.status(200).json({ teachers: populatedTeachers });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.getSubjects = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.myemail });
    let subjects = [];
    let subjectsWithPopulatedStudents = [];

    if (user.role === "admin") {
      subjects = await Subject.find();
    } else {
      subjects = await Subject.find({ teacher: user._id });
    }
    for (let i = 0; i < subjects.length; i++) {
      const teacher = await User.findById(subjects[i].teacher);
      if (teacher) {
        let students = [];
        for (let j = 0; j < subjects[i].students.length; j++) {
          const student = await Student.findById(subjects[i].students[j]);
          if (student) {
            const subjectDetails = student.subjects.find(
              (subject) => String(subject._id) === String(subjects[i]._id)
            );
            if (subjectDetails) {
              students.push({
                name: student.name,
                enrollmentNumber: student.enrollmentNumber,
                attendance: subjectDetails.attendance,
                totalAttendance: subjectDetails.totalattendance,
                marks: subjectDetails.marks,
                totalMarks: subjectDetails.totalmarks,
              });
            }
          }
        }

        subjectsWithPopulatedStudents.push({
          _id: subjects[i]._id,
          name: subjects[i].name,
          teacher: {
            regno: teacher.regno,
            email: teacher.email,
            name: teacher.name,
          },
          students: students,
        });
      }
    }

    res.json({ subjects: subjectsWithPopulatedStudents });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
