Teacher routes must be here by Muhammad Dawood Iqbal -SP23-BSE-032
// MUHAMMAD DAWOOD IQBAL -SP23-BSE-032 - Teacher Dashboard Route
const express = require('express');
const router = express.Router();

// Import models (assumes ../models exports Class, Quiz, Assignment)
const { Class, Quiz, Assignment } = require('../models');

// Teacher dashboard - GET /
// Returns classes assigned to the teacher, quizzes and assignments for those classes
router.get('/', async (req, res) => {
	try {
		const teacherId = req.user && req.user._id;
		if (!teacherId) {
			return res.status(401).json({ success: false, message: 'Unauthorized' });
		}

		// First load classes for this teacher
		const classes = await Class.find({ teacherId }).lean();

		// Collect class IDs
		const classIds = classes.map((c) => c._id);

		// Fetch quizzes and assignments in parallel for the teacher's classes
		// Also calculate pending counts for submitted-but-ungraded items
		const [quizzes, assignments, pendingQuizzesCount, pendingAssignmentsCount] = await Promise.all([
			Quiz.find({ classId: { $in: classIds } }).lean(),
			Assignment.find({ classId: { $in: classIds } }).lean(),
			Quiz.countDocuments({
				classId: { $in: classIds },
				submissions: { $elemMatch: { $or: [{ marks: null }, { marks: { $exists: false } }] } },
			}),
			Assignment.countDocuments({
				classId: { $in: classIds },
				submissions: { $elemMatch: { $or: [{ marks: null }, { marks: { $exists: false } }] } },
			}),
		]);

		return res.json({ success: true, classes, quizzes, assignments, pendingQuizzesCount, pendingAssignmentsCount });
	} catch (err) {
		console.error('Teacher dashboard error:', err);
		return res.status(500).json({ success: false, message: 'Server Error' });
	}
});

module.exports = router;

---

## SP23-BSE-037 - Muhammad Huzaifa

### Route: `DELETE /teacher/quiz/:id`

**Description:** Deletes a quiz from the Quiz schema by its ID.

**Implementation File:** `teachers/quizRoutes.js`

**Parameters:**
- `id` (URL param): The MongoDB ObjectId of the quiz to delete

**Responses:**
- `200 OK`: Quiz deleted successfully, returns the deleted quiz object
- `400 Bad Request`: Invalid quiz ID format
- `404 Not Found`: Quiz with specified ID not found
- `500 Internal Server Error`: Server error during deletion

**Example Usage:**
```bash
DELETE /teacher/quiz/507f1f77bcf86cd799439011
```

**Example Response:**
```json
{
  "message": "Quiz deleted successfully",
  "quiz": {
    "_id": "507f1f77bcf86cd799439011",
    "classId": "507f1f77bcf86cd799439012",
    "title": "Midterm Quiz",
    "questions": [...],
    "submissions": [...],
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

