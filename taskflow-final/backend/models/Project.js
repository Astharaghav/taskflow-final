const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now }
});

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [memberSchema],
  status: { type: String, enum: ['active', 'archived', 'completed'], default: 'active' },
  color: { type: String, default: '#6366f1' },
  dueDate: { type: Date }
}, { timestamps: true });

projectSchema.pre('save', function(next) {
  const ownerExists = this.members.some(m => m.user.toString() === this.owner.toString());
  if (!ownerExists) this.members.push({ user: this.owner, role: 'admin' });
  next();
});

module.exports = mongoose.model('Project', projectSchema);
