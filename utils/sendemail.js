const fs = require("fs");
const { promisify } = require("util");
const bcrypt = require("bcrypt");
const pdfkit = require("pdfkit");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const mailerConfig = {
  service: "gmail",
  auth: {
    user: "propslux@gmail.com",
    pass: process.env.MAILPASS,
  },
};

const transporter = nodemailer.createTransport(mailerConfig);

const sendMail = async ({ to, subject, text }) => {
  const mailOptions = {
    from: "propslux@gmail.com",
    to,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Failed to send email:", error);
  }
};

module.exports = { sendMail };
