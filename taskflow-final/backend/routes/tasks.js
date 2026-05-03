const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

async function checkMembership(userId, projectId) {
  const project = await Project.findById(projectId);
  if (!project) return null;
  const member = project.members.find(m => m.user.toString() === userId.toString());
  return member ? { project, role: member.role } : null;
}

router.get('/my', async (req, res) => {
  try {
    const tasks = await Task.find({ assignee: req.user._id })
      .populate('project', 'name color')
      .populate('createdBy', 'name email')
      .sort('dueDate');
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/', async (req, res) => {
  try {
    const { projectId, status, priority, assignee } = req.query;
    if (!projectId) return res.status(400).json({ message: 'projectId is required' });
    const access = await checkMembership(req.user._id, projectId);
    if (!access) return res.status(403).json({ message: 'Access denied.' });
    const filter = { project: projectId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;
    const tasks = await Task.find(filter)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort('-createdAt');
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('projectId').notEmpty().withMessage('projectId is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { title, description, projectId, assignee, status, priority, dueDate, tags } = req.body;
    const access = await checkMembership(req.user._id, projectId);
    if (!access) return res.status(403).json({ message: 'Access denied.' });
    let finalAssignee = req.user._id;
    if (assignee) {
      if (access.role !== 'admin' && assignee !== req.user._id.toString())
        return res.status(403).json({ message: 'Only admins can assign tasks to others.' });
      finalAssignee = assignee;
    }
    const task = await Task.create({
      title, description, project: projectId,
      assignee: finalAssignee, createdBy: req.user._id,
      status, priority, dueDate, tags
    });
    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email');
    res.status(201).json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('comments.author', 'name email avatar');
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    const access = await checkMembership(req.user._id, task.project);
    if (!access) return res.status(403).json({ message: 'Access denied.' });
    res.json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    const access = await checkMembership(req.user._id, task.project);
    if (!access) return res.status(403).json({ message: 'Access denied.' });
    const { title, description, assignee, status, priority, dueDate, tags } = req.body;
    if (access.role === 'member') {
      if (task.assignee?.toString() !== req.user._id.toString())
        return res.status(403).json({ message: 'You can only update your own tasks.' });
      if (assignee && assignee !== req.user._id.toString())
        return res.status(403).json({ message: 'Only admins can reassign tasks.' });
    }
    const updated = await Task.findByIdAndUpdate(req.params.id,
      { title, description, assignee, status, priority, dueDate, tags },
      { new: true, runValidators: true }
    ).populate('assignee', 'name email avatar').populate('createdBy', 'name email');
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    const access = await checkMembership(req.user._id, task.project);
    if (!access) return res.status(403).json({ message: 'Access denied.' });
    if (access.role !== 'admin') return res.status(403).json({ message: 'Only admins can delete tasks.' });
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/comments', [body('content').trim().notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    const access = await checkMembership(req.user._id, task.project);
    if (!access) return res.status(403).json({ message: 'Access denied.' });
    task.comments.push({ author: req.user._id, content: req.body.content });
    await task.save();
    await task.populate('comments.author', 'name email avatar');
    res.status(201).json(task.comments[task.comments.length - 1]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
