// index.js
import express from 'express';
import puppeteer from 'puppeteer';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const port = 4000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());


// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directory where files will be stored
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Initialize multer with storage configuration
const upload = multer({ storage: storage });

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.resolve('uploads')));

// Define the endpoint to receive and convert HTML to PDF
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      status: false,
      message: 'No file uploaded',
      data: {}
    });
  }

  // Define paths for uploaded HTML and output PDF
  const htmlFilePath = path.join('uploads', req.file.filename);
  const pdfFileName = `${Date.now()}-${req.file.originalname.replace('.html', '')}.pdf`;
  const pdfFilePath = path.join('uploads', pdfFileName);

  try {
    // Launch Puppeteer, open HTML file, and generate PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`file://${path.resolve(htmlFilePath)}`, { waitUntil: 'networkidle0' });
    await page.pdf({ path: pdfFilePath, format: 'A4' });
    await browser.close();

    // Respond with success message and PDF path
    res.status(200).json({
      status: true,
      message: 'HTML converted to PDF successfully',
      data: {
        pdfFile: pdfFilePath
      }
    });

    // Optional: delete the HTML file after conversion if no longer needed
    fs.unlink(htmlFilePath, (err) => {
      if (err) console.error('Error deleting HTML file:', err);
    });

  } catch (error) {
    console.error('Error during HTML to PDF conversion:', error);
    res.status(500).json({
      status: false,
      message: 'Error converting HTML to PDF',
      data: { error: error.message }
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});