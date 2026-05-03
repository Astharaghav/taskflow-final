import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../context/AuthContext';

const COLORS = ['#7c6aff', '#ff6ab0', '#22d3a5', '#38bdf8', '#fbbf24', '#ff5f57', '#a78bfa', '#34d399'];

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', color: COLORS[0], dueDate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post('/projects', form);
      onCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">New Project</h2>
          <button className="btn-icon" onClick={onClose} style={{ fontSize: '20px' }}>×</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input className="form-input" placeholder="e.g. Website Redesign" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" placeholder="What's this project about?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? '3px solid white' : '3px solid transparent', transition: 'all 0.15s' }} />
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Due Date (optional)</label>
            <input type="date" className="form-input" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Project'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/projects').then(r => setProjects(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Project</button>
      </div>

      {!projects.length ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <h3>No projects yet</h3>
          <p>Create your first project to start organizing tasks</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Project</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {projects.map(p => (
            <div key={p._id} className="project-card" onClick={() => navigate(`/projects/${p._id}`)}>
              <div className="project-color-bar" style={{ background: p.color }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '10px', background: p.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', border: `1px solid ${p.color}44` }}>
                  📁
                </div>
                <span className={`badge badge-${p.status === 'active' ? 'in_progress' : p.status === 'completed' ? 'done' : 'todo'}`}>{p.status}</span>
              </div>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>{p.name}</h3>
              {p.description && <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p>}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                <div style={{ display: 'flex', gap: '-6px' }}>
                  {p.members?.slice(0, 4).map(m => (
                    <div key={m.user?._id} className="avatar avatar-sm" title={m.user?.name} style={{ marginLeft: m === p.members[0] ? 0 : '-6px', border: '2px solid var(--surface)' }}>
                      {m.user?.name?.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {p.members?.length > 4 && <div className="avatar avatar-sm" style={{ marginLeft: '-6px', border: '2px solid var(--surface)', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: '10px' }}>+{p.members.length - 4}</div>}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.members?.length} member{p.members?.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreated={p => setProjects(prev => [p, ...prev])} />}
    </div>
  );
}
