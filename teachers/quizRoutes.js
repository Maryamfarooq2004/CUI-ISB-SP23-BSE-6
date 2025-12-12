const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');

// POST route to add a new quiz
router.post('/addquiz', async (req, res) => {
  try {
    // Destructure classId, title, and questions from req.body
    const { classId, title, questions } = req.body;

    // Validate that these fields exist
    if (!classId || !title || !questions) {
      return res.status(400).json({ 
        error: 'Missing required fields: classId, title, and questions are required' 
      });
    }

    // Create a new Quiz instance with an empty submissions array
    const newQuiz = new Quiz({
      classId,
      title,
      questions,
      submissions: [] // Initialize submissions as an empty array
    });

    // Save to the database
    const savedQuiz = await newQuiz.save();

    // Return the saved object
    return res.status(201).json({
      message: 'Quiz created successfully',
      quiz: savedQuiz
    });

  } catch (error) {
    // Error handling: Return 500 if server error
    console.error('Error creating quiz:', error);
    return res.status(500).json({ 
      error: 'Server error occurred while creating quiz' 
    });
  }
});

// DELETE route to delete a quiz by ID (SP23-BSE-037)
router.delete('/quiz/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate that the ID is a valid MongoDB ObjectId
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        error: 'Invalid quiz ID format' 
      });
    }

    // Find and delete the quiz by ID
    const deletedQuiz = await Quiz.findByIdAndDelete(id);

    // Check if quiz was found and deleted
    if (!deletedQuiz) {
      return res.status(404).json({ 
        error: 'Quiz not found' 
      });
    }

    // Return success response
    return res.status(200).json({
      message: 'Quiz deleted successfully',
      quiz: deletedQuiz
    });

  } catch (error) {
    console.error('Error deleting quiz:', error);
    return res.status(500).json({ 
      error: 'Server error occurred while deleting quiz' 
    });
  }
});

module.exports = router;
