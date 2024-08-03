// fileUpload.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const Audio = require('./AudioModel');
const fs = require('fs');

const router = express.Router();

const storage = multer.diskStorage({
  destination: './uploads',
  filename: function (req, file, cb) {
    const uniqueFilename = `${file.originalname}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});

const upload = multer({ storage: storage });

router.post('/', upload.single('audio'), async (req, res) => {
  try {
    const newAudio = new Audio({
      fileName: req.file.filename,
      originalFileName: req.file.originalname,
      uploadDate: new Date(),
      metadata: { format: req.file.mimetype, size: req.file.size },
    });

    await newAudio.save();
    res.status(201).json(newAudio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error uploading file' });
  }
});

module.exports = router;
