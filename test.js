const crypto = require("crypto");

// Function to encrypt data
function encrypt(data, key) {
  const iv = crypto.randomBytes(16); // Initialization vector
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  return { iv: iv.toString("hex"), encryptedData: encrypted };
}

// Function to decrypt data
function decrypt(encryptedData, iv, key) {
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    key,
    Buffer.from(iv, "hex")
  );
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// Example usage
const originalMessage = "Hello, world!";
const key = crypto.randomBytes(32); // Generate a random key

const encrypted = encrypt(originalMessage, key);
console.log("Encrypted:", encrypted);

// Use a wrong key for decryption
const wrongKey = crypto.randomBytes(32);
const decryptedWithWrongKey = decrypt(
  encrypted.encryptedData,
  encrypted.iv,
  wrongKey
);
console.log("Decrypted with wrong key:", decryptedWithWrongKey);
