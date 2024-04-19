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

module.exports = router;
