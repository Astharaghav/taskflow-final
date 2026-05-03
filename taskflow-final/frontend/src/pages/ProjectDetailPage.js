import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { format, isPast } from 'date-fns';

const STATUS_COLS = [
  { key: 'todo', label: 'To Do', color: '#7070a0' },
  { key: 'in_progress', label: 'In Progress', color: '#38bdf8' },
  { key: 'review', label: 'Review', color: '#fbbf24' },
  { key: 'done', label: 'Done', color: '#22d3a5' }
];

const PRIORITY_DOT = { low: '#22d3a5', medium: '#38bdf8', high: '#fbbf24', urgent: '#ff5f57' };

function TaskModal({ task, project, userRole, onClose, onUpdated, onDeleted }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ title: task?.title || '', description: task?.description || '', assignee: task?.assignee?._id || '', status: task?.status || 'todo', priority: task?.priority || 'medium', dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '' });
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(task?.comments || []);
  const isAdmin = userRole === 'admin';

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await API.put(`/tasks/${task._id}`, form);
      onUpdated(data);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    await API.delete(`/tasks/${task._id}`);
    onDeleted(task._id);
    onClose();
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    const { data } = await API.post(`/tasks/${task._id}/comments`, { content: comment });
    setComments(prev => [...prev, data]);
    setComment('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ fontSize: 16 }}>Edit Task</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {isAdmin && <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>}
            <button className="btn-icon" onClick={onClose} style={{ fontSize: 20 }}>×</button>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Title</label>
          <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} disabled={!isAdmin && task.assignee?._id !== user._id} />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {STATUS_COLS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select className="form-input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} disabled={!isAdmin}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div className="grid-2">
          {isAdmin && <div className="form-group">
            <label className="form-label">Assignee</label>
            <select className="form-input" value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}>
              <option value="">Unassigned</option>
              {project?.members?.map(m => <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}
            </select>
          </div>}
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input type="date" className="form-input" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
        </div>

        {/* Comments */}
        <hr className="divider" />
        <div className="form-group">
          <label className="form-label">Comments ({comments.length})</label>
          <div style={{ maxHeight: 160, overflowY: 'auto', marginBottom: 8 }}>
            {comments.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <div className="avatar avatar-sm">{c.author?.name?.charAt(0)}</div>
                <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 12px', flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>{c.author?.name}</div>
                  <div style={{ fontSize: 13 }}>{c.content}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="form-input" placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleComment()} />
            <button className="btn btn-secondary btn-sm" onClick={handleComment} style={{ whiteSpace: 'nowrap' }}>Post</button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

function CreateTaskModal({ project, userRole, onClose, onCreated }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ title: '', description: '', assignee: user._id, status: 'todo', priority: 'medium', dueDate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isAdmin = userRole === 'admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post('/tasks', { ...form, projectId: project._id });
      onCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">New Task</h2>
          <button className="btn-icon" onClick={onClose} style={{ fontSize: 20 }}>×</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" placeholder="What needs to be done?" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" placeholder="More details..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUS_COLS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="grid-2">
            {isAdmin && <div className="form-group">
              <label className="form-label">Assignee</label>
              <select className="form-input" value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}>
                {project?.members?.map(m => <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}
              </select>
            </div>}
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InviteMemberModal({ projectId, onClose, onUpdated }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const { data } = await API.post(`/projects/${projectId}/members`, { email, role });
      onUpdated(data);
      setSuccess(`${email} added successfully!`);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Invite Member</h2>
          <button className="btn-icon" onClick={onClose} style={{ fontSize: 20 }}>×</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={handleInvite}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-input" placeholder="colleague@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-input" value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>The user must already have a TaskFlow account.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Done</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Inviting...' : 'Invite'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('board');
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [userRole, setUserRole] = useState('member');

  const fetchData = useCallback(async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        API.get(`/projects/${id}`),
        API.get(`/tasks?projectId=${id}`)
      ]);
      setProject(projRes.data);
      setUserRole(projRes.data.userRole);
      setTasks(tasksRes.data);
    } catch (err) {
      if (err.response?.status === 403) navigate('/projects');
    } finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleTaskCreated = (task) => setTasks(prev => [task, ...prev]);
  const handleTaskUpdated = (updated) => setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
  const handleTaskDeleted = (id) => setTasks(prev => prev.filter(t => t._id !== id));

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await API.delete(`/projects/${id}/members/${userId}`);
      setProject(prev => ({ ...prev, members: prev.members.filter(m => m.user._id !== userId) }));
    } catch (err) { alert(err.response?.data?.message); }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!project) return null;

  const isAdmin = userRole === 'admin';
  const now = new Date();

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <button className="btn btn-secondary btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate('/projects')}>← Projects</button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: project.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, border: `1px solid ${project.color}44` }}>📁</div>
            <div>
              <h1 className="page-title" style={{ fontSize: 24 }}>{project.name}</h1>
              {project.description && <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>{project.description}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {isAdmin && <button className="btn btn-secondary btn-sm" onClick={() => setShowInvite(true)}>+ Invite</button>}
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ Task</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginTop: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {['board', 'list', 'members'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 16px', background: 'none', border: 'none',
              color: activeTab === tab ? 'var(--text)' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
              fontWeight: activeTab === tab ? 600 : 400, fontSize: 14, cursor: 'pointer',
              textTransform: 'capitalize', transition: 'all 0.15s'
            }}>{tab}</button>
          ))}
        </div>
      </div>

      {/* Board View */}
      {activeTab === 'board' && (
        <div className="board">
          {STATUS_COLS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key);
            return (
              <div key={col.key} className="board-col">
                <div className="board-col-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                    <span className="board-col-title" style={{ color: col.color }}>{col.label}</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--surface2)', padding: '2px 8px', borderRadius: 100 }}>{colTasks.length}</span>
                </div>
                {colTasks.map(task => {
                  const overdue = task.dueDate && task.status !== 'done' && isPast(new Date(task.dueDate));
                  return (
                    <div key={task._id} className={`task-card ${overdue ? 'overdue' : ''}`} onClick={() => setSelectedTask(task)}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 3, height: '100%', borderRadius: 2, background: PRIORITY_DOT[task.priority], alignSelf: 'stretch', flexShrink: 0, minHeight: 40 }} />
                        <div className="task-title" style={{ margin: 0 }}>{task.title}</div>
                      </div>
                      <div className="task-meta">
                        {task.dueDate && <span style={{ fontSize: 11, color: overdue ? 'var(--red)' : 'var(--text-muted)' }}>
                          {overdue ? '⚠' : '📅'} {format(new Date(task.dueDate), 'MMM d')}
                        </span>}
                        {task.assignee && <div className="avatar avatar-sm" title={task.assignee.name}>{task.assignee.name?.charAt(0)}</div>}
                        <span className={`badge badge-${task.priority}`} style={{ padding: '2px 6px', fontSize: 10 }}>{task.priority}</span>
                      </div>
                    </div>
                  );
                })}
                {colTasks.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, opacity: 0.6 }}>Empty</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {activeTab === 'list' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {!tasks.length ? (
            <div className="empty-state"><div className="empty-icon">📋</div><h3>No tasks</h3><button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create first task</button></div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Task', 'Status', 'Priority', 'Assignee', 'Due Date'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {tasks.map(task => {
                  const overdue = task.dueDate && task.status !== 'done' && isPast(new Date(task.dueDate));
                  return (
                    <tr key={task._id} onClick={() => setSelectedTask(task)} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 16px' }}><div style={{ fontWeight: 500, fontSize: 14 }}>{task.title}</div>{task.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{task.description.slice(0, 60)}...</div>}</td>
                      <td style={{ padding: '12px 16px' }}><span className={`badge badge-${task.status}`}>{STATUS_COLS.find(s => s.key === task.status)?.label}</span></td>
                      <td style={{ padding: '12px 16px' }}><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                      <td style={{ padding: '12px 16px' }}>{task.assignee ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className="avatar avatar-sm">{task.assignee.name?.charAt(0)}</div><span style={{ fontSize: 13 }}>{task.assignee.name}</span></div> : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</span>}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: overdue ? 'var(--red)' : 'var(--text-muted)' }}>{task.dueDate ? (overdue ? '⚠ ' : '') + format(new Date(task.dueDate), 'MMM d, yyyy') : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Members View */}
      {activeTab === 'members' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18 }}>Team Members ({project.members?.length})</h3>
            {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => setShowInvite(true)}>+ Invite Member</button>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {project.members?.map(m => (
              <div key={m.user._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div className="avatar">{m.user.name?.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{m.user.name} {m.user._id === user._id && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>(you)</span>}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.user.email}</div>
                </div>
                <span className={`badge badge-${m.role}`}>{m.role}</span>
                {isAdmin && m.user._id !== project.owner._id && m.user._id !== user._id && (
                  <button className="btn-icon" onClick={() => handleRemoveMember(m.user._id)} title="Remove member" style={{ color: 'var(--red)' }}>✕</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreate && <CreateTaskModal project={project} userRole={userRole} onClose={() => setShowCreate(false)} onCreated={handleTaskCreated} />}
      {showInvite && <InviteMemberModal projectId={id} onClose={() => setShowInvite(false)} onUpdated={setProject} />}
      {selectedTask && <TaskModal task={selectedTask} project={project} userRole={userRole} onClose={() => setSelectedTask(null)} onUpdated={handleTaskUpdated} onDeleted={handleTaskDeleted} />}
    </div>
  );
}
