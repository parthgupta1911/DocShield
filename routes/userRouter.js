const express = require("express");
const userController = require("./../controllers/userContoller");

const router = express.Router();

router.post(
  "/",
  userController.signRequestMiddleware,
  userController.eccAuthMiddleware,
  userController.addTeacher
);
router.post(
  "/login",
  userController.signRequestMiddleware,
  userController.login
);
router.post(
  "/change-password",
  userController.signRequestMiddleware,
  userController.changePassword
);
module.exports = router;
