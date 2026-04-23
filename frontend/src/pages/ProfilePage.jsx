import { useState } from 'react';
import { Pencil, Trash2, Plus, X, Save, LogOut, Mail, User, Shield } from 'lucide-react';
import { useHabits } from '../context/HabitsContext';
import { useAuth } from '../context/AuthContext';
import AddHabitModal from '../components/AddHabitModal';
import { localDateStr, todayLocal } from '../lib/date';

const EMOJIS = ['🧘', '📚', '💧', '🏋️', '📵', '🍎', '🏃', '💪', '🎯', '✍️', '🎨', '🧹', '😴', '🌿', '☀️', '🎵', '🚴', '🧠', '💊', '🫁', '🥗', '🙏', '🌅', '🏊'];
const CATEGORIES = ['Health', 'Fitness', 'Wellness', 'Learning', 'Mindfulness', 'Productivity', 'Creativity', 'Social', 'Finance', 'Other'];

const BADGES_DEF = [
  { icon: '🔥', label: '7-Day Streak', threshold: 7 },
  { icon: '💎', label: 'Diamond Habit', threshold: 30 },
  { icon: '⚡', label: '500+ Points', threshold: 500, pointBased: true },
  { icon: '🏆', label: 'Top Performer', threshold: 80 },
  { icon: '🌟', label: 'Consistent', threshold: 14 },
  { icon: '🎯', label: 'Goal Setter', threshold: 1 },
];

