const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

app.use(express.static(path.join(__dirname, 'templates')));


// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// Serve static files from uploads
app.use('/uploads', express.static(uploadDir));

// Serve the HTML form
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '/templates/index.html'));
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniquePrefix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Single route to handle file upload and compression
app.post('/upload', upload.single('uploaded_file'), (req, res) => {
  if (req.file) {
    const inputPath = req.file.path;
    const outputPath = path.join(uploadDir, 'compressed-' + req.file.filename);

    // Compress the image using sharp
    sharp(inputPath)
      .resize(800) // Resize image to a width of 800 pixels
      .toFormat('jpeg', { quality: 80 }) // Compress to 80% quality
      .toFile(outputPath, (err, info) => {
        if (err) {
          console.error('Error compressing image:', err);
          return res.status(500).send('Error compressing image.');
        }

        // Optionally delete the original file after compression
        // fs.unlink(inputPath, (err) => {
        //   if (err) console.error('Error deleting original file:', err);
        // });

        res.json({
            success: true,
            downloadUrl: `/uploads/${path.basename(outputPath)}`
          });      });
  } else {
    res.send('File upload failed.');
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
