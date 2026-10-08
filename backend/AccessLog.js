const mongoose = require("mongoose");

const accessLogSchema = new mongoose.Schema({
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
  accessedBy: {
    type: String,
    required: true,
  },
  accessedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("AccessLog", accessLogSchema);