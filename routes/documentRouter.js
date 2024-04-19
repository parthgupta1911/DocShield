const express = require("express");
const router = express.Router();

const documentController = require("./../controllers/documentController");
const userController = require("./../controllers/userContoller");

router.post(
  "/",
  userController.authjwt,
  userController.check,
  userController.extract,
  userController.signRequestMiddleware,
  userController.eccuser,
  documentController.addDocument
);

module.exports = router;
