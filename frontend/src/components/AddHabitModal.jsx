import { useState } from 'react';
import { X } from 'lucide-react';
import { useHabits } from '../context/HabitsContext';
import { todayLocal } from '../lib/date';

const EMOJIS = ['🧘', '📚', '💧', '🏋️', '📵', '🍎', '🏃', '💪', '🎯', '✍️', '🎨', '🧹', '😴', '🌿', '☀️', '🎵', '🚴', '🧠', '💊', '🫁', '🥗', '🙏', '🌅', '🏊'];

const CATEGORIES = ['Health', 'Fitness', 'Wellness', 'Learning', 'Mindfulness', 'Productivity', 'Creativity', 'Social', 'Finance', 'Other'];

const COLOR_SWATCHES = [
  '#7c3aed', '#a855f7', '#ec4899', '#f472b6',
  '#10b981', '#34d399', '#f59e0b', '#fbbf24',
  '#3b82f6', '#60a5fa', '#ef4444', '#06b6d4',
];

export default function AddHabitModal({ onClose }) {
  const { addHabit, HABIT_COLORS } = useHabits();
  const [form, setForm] = useState({
    name: '',
    emoji: '🎯',
    points: 3,
    category: 'Health',
    startDate: todayLocal(),
    endDate: '',
    color: HABIT_COLORS[0],
  });
  const [errors, setErrors] = useState({});

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Habit name is required';
    if (!form.startDate) e.startDate = 'Start date is required';
    if (!form.endDate) e.endDate = 'End date is required';
    if (form.endDate && form.startDate && form.endDate < form.startDate) e.endDate = 'End date must be after start date';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    addHabit(form);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">✨ New Habit</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} id="close-add-habit-modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Emoji Picker */}
          <div className="form-group">
            <label className="form-label">Choose Emoji</label>
            <div className="emoji-grid">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  className={`emoji-btn ${form.emoji === e ? 'selected' : ''}`}
                  onClick={() => set('emoji', e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="form-group">
            <label className="form-label">Habit Name</label>
            <input
              id="habit-name-input"
              className="form-control"
              placeholder="e.g. Morning Meditation"
              value={form.name}
              onChange={e => set('name', e.target.value)}
            />
            {errors.name && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{errors.name}</span>}
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-control" value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Dates */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                id="habit-start-date"
                type="date"
                className="form-control"
                value={form.startDate}
                onChange={e => set('startDate', e.target.value)}
              />
              {errors.startDate && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{errors.startDate}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                id="habit-end-date"
                type="date"
                className="form-control"
                value={form.endDate}
                onChange={e => set('endDate', e.target.value)}
                min={form.startDate}
              />
              {errors.endDate && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{errors.endDate}</span>}
            </div>
          </div>

          {/* Points */}
          <div className="form-group">
            <label className="form-label">Points per Completion (1–5)</label>
            <div className="points-select">
              {[1, 2, 3, 4, 5].map(p => (
                <button
                  key={p}
                  className={`point-btn ${form.points === p ? 'selected' : ''}`}
                  onClick={() => set('points', p)}
                  id={`point-btn-${p}`}
                >
                  <span className="point-num">{p}</span>
                  <span className="point-stars-sm">{'★'.repeat(p)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="form-group">
            <label className="form-label">Accent Color</label>
            <div className="color-grid">
              {HABIT_COLORS.map((c, i) => (
                <button
                  key={i}
                  className={`color-btn ${form.color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => set('color', c)}
                  id={`color-btn-${i}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} id="cancel-add-habit">Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} id="submit-add-habit">
            ✨ Add Habit
          </button>
        </div>
      </div>
    </div>
  );
}
