const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
const mongoose = require("mongoose"); // MongoDB
require("dotenv").config();
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.error("MongoDB connection error:", error));

const AccessLog = require("./AccessLog"); // MongoDB access log
const File = require("./File");
const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
});

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Backend is running" });
});

// Upload file to Pinata
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded",
      });
    }

    const formData = new FormData();

    formData.append("file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      },
    );

    res.json({
      success: true,
      IpfsHash: response.data.IpfsHash,
    });
  } catch (error) {
    console.error(
      "Pinata upload error:",
      error.response?.data || error.message,
    );

    res.status(500).json({
      success: false,
      error: "Failed to upload file to Pinata",
    });
  }
});
app.post("/api/files", async (req, res) => {
  try {
    const { fileName, fileHash, owner } = req.body;

    const file = new File({
      fileName,
      fileHash,
      owner,
    });

    await file.save();

    res.json({
      success: true,
      message: "File details saved successfully",
    });
  } catch (error) {
    console.error("File save error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save file details",
    });
  }
});
app.get("/api/files/:fileHash", async (req, res) => {
  try {
    const file = await File.findOne({
      fileHash: req.params.fileHash,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: "File not found",
      });
    }

    res.json({
      success: true,
      file,
    });
  } catch (error) {
    console.error("File fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch file details",
    });
  }
});
// Save file access in MongoDB
app.post("/api/access-log", async (req, res) => {
  try {
    const { fileName, fileHash, owner, accessedBy } = req.body;

    const log = new AccessLog({
      fileName,
      fileHash,
      owner,
      accessedBy,
    });

    await log.save();

    res.json({
      success: true,
      message: "Access logged successfully",
    });
  } catch (error) {
    console.error("Access log error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save access log",
    });
  }
});
// Get access history for a file owner
app.get("/api/access-history/:owner", async (req, res) => {
  try {
    const logs = await AccessLog.find({
      owner: req.params.owner,
    }).sort({ accessedAt: -1 });

    res.json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error("Access history error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch access history",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
