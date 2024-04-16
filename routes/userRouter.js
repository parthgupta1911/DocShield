const express = require("express");
const userController = require("./../controllers/userContoller");
const User = require("./../models/user");
const router = express.Router();

router.post(
  "/add",
  userController.extract,
  userController.signRequestMiddleware,
  userController.eccadmin,
  userController.addTeacher
);
router.post("/login", userController.login);
// router.post("/admin", userController.addTeacher);
router.post(
  "/change-password",
  userController.extract,
  userController.signRequestMiddleware,
  userController.eccuser,
  userController.changePassword
);
router.post(
  "/students",
  userController.extract,
  userController.signRequestMiddleware,
  userController.eccadmin,
  userController.createMultipleStudents
);
router.post("/subject", userController.addsubj);
router.get("/teachers", userController.getTeachers);

module.exports = router;
