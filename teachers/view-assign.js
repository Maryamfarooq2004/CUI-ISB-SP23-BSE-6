// view-assign.js
const express = require("express");
const router = express.Router();
const Assignment = require("../models/Assignment");
const Class = require("../models/Class");

// Middleware to allow only teachers
function teacherAuth(req, res, next) {
  if (!req.user || req.user.role !== "teacher") {
    return res.status(403).json({ message: "Access denied. Teacher only." });
  }
  next();
}

// GET /teacher/viewattassign
// Lists assignments with student submissions for classes assigned to the teacher
router.get("/viewattassign", teacherAuth, async (req, res) => {
  try {
    const teacherId = req.user._id;

    // 1. Find all classes assigned to this teacher
    const classes = await Class.find({ teacher: teacherId }).select("_id classname");

    if (!classes.length) {
      return res.status(404).json({ message: "No classes assigned to you." });
    }

    const classIds = classes.map((c) => c._id);

    // 2. Find all assignments for those classes
    const assignments = await Assignment.find({ classId: { $in: classIds } })
      .populate("submissions.studentId", "name email") // populate student info
      .populate("classId", "classname"); // populate class info

    res.json({
      teacher: req.user.name,
      totalAssignments: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
