const bcrypt = require("bcryptjs");
const EC = require("elliptic");
const User = require("../models/user");
const { sendMail } = require("./../utils/sendemail");

exports.eccAuthMiddleware = async (req, res, next) => {
  try {
    const { signature, message } = req.body;

    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }
    const ec = new EC.ec("secp256k1");
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

exports.addTeacher = async (req, res) => {
  try {
    // console.log(EC);
    const { name, email, role = "teacher" } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const ec = new EC.ec("secp256k1");
    const keyPair = ec.genKeyPair();
    const publicKey = keyPair.getPublic("hex");
    const privateKey = keyPair.getPrivate("hex"); // Storing or handling private keys needs caution

    // console.log(publicKey, privateKey);
    const initialPassword = Math.random().toString(36).substring(2, 10);
    const hashedPassword = await bcrypt.hash(initialPassword, 12);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      publicKey,
      firstLogin: true,
    });
    //console.log(email);
    await sendMail({
      to: email,
      subject: "Welcome to DocShield - Your Credentials",
      text: `Welcome to DocShield!\n\nYour initial password is: ${initialPassword}\n\nPlease keep your credentials safe and change your password upon first login.\n\nYour Private Key (keep this secure): ${privateKey}`,
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
      },
      initialPassword,
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

    const ec = new EC.ec("secp256k1");
    const keyPair = ec.keyFromPrivate(req.body.privateKey);

    const signatureObject = keyPair.sign(req.body.message);
    const signature = signatureObject.toDER("hex");

    req.body.signature = signature;

    delete req.body.privateKey;

    next();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to sign the request", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, signature, message } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const ec = new EC.ec("secp256k1");
    const key = ec.keyFromPublic(user.publicKey, "hex");
    const validSignature = key.verify(message, signature);

    if (!validSignature) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    if (user.firstLogin) {
      return res.status(200).json({
        message: "Please change your password at /teacher/chagne-Password",
        firstLogin: true,
      });
    } else {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Password incorrect" });
      }
      return res
        .status(200)
        .json({ message: "Login successful", firstLogin: false });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    console.log(req.body);
    const { email, oldPassword, newPassword, signature, message } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const ec = new EC.ec("secp256k1");
    const key = ec.keyFromPublic(user.publicKey, "hex");
    const validSignature = key.verify(message, signature);

    if (!validSignature) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Old password does not match" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.firstLogin = false;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
