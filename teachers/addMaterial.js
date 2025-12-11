// teacher/addmat

const express = require("express");
const router = express.Router();
const Material = require("../models/Material");    
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/materials");  
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

function teacherAuth(req, res, next) {
  if (!req.user || req.user.role !== "teacher") {
    return res.status(403).json({ message: "Access denied. Teacher only." });
  }
  next();
}

router.post("/addmat", teacherAuth, upload.single("file"), async (req, res) => {
  try {
    const { title, classId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    if (!title || !classId) {
      return res.status(400).json({ message: "title and classId are required" });
    }

    const fileUrl = `/uploads/materials/${req.file.filename}`;

    const material = await Material.create({
      title,
      classId,
      fileUrl,
      uploadedBy: req.user._id,       
      createdAt: new Date()
    });

    return res.status(201).json({
      message: "Material uploaded successfully",
      material
    });
  } catch (error) {
    console.error("Error uploading material:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
