const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect, requireProjectRole } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('owner', 'name email')
      .populate('members.user', 'name email avatar')
      .sort('-updatedAt');
    res.json(projects);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', [body('name').trim().notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { name, description, color, dueDate } = req.body;
    const project = await Project.create({
      name, description, color, dueDate,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }]
    });
    await project.populate('owner', 'name email');
    await project.populate('members.user', 'name email avatar');
    res.status(201).json(project);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', requireProjectRole(), async (req, res) => {
  await req.project.populate('owner', 'name email');
  await req.project.populate('members.user', 'name email avatar');
  res.json({ ...req.project.toJSON(), userRole: req.projectRole });
});

router.put('/:id', requireProjectRole('admin'), async (req, res) => {
  try {
    const { name, description, status, color, dueDate } = req.body;
    const updated = await Project.findByIdAndUpdate(req.params.id,
      { name, description, status, color, dueDate },
      { new: true, runValidators: true }
    ).populate('owner', 'name email').populate('members.user', 'name email avatar');
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', requireProjectRole('admin'), async (req, res) => {
  try {
    await Task.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted successfully.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/members', requireProjectRole('admin'), [
  body('email').isEmail().withMessage('Valid email required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { email, role = 'member' } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found. They must sign up first.' });
    const project = req.project;
    const alreadyMember = project.members.some(m => m.user.toString() === user._id.toString());
    if (alreadyMember) return res.status(400).json({ message: 'User is already a member.' });
    project.members.push({ user: user._id, role });
    await project.save();
    await project.populate('members.user', 'name email avatar');
    res.json(project);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id/members/:userId', requireProjectRole('admin'), async (req, res) => {
  try {
    const project = req.project;
    if (req.params.userId === project.owner.toString())
      return res.status(400).json({ message: 'Cannot remove the project owner.' });
    project.members = project.members.filter(m => m.user.toString() !== req.params.userId);
    await project.save();
    res.json({ message: 'Member removed.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:projectId/stats', requireProjectRole(), async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId });
    const now = new Date();
    res.json({
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      review: tasks.filter(t => t.status === 'review').length,
      done: tasks.filter(t => t.status === 'done').length,
      overdue: tasks.filter(t => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now).length
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