function EditHabitModal({ habit, onClose, onSave }) {
  const { HABIT_COLORS } = useHabits();
  const [form, setForm] = useState({ ...habit });
  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">✏️ Edit Habit</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} id="close-edit-modal"><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Emoji</label>
            <div className="emoji-grid">
              {EMOJIS.map(e => (
                <button key={e} className={`emoji-btn ${form.emoji === e ? 'selected' : ''}`} onClick={() => set('emoji', e)}>{e}</button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Habit Name</label>
            <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} id="edit-habit-name" />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-control" value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input type="date" className="form-control" value={form.startDate} onChange={e => set('startDate', e.target.value)} id="edit-start-date" />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input type="date" className="form-control" value={form.endDate} onChange={e => set('endDate', e.target.value)} id="edit-end-date" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Points per Completion</label>
            <div className="points-select">
              {[1, 2, 3, 4, 5].map(p => (
                <button key={p} className={`point-btn ${form.points === p ? 'selected' : ''}`} onClick={() => set('points', p)} id={`edit-point-${p}`}>
                  <span className="point-num">{p}</span>
                  <span className="point-stars-sm">{'★'.repeat(p)}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Accent Color</label>
            <div className="color-grid">
              {HABIT_COLORS.map((c, i) => (
                <button key={i} className={`color-btn ${form.color === c ? 'selected' : ''}`} style={{ background: c }} onClick={() => set('color', c)} id={`edit-color-${i}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} id="cancel-edit">Cancel</button>
          <button className="btn btn-primary" onClick={() => { onSave(form); onClose(); }} id="save-edit">
            <Save size={15} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { habits, logs, totalPoints, editHabit, deleteHabit } = useHabits();
  const { user, displayName, avatarInitial, signOut, isDemo, updateUserProfile } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(displayName);
  const [nameSaving, setNameSaving] = useState(false);

  const totalDays = Object.values(logs).reduce((s, log) => s + Object.values(log).filter(Boolean).length, 0);
  const level = Math.floor(totalPoints / 500) + 1;
  const levelProgress = (totalPoints % 500) / 500 * 100;
  const nextLevelPts = level * 500;

  const getHabitStats = (habitId) => {
    const log = logs[habitId] || {};
    const done = Object.values(log).filter(Boolean).length;
    const total = Object.keys(log).length;
    return { done, total, rate: total ? Math.round(done / total * 100) : 0 };
  };

  const maxStreak = (() => {
    let best = 0;
    habits.forEach(h => {
      let cur = 0;
      const today = todayLocal();
      for (let i = 0; i <= 365; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = localDateStr(d);
        if (logs[h.id]?.[key]) cur++;
        else if (i > 0) break;
      }
      best = Math.max(best, cur);
    });
    return best;
  })();

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setNameSaving(true);
    await updateUserProfile({ display_name: newName.trim() });
    setNameSaving(false);
    setEditingName(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account, habits and progress</p>
      </div>

      <div className="profile-layout">
        {/* ── LEFT: Profile card ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="profile-card">
            {/* Avatar */}
            <div className="profile-avatar-wrap">
              <div className="profile-avatar">{avatarInitial}</div>
              <div className="profile-level">Lvl {level}</div>
            </div>

            {/* Name (editable) */}
            <div style={{ textAlign: 'center', width: '100%' }}>
              {editingName ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                  <input
                    className="form-control"
                    style={{ textAlign: 'center', maxWidth: 200, fontSize: 16, fontWeight: 700 }}
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                    autoFocus
                    id="edit-display-name"
                  />
                  <button className="btn btn-primary btn-sm" onClick={handleSaveName} disabled={nameSaving} id="save-display-name">
                    {nameSaving ? '...' : <Save size={13} />}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setEditingName(false); setNewName(displayName); }}>
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div className="profile-name">{displayName}</div>
                  <button className="btn btn-ghost btn-icon" onClick={() => { setEditingName(true); setNewName(displayName); }} style={{ padding: 4 }} id="edit-name-btn">
                    <Pencil size={13} style={{ color: 'var(--text-muted)' }} />
                  </button>
                </div>
              )}
              <div className="profile-handle">
                {user?.email || 'demo@habitflow.app'}
                {isDemo && <span style={{ marginLeft: 6, fontSize: 10, background: 'rgba(245,158,11,0.2)', color: '#fbbf24', padding: '1px 6px', borderRadius: 999 }}>DEMO</span>}
              </div>
            </div>

            {/* Points badge */}
            <div className="profile-points-badge">
              <span className="points-icon">⚡</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span className="points-val">{totalPoints.toLocaleString()}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>pts</span>
                </div>
                <div className="points-desc">Total Points Earned</div>
              </div>
            </div>

            {/* Level bar */}
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                <span>Level {level}</span>
                <span>{totalPoints.toLocaleString()} / {nextLevelPts.toLocaleString()} pts</span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${levelProgress}%`, background: 'var(--gradient-primary)', borderRadius: 4, transition: 'width 0.6s ease' }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>
                {(nextLevelPts - totalPoints).toLocaleString()} pts to Level {level + 1}
              </div>
            </div>

            {/* Stats mini-grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, width: '100%' }}>
              {[
                { label: 'Habits', val: habits.length, icon: '📋' },
                // { label: 'Days Done', val: totalDays, icon: '✅' },
                { label: 'Best Streak', val: `${maxStreak}`, icon: '🔥' },
                { label: 'Level', val: `${level}`, icon: '🏆' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', padding: '10px 6px', background: 'var(--bg-card-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  {s.icon && <div style={{ fontSize: 18 }}>{s.icon}</div>}
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Badges */}
            <div style={{ width: '100%' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Badges</div>
              <div className="profile-badges">
                {BADGES_DEF.map(b => (
                  <div key={b.label} className="badge">
                    <span className="badge-icon">{b.icon}</span>
                    {b.label}
                  </div>
                ))}
              </div>
            </div>


          </div>

          {/* Account info card */}
          <div className="card" style={{ background: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.15)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={15} style={{ color: '#3b82f6' }} /> Account Info
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <User size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Display Name</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{displayName}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{user?.email || '—'}</div>
                </div>
              </div>
              {/* Sign out */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={signOut}
                  id="profile-sign-out-btn"
                  style={{ width: '100%', marginTop: 4 }}
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
              {isDemo && (
                <div className="auth-banner info" style={{ marginTop: 4, fontSize: 12 }}>
                  You're in demo mode. Add Supabase credentials to enable real accounts.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Habits manager ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>My Habits</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {habits.length} habits · Set start/end dates to schedule them
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)} id="profile-add-habit-btn">
                <Plus size={15} /> New Habit
              </button>
            </div>

            {habits.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 24px' }}>
                <div className="empty-icon">🌱</div>
                <div className="empty-title">No habits yet</div>
                <div className="empty-desc">Create your first habit to start tracking your daily routines and earning points.</div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)} id="profile-first-habit-btn">
                  <Plus size={15} /> Create Habit
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {habits.map(habit => {
                  const stats = getHabitStats(habit.id);
                  return (
                    <div key={habit.id} className="habit-manage-card" style={{ position: 'relative', paddingLeft: 24 }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: habit.color, borderRadius: '4px 0 0 4px' }} />
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{habit.emoji}</span>
                      <div className="habit-manage-info">
                        <div className="habit-manage-name">{habit.name}</div>
                        <div className="habit-manage-dates">
                          📅 {habit.startDate} → {habit.endDate} &nbsp;·&nbsp;
                          ⭐ {habit.points} pts/day &nbsp;·&nbsp;
                          {habit.category}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            ✅ {stats.done} days · {stats.rate}% completion
                          </div>
                          <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', maxWidth: 120 }}>
                            <div style={{ height: '100%', width: `${stats.rate}%`, background: 'var(--gradient-success)', borderRadius: 2, transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                      </div>
                      <div className="habit-manage-actions">
                        <button className="btn btn-ghost btn-icon" onClick={() => setEditingHabit(habit)} id={`edit-habit-${habit.id}`} title="Edit">
                          <Pencil size={15} />
                        </button>
                        <button className="btn btn-danger btn-icon" onClick={() => setDeleteConfirm(habit.id)} id={`delete-habit-${habit.id}`} title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Points system explainer */}
          <div className="card" style={{ background: 'rgba(124,58,237,0.08)', borderColor: 'rgba(124,58,237,0.2)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>📊 Points System</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3, 4, 5].map(p => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map(s => <span key={s} style={{ color: s <= p ? 'var(--warning)' : 'var(--text-muted)', fontSize: 12 }}>★</span>)}
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {p} pt{p > 1 ? 's' : ''} — {['Easy habit', 'Light effort', 'Medium challenge', 'Strong commitment', 'Max intensity'][p - 1]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showAddModal && <AddHabitModal onClose={() => setShowAddModal(false)} />}
      {editingHabit && (
        <EditHabitModal
          habit={editingHabit}
          onClose={() => setEditingHabit(null)}
          onSave={(updates) => editHabit(editingHabit.id, updates)}
        />
      )}
      {deleteConfirm !== null && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">🗑️ Delete Habit</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setDeleteConfirm(null)}><X size={20} /></button>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Delete <strong style={{ color: 'var(--text-primary)' }}>{habits.find(h => h.id === deleteConfirm)?.name}</strong>? All history will be permanently lost.
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)} id="cancel-delete">Cancel</button>
              <button className="btn btn-danger" onClick={() => { deleteHabit(deleteConfirm); setDeleteConfirm(null); }} id="confirm-delete">
                <Trash2 size={15} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
