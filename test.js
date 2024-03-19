const crypto = require("crypto");

function ensureKeyLength(secretKey) {
  if (secretKey.length > 32) {
    return secretKey.substr(0, 32);
  } else if (secretKey.length < 32) {
    return secretKey.padEnd(32, "0");
  }
  return secretKey;
}

function encrypt(text, secretKey) {
  try {
    const key = Buffer.from(ensureKeyLength(secretKey));
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    return {
      iv: iv.toString("hex"),
      encryptedData: encrypted,
    };
  } catch (error) {
    console.error("Encryption error:", error);
    throw error; // Rethrow or handle as needed
  }
}

function decrypt(encryptedObject, secretKey) {
  try {
    const key = Buffer.from(ensureKeyLength(secretKey));
    const iv = Buffer.from(encryptedObject.iv, "hex");

    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

    let decrypted = decipher.update(
      encryptedObject.encryptedData,
      "hex",
      "utf8"
    );
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw error; // Rethrow or handle as needed
  }
}

// Usage example
const secretKey = "your-secret-key-here";
const textToEncrypt = "Hello, World!";

try {
  const encrypted = encrypt(textToEncrypt, secretKey);
  console.log("Encrypted:", encrypted);

  const decrypted = decrypt(encrypted, secretKey);
  console.log("Decrypted:", decrypted);
} catch (error) {
  // Handle or log error
  console.error(error);
}
