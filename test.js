const crypto = require("crypto");

// Example ECC public key in PEM format
const publicKey = `-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----`;

const data = "Small piece of data";

// Encrypting the data with the public key
const encryptedData = crypto.publicEncrypt(
  publicKey,

  data
);

console.log("Encrypted Data:", encryptedData.toString("base64"));
