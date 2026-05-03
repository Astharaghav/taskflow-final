const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'taskflow_secret_key');
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found.' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

exports.requireProjectRole = (...roles) => {
  return async (req, res, next) => {
    const Project = require('../models/Project');
    const projectId = req.params.projectId || req.body.projectId || req.params.id;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    const member = project.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member) return res.status(403).json({ message: 'You are not a member of this project.' });
    if (roles.length && !roles.includes(member.role))
      return res.status(403).json({ message: `Required role: ${roles.join(' or ')}` });
    req.project = project;
    req.projectRole = member.role;
    next();
  };
};
