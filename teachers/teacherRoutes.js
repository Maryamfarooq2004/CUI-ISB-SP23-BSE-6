const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');

// POST route to add a new assignment
router.post('/addassign', async (req, res) => {
  try {
    const { classId, description, fileUrl } = req.body;

    // Validate required fields
    if (!classId || !description || !fileUrl) {
      return res.status(400).json({
        error: 'Missing required fields: classId, description, and fileUrl are required'
      });
    }

    // Create and save the assignment
    const newAssignment = new Assignment({
      classId,
      description,
      fileUrl
    });

    const savedAssignment = await newAssignment.save();

    return res.status(201).json({
      message: 'Assignment created successfully',
      assignment: savedAssignment
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    return res.status(500).json({
      error: 'Server error occurred while creating assignment'
    });
  }
});

module.exports = router;
