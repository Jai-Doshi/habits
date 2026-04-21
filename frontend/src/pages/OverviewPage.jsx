import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { useHabits } from '../context/HabitsContext';
import { localDateStr, todayLocal } from '../lib/date';

function getMonthDates(year, month) {
  const dates = [];
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(localDateStr(new Date(d)));
  }
  return dates;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function OverviewPage() {
  const { habits, logs, getActiveHabitsForDate } = useHabits();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedHabit, setSelectedHabit] = useState(habits[0]?.id ?? null);

  const monthDates = getMonthDates(viewYear, viewMonth);
  const todayStr = todayLocal();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const getCellType = (habitId, date) => {
    if (date > todayStr) return 'future';
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return 'future';
    if (date < habit.startDate || date > habit.endDate) return 'inactive';
    if (logs[habitId]?.[date]) return 'tick';
    return 'cross';
  };

  const getStats = (habitId) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return { total: 0, done: 0, rate: 0, streak: 0, points: 0 };
    const pastDates = monthDates.filter(d => d <= todayStr && d >= habit.startDate && d <= habit.endDate);
    const doneDates = pastDates.filter(d => logs[habitId]?.[d]);
    const rate = pastDates.length > 0 ? Math.round((doneDates.length / pastDates.length) * 100) : 0;

    // streak
    let streak = 0;
    const base = new Date(todayStr);
    for (let i = 0; i <= 365; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      const key = localDateStr(d);
      if (logs[habitId]?.[key]) streak++;
      else if (i > 0) break;
    }

    return { total: pastDates.length, done: doneDates.length, rate, streak, points: doneDates.length * habit.points };
  };

  // Get first day of month for grid alignment
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Habit Overview</h1>
        <p className="page-subtitle">Visual tick &amp; cross view of each habit by date</p>
      </div>

      {/* Month Navigator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button className="btn btn-secondary btn-icon" onClick={prevMonth} id="prev-month-overview">
          <ChevronLeft size={18} />
        </button>
        <span style={{ fontWeight: 700, fontSize: 18, minWidth: 180, textAlign: 'center', color: 'var(--text-primary)' }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button className="btn btn-secondary btn-icon" onClick={nextMonth} id="next-month-overview">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Habit Selector Pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {habits.map(h => (
          <button
            key={h.id}
            onClick={() => setSelectedHabit(h.id)}
            id={`habit-pill-${h.id}`}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              border: `1px solid ${selectedHabit === h.id ? 'rgba(124,58,237,0.5)' : 'var(--border-subtle)'}`,
              background: selectedHabit === h.id ? 'rgba(124,58,237,0.2)' : 'var(--bg-card)',
              color: selectedHabit === h.id ? 'var(--accent-secondary)' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {h.emoji} {h.name}
          </button>
        ))}
      </div>

      {habits.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👀</div>
          <div className="empty-title">No habits to display</div>
          <div className="empty-desc">Add some habits from Profile to see their overview here.</div>
        </div>
      ) : selectedHabit && (() => {
        const habit = habits.find(h => h.id === selectedHabit);
        if (!habit) return null;
        const stats = getStats(selectedHabit);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Stats Row */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div className="stat-card" style={{ '--glow-color': 'rgba(16,185,129,0.2)' }}>
                <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.2)' }}>✅</div>
                <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.done}</div>
                <div className="stat-label">Days Completed</div>
              </div>
              <div className="stat-card" style={{ '--glow-color': 'rgba(239,68,68,0.2)' }}>
                <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.2)' }}>❌</div>
                <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats.total - stats.done}</div>
                <div className="stat-label">Days Missed</div>
              </div>
              <div className="stat-card" style={{ '--glow-color': 'rgba(124,58,237,0.2)' }}>
                <div className="stat-icon" style={{ background: 'rgba(124,58,237,0.2)' }}>📊</div>
                <div className="stat-value">{stats.rate}%</div>
                <div className="stat-label">Completion Rate</div>
              </div>
              <div className="stat-card" style={{ '--glow-color': 'rgba(245,158,11,0.2)' }}>
                <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.2)' }}>⚡</div>
                <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.points}</div>
                <div className="stat-label">Points Earned</div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <span style={{ fontSize: 28 }}>{habit.emoji}</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{habit.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {habit.startDate} → {habit.endDate} · {habit.points} pts/day · {habit.category}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, fontSize: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(16,185,129,0.4)', display: 'inline-block', border: '1px solid rgba(16,185,129,0.5)' }} />
                    Done
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(239,68,68,0.25)', display: 'inline-block', border: '1px solid rgba(239,68,68,0.3)' }} />
                    Missed
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(255,255,255,0.04)', display: 'inline-block', border: '1px solid var(--border-subtle)' }} />
                    N/A
                  </span>
                </div>
              </div>

              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                {/* Empty cells for first day alignment */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {monthDates.map(date => {
                  const cellType = getCellType(selectedHabit, date);
                  const dayNum = new Date(date + 'T00:00:00').getDate();
                  const isToday_ = date === todayStr;

                  return (
                    <div
                      key={date}
                      title={date}
                      style={{
                        aspectRatio: '1',
                        borderRadius: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        fontSize: 12,
                        fontWeight: isToday_ ? 800 : 500,
                        border: isToday_ ? '2px solid rgba(124,58,237,0.6)' : '1px solid',
                        transition: 'transform 0.15s ease',
                        cursor: 'default',
                        ...(cellType === 'tick' ? {
                          background: 'rgba(16,185,129,0.15)',
                          borderColor: 'rgba(16,185,129,0.4)',
                          color: 'var(--success)',
                        } : cellType === 'cross' ? {
                          background: 'rgba(239,68,68,0.1)',
                          borderColor: 'rgba(239,68,68,0.3)',
                          color: 'var(--danger)',
                        } : cellType === 'future' ? {
                          background: 'rgba(255,255,255,0.02)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-muted)',
                          opacity: 0.5,
                        } : {
                          background: 'rgba(255,255,255,0.02)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-muted)',
                          opacity: 0.4,
                        }),
                      }}
                    >
                      <span style={{ fontSize: 10 }}>{dayNum}</span>
                      {cellType === 'tick' && <Check size={12} />}
                      {cellType === 'cross' && <X size={12} />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Linear tick/cross strip - last 21 days */}
            <div className="overview-card">
              <div className="overview-card-header">
                <span style={{ fontSize: 20 }}>{habit.emoji}</span>
                <div className="overview-habit-info">
                  <div className="overview-habit-name">{habit.name}</div>
                  <div className="overview-habit-meta">Last 21 days streak view</div>
                </div>
                <div className="overview-stats">
                  <div className="overview-stat">
                    <div className="overview-stat-val" style={{ color: 'var(--success)' }}>{stats.done}</div>
                    <div className="overview-stat-lbl">Done</div>
                  </div>
                  <div className="overview-stat">
                    <div className="overview-stat-val" style={{ color: 'var(--danger)' }}>{stats.total - stats.done}</div>
                    <div className="overview-stat-lbl">Missed</div>
                  </div>
                  <div className="overview-stat">
                    <div className="overview-stat-val">{stats.streak}🔥</div>
                    <div className="overview-stat-lbl">Streak</div>
                  </div>
                </div>
              </div>
              <div style={{ padding: '14px 20px', overflowX: 'auto' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {Array.from({ length: 21 }).map((_, i) => {
                    const d = new Date(todayStr);
                    d.setDate(d.getDate() - (20 - i));
                    const key = localDateStr(d);
                    const type = getCellType(selectedHabit, key);
                    const dayLabel = d.getDate();
                    return (
                      <div key={key} className="date-col" style={{ minWidth: 36 }}>
                        <div className={`tick-cell ${type === 'tick' ? 'tick' : type === 'cross' ? 'cross' : 'pending'}`} style={{ width: 36, height: 36 }}>
                          {type === 'tick' ? '✓' : type === 'cross' ? '✗' : '·'}
                        </div>
                        <div className="tick-date-label">{dayLabel}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
