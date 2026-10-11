
const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
  },
  fileHash: {
    type: String,
    required: true,
  },
  owner: {
    type: String,
    required: true,
  },

  // ADDED: Store file size in bytes
  fileSize: {
    type: Number,
    default: null,
  },

  // ADDED: Store file MIME type
  fileType: {
    type: String,
    default: "",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("File", fileSchema);
