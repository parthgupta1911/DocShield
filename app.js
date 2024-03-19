const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const userRouter = require("./routes/userRouter");

app.use(express.json());
require("dotenv").config();

const uri = process.env.URI.replace("<password>", process.env.PASSWORD);

mongoose.connect(uri).then(() => {
  console.log(`connected to the database`);
});
app.use("/api/teacher", userRouter);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
app.use((req, res) => {
  res
    .status(404)
    .json({ error: "Not Found", message: "This route does not exist." });
});
