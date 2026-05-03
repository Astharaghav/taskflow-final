const express = require('express');
const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const [myTasks, myProjects] = await Promise.all([
      Task.find({ assignee: req.user._id }).populate('project', 'name color'),
      Project.find({ 'members.user': req.user._id })
    ]);
    res.json({
      totalTasks: myTasks.length,
      todo: myTasks.filter(t => t.status === 'todo').length,
      inProgress: myTasks.filter(t => t.status === 'in_progress').length,
      review: myTasks.filter(t => t.status === 'review').length,
      done: myTasks.filter(t => t.status === 'done').length,
      overdue: myTasks.filter(t => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now).length,
      totalProjects: myProjects.length,
      recentTasks: myTasks.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5)
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);
    const users = await User.find({
      $or: [
        { email: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ]
    }).select('name email avatar').limit(10);
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
