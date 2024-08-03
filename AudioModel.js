//AudioModel.js
const mongoose = require('mongoose');

const AudioSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  classification: {
    type: String,
    required: false
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number,
    required: false
  },
  metadata: {
    type: Map,
    of: String,
    required: false
  },
  uploadedBy: {
    type: String,
    required: false
  }
  // Add any other fields that are relevant to your application
});

module.exports = mongoose.model('Audio', AudioSchema);

