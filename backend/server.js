
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
const mongoose = require("mongoose");
require("dotenv").config();

// Check required environment variables
if (!process.env.MONGO_URI || !process.env.PINATA_JWT) {
  console.error("Missing MONGO_URI or PINATA_JWT environment variable");
  process.exit(1);
}

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((error) =>
    console.error("MongoDB connection error:", error)
  );

const AccessLog = require("./AccessLog");
const File = require("./File");
const app = express();

// Restrict CORS to the frontend and local development
const allowedOrigins = [
  "https://blockchain-image-storage.vercel.app",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
  })
);

app.use(express.json());

// Validation helpers
const isWalletAddress = (address) =>
  typeof address === "string" &&
  /^0x[a-fA-F0-9]{40}$/.test(address);

const isValidFileHash = (hash) =>
  typeof hash === "string" &&
  /^ipfs:\/\/[A-Za-z0-9]+$/.test(hash);

// Allowed file MIME types
const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
];

// Upload limits: maximum 10 MB and one file
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      return callback(null, true);
    }

    callback(new Error("Unsupported file type"));
  },
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
        success: false,
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
        timeout: 60000,
      }
    );

    res.json({
      success: true,
      IpfsHash: response.data.IpfsHash,
    });
  } catch (error) {
    console.error(
      "Pinata upload error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      success: false,
      error: "Failed to upload file to Pinata",
    });
  }
});

// Save file metadata
app.post("/api/files", async (req, res) => {
  try {
    const { fileName, fileHash, owner, fileSize, fileType, encrypted } = req.body;

    // Validate file metadata
    if (
      typeof fileName !== "string" ||
      !fileName.trim() ||
      fileName.length > 255 ||
      !isValidFileHash(fileHash) ||
      !isWalletAddress(owner) ||
      !Number.isSafeInteger(fileSize) ||
      fileSize < 0 ||
      fileSize > 10 * 1024 * 1024 ||
      typeof fileType !== "string" ||
      !allowedMimeTypes.includes(fileType)
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid file name, IPFS hash, wallet address, size, or type",
      });
    }

    const file = new File({
  fileName: fileName.trim(),
  fileHash,
  owner,
  fileSize,
  fileType,
  encrypted: encrypted === true,
});

    await file.save();

    res.status(201).json({
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

// Get file metadata
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

    // Validate access-log details
    if (
      typeof fileName !== "string" ||
      !fileName.trim() ||
      fileName.length > 255 ||
      !isValidFileHash(fileHash) ||
      !isWalletAddress(owner) ||
      !isWalletAddress(accessedBy)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid access-log details",
      });
    }

    // Confirm the file belongs to the specified owner
    const file = await File.findOne({ fileHash, owner });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: "File not found for this owner",
      });
    }

    const log = new AccessLog({
      fileName: fileName.trim(),
      fileHash,
      owner,
      accessedBy,
    });

    await log.save();

    res.status(201).json({
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
    // Validate owner address
    if (!isWalletAddress(req.params.owner)) {
      return res.status(400).json({
        success: false,
        error: "Invalid wallet address",
      });
    }

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

// Handle upload and request errors
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "File size must not exceed 10 MB"
        : "File upload limit exceeded";

    return res.status(400).json({
      success: false,
      error: message,
    });
  }

  if (error.message === "Unsupported file type") {
    return res.status(400).json({
      success: false,
      error: "Unsupported file type",
    });
  }

  if (error.message === "Origin not allowed by CORS") {
    return res.status(403).json({
      success: false,
      error: "Origin not allowed by CORS",
    });
  }

  console.error("Unhandled server error:", error);

  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
