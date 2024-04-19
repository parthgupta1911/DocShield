const User = require("./../models/user");
const Subject = require("./../models/Subject");
const Document = require("./../models/document");
const Student = require("./../models/students");

exports.addDocument = async (req, res) => {
  try {
    const { SubjectId, documentName, documentType, data } = req.body;

    if (!SubjectId) {
      return res.status(400).json({ error: "SubjectId is required" });
    }

    const subject = await Subject.findById(SubjectId);
    const user = await User.findOne({ email: req.body.myemail });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    if (subject.teacher.toString() !== user._id.toString()) {
      return res.status(400).json({ error: "You do not teach the subject" });
    }

    if (documentType === "attendance") {
      if (typeof data !== "object" || data === null) {
        return res.status(400).json({ error: "Invalid data format" });
      }

      for (const enno in data) {
        const status = data[enno];
        const student = await Student.findOne({ enrollmentNumber: enno });

        if (!student) {
          continue;
        }
        for (let i = 0; i < student.subjects.length; i++) {
          if (student.subjects[i]._id.toString() == SubjectId) {
            if (status === "P") {
              student.subjects[i].attendance += 1;
            }
            student.subjects[i].totalattendance += 1;
          }
        }

        await student.save();
      }
    } else if (documentType === "marks") {
      for (const enno in data) {
        const marksData = data[enno];
        const student = await Student.findOne({ enrollmentNumber: enno });
        if (!student) {
          continue;
        }
        for (let i = 0; i < student.subjects.length; i++) {
          if (student.subjects[i]._id.toString() == SubjectId) {
            student.subjects[i].marks += marksData.marks;
            student.subjects[i].totalmarks += marksData.totalmarks;
          }
        }

        await student.save();
      }
    }

    const document = new Document({
      SubjectId,
      documentName,
      documentType,
      data: JSON.stringify(data),
    });

    await document.save();
    res
      .status(201)
      .json({ message: "Document created successfully", document });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error });
  }
};
