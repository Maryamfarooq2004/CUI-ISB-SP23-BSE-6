Students routes must be here
//by Mahad Kamran (SP23-BSE-023)
router.get('/:studentId', async (req, res) => {
    res.set('Cache-Control', 'no-store'); 
    try {
        const { studentId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).json({ message: 'Invalid Student ID format' });
        }

        const studentPromise = User.findById(studentId).select('-password');

        const classesPromise = Class.find({ students: studentId })
                                    .populate('teacher', 'name email')
                                    .select('classname teacher createdAt');

        const marksPromise = Marks.find({ studentId: studentId })
                                  .populate('subjectId', 'classname');

        const [student, classes, marks] = await Promise.all([
            studentPromise,
            classesPromise,
            marksPromise
        ]);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const classIds = classes.map(c => c._id);
        
        const assignments = await Assignment.find({ 
            classId: { $in: classIds } 
        }).sort({ createdAt: -1 });

        const processedAssignments = assignments.map(assign => {
            const submission = assign.submissions.find(sub => sub.studentId.toString() === studentId);
            return {
                _id: assign._id,
                title: assign.title,
                classId: assign.classId,
                status: submission ? 'Submitted' : 'Pending',
                marksObtained: submission ? submission.marks : null,
                dueDate: assign.createdAt
            };
        });

        const dashboardData = {
            profile: {
                name: student.name,
                email: student.email,
                role: student.role,
                joined: student.createdAt
            },
            stats: {
                classesEnrolled: classes.length,
                assignmentsPending: processedAssignments.filter(a => a.status === 'Pending').length,
                averageMarks: marks.length > 0 
                    ? (marks.reduce((acc, curr) => acc + curr.marks, 0) / marks.length).toFixed(1) 
                    : 0
            },
            classes: classes,
            results: marks,
            assignments: processedAssignments
        };

        res.status(200).json(dashboardData);

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});







// Meesam Abbas (SP23-BSE-025)
// GET /students/attemptquiz

// routes/student.js
const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth'); // middleware to check JWT token

// GET /student/attemptquiz?quizId=<id>
router.get('/attemptquiz', verifyToken, async (req, res) => {
  try {
    const studentId = req.user._id; // decoded from token
    const { quizId } = req.query;

    if (!quizId) {
      return res.status(400).json({ message: 'Quiz ID is required' });
    }

    const quiz = await Quiz.findById(quizId).lean();
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if student is assigned to the class of this quiz
    const student = await User.findById(studentId);
    if (!student.assignedClasses.includes(quiz.classId)) {
      return res.status(403).json({ message: 'You are not enrolled in this class' });
    }

    // Check if student has already submitted
    const existingSubmission = quiz.submissions.find(
      (s) => s.studentId.toString() === studentId.toString()
    );

    if (existingSubmission) {
      return res.status(200).json({
        message: 'You have already attempted this quiz',
        attempted: true,
        answers: existingSubmission.answers, // optional: return their previous answers
      });
    }

    // Send quiz questions (without correct answers)
    const questions = quiz.questions.map((q) => ({
      question: q.question,
      options: q.options,
    }));

    res.status(200).json({
      quizId: quiz._id,
      title: quiz.title,
      questions,
      attempted: false,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});



// Meesam Abbas (SP23-BSE-025)
// POST /student/submitquiz
router.post('/submitquiz', verifyToken, async (req, res) => {
  try {
    const studentId = req.user._id; // decoded from token
    const { quizId, answers } = req.body;

    if (!quizId || !answers) {
      return res.status(400).json({ message: 'Quiz ID and answers are required' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if student is assigned to the class
    const student = await User.findById(studentId);
    if (!student.assignedClasses.includes(quiz.classId)) {
      return res.status(403).json({ message: 'You are not enrolled in this class' });
    }

    // Check if student already submitted
    const existingSubmission = quiz.submissions.find(
      (s) => s.studentId.toString() === studentId.toString()
    );

    if (existingSubmission) {
      return res.status(400).json({ message: 'You have already submitted this quiz' });
    }

    // Add submission
    quiz.submissions.push({
      studentId: studentId,
      answers: answers,
      marks: null, // marks to be added by teacher
    });

    await quiz.save();

    res.status(200).json({ message: 'Quiz submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});









//





//write the code above and don't write module.exports = router


module.exports = router;

























































