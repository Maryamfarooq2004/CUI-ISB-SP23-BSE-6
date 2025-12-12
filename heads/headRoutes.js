const express = require('express');
const router = express.Router();

// Import models (assumes ../models exports Class, Quiz, Assignment, User)
const Quiz = require('../models/Quiz');

// Head dashboard - GET /head/
// Shows head dashboard: class overview, progress graphs, statistics
router.get('/', async (req, res) => {
  try {
    const headId = req.user && req.user._id;
    if (!headId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized: Please log in' 
      });
    }

    // Fetch all classes under head's supervision
    // Note: Assumes Class model exists with departmentId or headId field
    const Class = require('../models/Class');
    const classes = await Class.find({ headId }).lean();

    if (!classes || classes.length === 0) {
      return res.json({
        success: true,
        message: 'No classes found under supervision',
        statistics: {
          totalClasses: 0,
          totalStudents: 0,
          totalQuizzes: 0,
          totalAssignments: 0,
          averageProgress: 0
        },
        classes: [],
        progressData: []
      });
    }

    // Collect class IDs
    const classIds = classes.map((c) => c._id);

    // Fetch quizzes and assignments for all classes
    const Assignment = require('../models/Assignment');
    const [quizzes, assignments] = await Promise.all([
      Quiz.find({ classId: { $in: classIds } }).lean(),
      Assignment.find({ classId: { $in: classIds } }).lean()
    ]);

    // Calculate statistics
    const totalClasses = classes.length;
    const totalStudents = classes.reduce((sum, cls) => sum + (cls.students?.length || 0), 0);
    const totalQuizzes = quizzes.length;
    const totalAssignments = assignments.length;

    // Calculate progress for each class
    const progressData = classes.map((cls) => {
      const classQuizzes = quizzes.filter((q) => q.classId.toString() === cls._id.toString());
      const classAssignments = assignments.filter((a) => a.classId.toString() === cls._id.toString());
      
      // Calculate completion rate based on submissions
      const totalAssessments = classQuizzes.length + classAssignments.length;
      const totalSubmissions = 
        classQuizzes.reduce((sum, q) => sum + (q.submissions?.length || 0), 0) +
        classAssignments.reduce((sum, a) => sum + (a.submissions?.length || 0), 0);
      
      const expectedSubmissions = totalAssessments * (cls.students?.length || 0);
      const completionRate = expectedSubmissions > 0 
        ? ((totalSubmissions / expectedSubmissions) * 100).toFixed(2)
        : 0;

      return {
        classId: cls._id,
        className: cls.name || 'Unnamed Class',
        studentCount: cls.students?.length || 0,
        quizCount: classQuizzes.length,
        assignmentCount: classAssignments.length,
        completionRate: parseFloat(completionRate)
      };
    });

    // Calculate overall average progress
    const averageProgress = progressData.length > 0
      ? (progressData.reduce((sum, p) => sum + p.completionRate, 0) / progressData.length).toFixed(2)
      : 0;

    // Prepare class overview with teacher info
    const classOverview = classes.map((cls) => ({
      classId: cls._id,
      className: cls.name || 'Unnamed Class',
      teacherId: cls.teacherId,
      studentCount: cls.students?.length || 0,
      schedule: cls.schedule || 'Not set'
    }));

    return res.json({
      success: true,
      statistics: {
        totalClasses,
        totalStudents,
        totalQuizzes,
        totalAssignments,
        averageProgress: parseFloat(averageProgress)
      },
      classOverview,
      progressData,
      message: 'Head dashboard data retrieved successfully'
    });

  } catch (err) {
    console.error('Head dashboard error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error occurred while fetching dashboard data',
      error: err.message 
    });
  }
});

module.exports = router;
