const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

const crypto = require("crypto");

function encryptData(data) {
  const symmetricKey = crypto.randomBytes(32); // AES-256 key
  const iv = crypto.randomBytes(16); // Initialization vector
  const cipher = crypto.createCipheriv("aes-256-cbc", symmetricKey, iv);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  return { encryptedData: encrypted, symmetricKey, iv };
}

function encryptSymmetricKey(symmetricKey, teacherPublicKey) {
  const encryptedKey = crypto.publicEncrypt(teacherPublicKey, symmetricKey);
  return encryptedKey.toString("base64");
}

function decryptWithPrivateKey(privekey, message) {}

function verifySignature(message, digest, privkey) {
  return privkey.verify(message, signature);
}

module.exports = { encryptWithPublicKey, verifySignature };
