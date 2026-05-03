import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { format, isPast } from 'date-fns';

const PRIORITY_COLORS = { low: '#22d3a5', medium: '#38bdf8', high: '#fbbf24', urgent: '#ff5f57' };
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/users/dashboard').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px' }}>{greeting} 👋</p>
          <h1 className="page-title">{user?.name?.split(' ')[0]}'s Dashboard</h1>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/projects')}>
          + New Project
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Total Tasks', value: stats?.totalTasks || 0, color: '#7c6aff' },
          { label: 'In Progress', value: stats?.inProgress || 0, color: '#38bdf8' },
          { label: 'Review', value: stats?.review || 0, color: '#fbbf24' },
          { label: 'Completed', value: stats?.done || 0, color: '#22d3a5' },
          { label: 'Overdue', value: stats?.overdue || 0, color: '#ff5f57' },
          { label: 'Projects', value: stats?.totalProjects || 0, color: '#ff6ab0' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--accent-color': s.color }}>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent tasks */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 700 }}>Recent Tasks</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/my-tasks')}>View all</button>
        </div>
        {!stats?.recentTasks?.length ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <div className="empty-icon">📋</div>
            <h3>No tasks yet</h3>
            <p>Create a project and add tasks to get started</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats.recentTasks.map(task => {
              const overdue = task.dueDate && task.status !== 'done' && isPast(new Date(task.dueDate));
              return (
                <div key={task._id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                  background: 'var(--surface2)', borderRadius: '8px',
                  border: `1px solid ${overdue ? 'rgba(255,95,87,0.3)' : 'var(--border)'}`,
                  cursor: 'pointer'
                }} onClick={() => navigate(`/projects/${task.project?._id}`)}>
                  <div style={{ width: '4px', height: '36px', borderRadius: '2px', background: PRIORITY_COLORS[task.priority] || '#7c6aff', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{task.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {task.project?.name}
                      {task.dueDate && <span style={{ marginLeft: 8, color: overdue ? 'var(--red)' : 'var(--text-muted)' }}>
                        {overdue ? '⚠ Overdue' : '📅 ' + format(new Date(task.dueDate), 'MMM d')}
                      </span>}
                    </div>
                  </div>
                  <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
