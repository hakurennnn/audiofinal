//server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json());

// Configure multer for local storage
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const uniqueFilename = `${file.originalname}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({ storage: storage });

// Route for uploading files
app.post('/api/upload', upload.single('audio'), (req, res) => {
  if (req.file) {
    console.log('File Uploaded:', req.file.filename);
    res.json({ message: 'File uploaded successfully', file: req.file.filename });
  } else {
    res.status(400).send('File upload failed');
  }
});

// Route to access the uploaded file
app.get('/files/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

app.get('/', (req, res) => {
  res.send('Welcome to the File Upload Service');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

