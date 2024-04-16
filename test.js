const fs = require("fs");
const pdf = require("pdf-parse");

// Read the PDF file
const pdfBuffer = fs.readFileSync("./test2.pdf");

// Parse the PDF content
pdf(pdfBuffer)
  .then((data) => {
    // Extracted text from PDF
    console.log(data.text);
  })
  .catch((error) => {
    // Handle error
    console.error("Error:", error);
  });
