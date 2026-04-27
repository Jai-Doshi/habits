import { useState } from 'react';
import { Check, Flame, Star, Plus, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { useHabits } from '../context/HabitsContext';
import { useAuth } from '../context/AuthContext';
import AddHabitModal from '../components/AddHabitModal';
import { localDateStr, todayLocal } from '../lib/date';

function getWeekDates(centerDate) {
  const dates = [];
  const center = new Date(centerDate);
  const day = center.getDay();
  const startOfWeek = new Date(center);
  startOfWeek.setDate(center.getDate() - day);
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    dates.push(localDateStr(d));
  }
  return dates;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function ProgressRing({ value, max, size = 100, stroke = 8, color }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? value / max : 0;
  const offset = circumference - pct * circumference;

  return (
    <div className="progress-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="url(#ringGrad)" strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      <div className="progress-ring-center">
        <span className="ring-value" style={{ fontSize: size > 90 ? 22 : 16 }}>{value}/{max}</span>
        <span className="ring-label">done</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { habits, logs, selectedDate, setSelectedDate, toggleHabit, getActiveHabitsForDate, getDayCompletion, totalPoints } = useHabits();
  const { displayName } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  const today = todayLocal();
  const centerDate = new Date();
  centerDate.setDate(centerDate.getDate() + weekOffset * 7);
  const weekDates = getWeekDates(localDateStr(centerDate));

  const activeHabits = getActiveHabitsForDate(selectedDate);
  const completedCount = activeHabits.filter(h => logs[h.id]?.[selectedDate]).length;
  const isToday = selectedDate === today;

  const currentDateObj = new Date(selectedDate + 'T00:00:00');
  const formattedDate = currentDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // const { displayName } = useAuth();
  const getStreak = (habitId) => {
    let streak = 0;
    const todayDate = new Date(today);
    for (let i = 0; i <= 365; i++) {
      const d = new Date(todayDate);
      d.setDate(d.getDate() - i);
      const key = localDateStr(d);
      if (logs[habitId]?.[key]) streak++;
      else if (i > 0) break;
    }
    return streak;
  };

  return (
    <div className="page-container">
      {/* Banner */}
      <div className="today-banner">
        <div className="banner-text">
          <div className="banner-greeting">
            {isToday ? `${new Date().getHours() < 12 ? '🌅 Good morning' : new Date().getHours() < 17 ? '☀️ Good afternoon' : '🌙 Good evening'}, ${displayName}!` : `📅 ${formattedDate}`}
          </div>
          <div className="banner-title">
            {isToday ? 'Let\'s crush your habits today' : formattedDate}
          </div>
          <div className="banner-subtitle">
            {completedCount}/{activeHabits.length} habits completed · <Zap size={12} style={{ display: 'inline', marginRight: 2 }} />{totalPoints.toLocaleString()} total points
          </div>
        </div>
        <ProgressRing value={completedCount} max={activeHabits.length} size={100} stroke={9} />
      </div>

      {/* Week Date Strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <button className="btn btn-ghost btn-icon" onClick={() => setWeekOffset(w => w - 1)} id="prev-week">
          <ChevronLeft size={18} />
        </button>
        <div className="date-strip" style={{ flex: 1, marginBottom: 0 }}>
          {weekDates.map((date, i) => {
            const completion = getDayCompletion(date);
            const isSelected = date === selectedDate;
            const isTodayChip = date === today;
            return (
              <button
                key={date}
                className={`date-chip ${isSelected ? 'today' : ''} ${completion > 0 ? 'has-data' : ''}`}
                onClick={() => setSelectedDate(date)}
                id={`date-chip-${date}`}
                style={{ flex: 1 }}
              >
                <span className="date-day">{DAY_LABELS[i]}</span>
                <span className="date-num" style={{ color: isTodayChip ? 'var(--accent-tertiary)' : undefined }}>
                  {new Date(date + 'T00:00:00').getDate()}
                </span>
                <div className="date-dot" style={{ background: completion === 100 ? 'var(--success)' : completion > 0 ? 'var(--warning)' : undefined }} />
              </button>
            );
          })}
        </div>
        <button className="btn btn-ghost btn-icon" onClick={() => setWeekOffset(w => w + 1)} id="next-week">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Header row */}
      <div className="page-header-row" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 22 }}>
            {isToday ? "Today's Habits" : `Habits for ${formattedDate}`}
          </h1>
          <p className="page-subtitle" style={{ fontSize: 13 }}>
            {activeHabits.length} habits active · Tap to check off
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="add-habit-btn">
          <Plus size={16} /> Add Habit
        </button>
      </div>

      {/* Habit List */}
      {activeHabits.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌱</div>
          <div className="empty-title">No habits for this date</div>
          <div className="empty-desc">Add habits from Profile or click "Add Habit" to get started tracking your daily routines.</div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Create Your First Habit
          </button>
        </div>
      ) : (
        <div className="habits-grid">
          {activeHabits.map(habit => {
            const isChecked = !!logs[habit.id]?.[selectedDate];
            const streak = getStreak(habit.id);
            return (
              <div
                key={habit.id}
                className={`habit-row ${isChecked ? 'completed' : ''}`}
                style={{ '--habit-color': habit.color }}
              >
                <span className="habit-emoji">{habit.emoji}</span>
                <div className="habit-info">
                  <div className="habit-name" style={{ textDecoration: isChecked ? 'line-through' : 'none', opacity: isChecked ? 0.7 : 1 }}>
                    {habit.name}
                  </div>
                  <div className="habit-meta">
                    <div className="habit-points">
                      <div className="points-stars">
                        {[1, 2, 3, 4, 5].map(s => (
                          <span key={s} className={`star ${s <= habit.points ? '' : 'empty'}`}>★</span>
                        ))}
                      </div>
                      <span style={{ fontWeight: 600 }}>{habit.points} pts</span>
                    </div>
                    {streak > 0 && (
                      <div className="habit-streak">
                        <Flame size={12} /> {streak}d streak
                      </div>
                    )}
                    <span style={{ color: 'var(--text-muted)' }}>{habit.category}</span>
                  </div>
                </div>

                {/* Points earned chip */}
                {isChecked && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--warning)', fontSize: 12, fontWeight: 700 }}>
                    <Star size={12} fill="currentColor" />
                    +{habit.points}
                  </div>
                )}

                <button
                  className={`habit-check ${isChecked ? 'checked' : ''}`}
                  onClick={() => toggleHabit(habit.id, selectedDate)}
                  id={`check-habit-${habit.id}`}
                  aria-label={`Mark ${habit.name} as ${isChecked ? 'incomplete' : 'complete'}`}
                >
                  {isChecked && <Check size={16} className="check-anim" />}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary if all done */}
      {completedCount === activeHabits.length && activeHabits.length > 0 && (
        <div style={{
          marginTop: 24,
          padding: '20px 24px',
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <span style={{ fontSize: 32 }}>🎉</span>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: 16 }}>All habits completed!</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              You earned {activeHabits.reduce((s, h) => s + h.points, 0)} points today. Keep the streak going!
            </div>
          </div>
        </div>
      )}

      {showModal && <AddHabitModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
