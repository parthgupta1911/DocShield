const express = require("express");
const router = express.Router();

const documentController = require("./../controllers/documentController");
const userContoller = require("./../controllers/userContoller");

router.post(
  "/",
  userContoller.signRequestMiddleware,

  documentController.addDocument
);

module.exports = router;
