const express = require("express");
const userController = require("./../controllers/userContoller");
const router = express.Router();

router.post(
  "/add",
  userController.authjwt,
  userController.check,
  userController.extract,
  userController.signRequestMiddleware,
  userController.eccadmin,
  userController.addTeacher
);
router.post("/login", userController.login);
// router.post("/admin", userController.addTeacher);
router.post(
  "/change-password",
  userController.check2,
  userController.extract,
  userController.signRequestMiddleware,
  userController.changePassword
);
router.post(
  "/students",
  userController.authjwt,
  userController.check,
  userController.extract,
  userController.signRequestMiddleware,
  userController.eccadmin,
  userController.createMultipleStudents
);
router.post(
  "/subject",
  userController.authjwt,
  userController.check,
  userController.extract,
  userController.signRequestMiddleware,
  userController.eccadmin,
  userController.addsubj
);
router.get("/", userController.authjwt, userController.getTeachers);
router.get("/students", userController.authjwt, userController.getStudents);
router.get("/subjects", userController.authjwt, userController.getSubjects);
module.exports = router;
