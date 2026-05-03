import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../context/AuthContext';
import { format, isPast } from 'date-fns';

const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
const PRIORITY_COLORS = { low: '#22d3a5', medium: '#38bdf8', high: '#fbbf24', urgent: '#ff5f57' };

export default function MyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', priority: '' });
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/tasks/my').then(r => setTasks(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = tasks.filter(t =>
    (!filter.status || t.status === filter.status) &&
    (!filter.priority || t.priority === filter.priority)
  );

  const overdue = filtered.filter(t => t.dueDate && t.status !== 'done' && isPast(new Date(t.dueDate)));
  const active = filtered.filter(t => t.status !== 'done' && !(t.dueDate && isPast(new Date(t.dueDate))));
  const done = filtered.filter(t => t.status === 'done');

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  const TaskRow = ({ task }) => {
    const isOverdue = task.dueDate && task.status !== 'done' && isPast(new Date(task.dueDate));
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
        background: 'var(--surface2)', borderRadius: 8,
        border: `1px solid ${isOverdue ? 'rgba(255,95,87,0.3)' : 'var(--border)'}`,
        cursor: 'pointer', transition: 'all 0.15s',
        marginBottom: 8
      }}
        onClick={() => navigate(`/projects/${task.project?._id}`)}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
        <div style={{ width: 4, height: 36, borderRadius: 2, background: PRIORITY_COLORS[task.priority], flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 3 }}>{task.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
            <span>📁 {task.project?.name}</span>
            {task.dueDate && <span style={{ color: isOverdue ? 'var(--red)' : 'var(--text-muted)' }}>
              {isOverdue ? '⚠ Overdue: ' : '📅 '}{format(new Date(task.dueDate), 'MMM d, yyyy')}
            </span>}
          </div>
        </div>
        <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>
        <span className={`badge badge-${task.priority}`} style={{ fontSize: 11 }}>{task.priority}</span>
      </div>
    );
  };

  const Section = ({ title, tasks, color }) => tasks.length > 0 && (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700 }}>{title}</h3>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', background: 'var(--surface2)', padding: '2px 8px', borderRadius: 100 }}>{tasks.length}</span>
      </div>
      {tasks.map(t => <TaskRow key={t._id} task={t} />)}
    </div>
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">My Tasks</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="form-input" style={{ width: 'auto' }} value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Statuses</option>
            <option value="todo">To Do</option><option value="in_progress">In Progress</option>
            <option value="review">Review</option><option value="done">Done</option>
          </select>
          <select className="form-input" style={{ width: 'auto' }} value={filter.priority} onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}>
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option><option value="high">High</option>
            <option value="medium">Medium</option><option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Summary row */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        {[
          { label: 'Total Assigned', value: tasks.length, color: '#7c6aff' },
          { label: 'Overdue', value: overdue.length, color: '#ff5f57' },
          { label: 'Active', value: active.length, color: '#38bdf8' },
          { label: 'Completed', value: done.length, color: '#22d3a5' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--accent-color': s.color }}>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {!filtered.length ? (
        <div className="empty-state">
          <div className="empty-icon">✓</div>
          <h3>No tasks assigned to you</h3>
          <p>Tasks assigned to you will appear here</p>
        </div>
      ) : (
        <>
          <Section title="Overdue" tasks={overdue} color="#ff5f57" />
          <Section title="Active" tasks={active} color="#38bdf8" />
          <Section title="Completed" tasks={done} color="#22d3a5" />
        </>
      )}
    </div>
  );
}
