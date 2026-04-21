import { useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useHabits } from '../context/HabitsContext';
import { localDateStr, todayLocal } from '../lib/date';

const TABS = ['Daily', 'Weekly', 'Monthly', 'Yearly'];

const CHART_COLORS = ['#7c3aed', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-medium)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 14px',
      fontSize: 13,
    }}>
      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{label}</div>
      {payload.map((e, i) => (
        <div key={i} style={{ color: e.color, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>●</span><span>{e.name}: <b>{e.value}</b></span>
        </div>
      ))}
    </div>
  );
};

export default function StatisticsPage() {
  const { habits, logs } = useHabits();
  const [activeTab, setActiveTab] = useState(0);
  const today = todayLocal();

  // ---- DATA GENERATORS ----
  const dailyData = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const key = localDateStr(d);
      const activeHabits = habits.filter(h => h.startDate <= key && h.endDate >= key);
      const done = activeHabits.filter(h => logs[h.id]?.[key]).length;
      const points = activeHabits.filter(h => logs[h.id]?.[key]).reduce((s, h) => s + h.points, 0);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { label: key === today ? 'Today' : label, done, total: activeHabits.length, rate: activeHabits.length ? Math.round(done / activeHabits.length * 100) : 0, points };
    });
  }, [habits, logs, today]);

  const weeklyData = useMemo(() => {
    return Array.from({ length: 12 }).map((_, wi) => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() - (11 - wi) * 7);
      let done = 0, total = 0, points = 0;
      for (let di = 0; di < 7; di++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + di);
        const key = localDateStr(d);
        const active = habits.filter(h => h.startDate <= key && h.endDate >= key);
        total += active.length;
        const doneHere = active.filter(h => logs[h.id]?.[key]);
        done += doneHere.length;
        points += doneHere.reduce((s, h) => s + h.points, 0);
      }
      const label = `W${wi + 1}`;
      return { label, done, total, rate: total ? Math.round(done / total * 100) : 0, points };
    });
  }, [habits, logs]);

  const monthlyData = useMemo(() => {
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return Array.from({ length: 6 }).map((_, mi) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - mi));
      const year = d.getFullYear();
      const month = d.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      let done = 0, total = 0, points = 0;
      for (let day = 1; day <= daysInMonth; day++) {
        const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (key > today) break;
        const active = habits.filter(h => h.startDate <= key && h.endDate >= key);
        total += active.length;
        const doneHere = active.filter(h => logs[h.id]?.[key]);
        done += doneHere.length;
        points += doneHere.reduce((s, h) => s + h.points, 0);
      }
      return { label: MONTHS[month], done, total, rate: total ? Math.round(done / total * 100) : 0, points };
    });
  }, [habits, logs, today]);

  const yearlyData = useMemo(() => {
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const currentYear = new Date().getFullYear();
    return MONTHS.map((label, mi) => {
      const daysInMonth = new Date(currentYear, mi + 1, 0).getDate();
      let done = 0, total = 0, points = 0;
      for (let day = 1; day <= daysInMonth; day++) {
        const key = `${currentYear}-${String(mi + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (key > today) break;
        const active = habits.filter(h => h.startDate <= key && h.endDate >= key);
        total += active.length;
        const doneHere = active.filter(h => logs[h.id]?.[key]);
        done += doneHere.length;
        points += doneHere.reduce((s, h) => s + h.points, 0);
      }
      return { label, done, total, rate: total ? Math.round(done / total * 100) : 0, points };
    });
  }, [habits, logs, today]);

  // Habit breakdown for pie chart
  const habitBreakdown = useMemo(() => {
    return habits.map(h => {
      const allDates = Object.keys(logs[h.id] || {});
      const done = allDates.filter(d => logs[h.id][d]).length;
      const pts = done * h.points;
      return { name: h.name, emoji: h.emoji, value: pts, done, color: '' };
    });
  }, [habits, logs]);

  // Per-habit radar data (last 7 days completion rate)
  const radarData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = localDateStr(d);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      const row = { label };
      habits.slice(0, 4).forEach(h => {
        row[h.name.split(' ')[0]] = logs[h.id]?.[key] ? 1 : 0;
      });
      return row;
    });
  }, [habits, logs]);

  const data = [dailyData, weeklyData, monthlyData, yearlyData][activeTab];

  const totalDone = data.reduce((s, d) => s + d.done, 0);
  const totalPoints_ = data.reduce((s, d) => s + d.points, 0);
  const avgRate = data.length ? Math.round(data.reduce((s, d) => s + d.rate, 0) / data.length) : 0;
  const bestPeriod = data.reduce((best, d) => d.rate > (best?.rate ?? 0) ? d : best, null);

  return (
    <div className="page-container">
      <div className="page-header-row" style={{ marginBottom: 24 }}>
        <div className="page-header" style={{ margin: 0 }}>
          <h1 className="page-title">Statistics</h1>
          <p className="page-subtitle">Track your progress across all time ranges</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="stats-tabs" style={{ maxWidth: 480 }}>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            className={`stats-tab ${activeTab === i ? 'active' : ''}`}
            onClick={() => setActiveTab(i)}
            id={`stats-tab-${tab.toLowerCase()}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card" style={{ '--glow-color': 'rgba(124,58,237,0.2)' }}>
          <div className="stat-icon" style={{ background: 'rgba(124,58,237,0.2)', fontSize: 18 }}>📈</div>
          <div className="stat-value">{avgRate}%</div>
          <div className="stat-label">Avg Completion</div>
        </div>
        <div className="stat-card" style={{ '--glow-color': 'rgba(16,185,129,0.2)' }}>
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.2)', fontSize: 18 }}>✅</div>
          <div className="stat-value">{totalDone}</div>
          <div className="stat-label">Habits Completed</div>
        </div>
        <div className="stat-card" style={{ '--glow-color': 'rgba(245,158,11,0.2)' }}>
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.2)', fontSize: 18 }}>⚡</div>
          <div className="stat-value">{totalPoints_}</div>
          <div className="stat-label">Points Earned</div>
        </div>
        <div className="stat-card" style={{ '--glow-color': 'rgba(59,130,246,0.2)' }}>
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.2)', fontSize: 18 }}>🏆</div>
          <div className="stat-value">{bestPeriod?.label ?? '–'}</div>
          <div className="stat-label">Best Period ({bestPeriod?.rate ?? 0}%)</div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Completion Rate Area Chart */}
        <div className="chart-card">
          <div className="chart-title">Completion Rate</div>
          <div className="chart-subtitle">% of habits completed per {TABS[activeTab].toLowerCase()} period</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="rate" name="Completion %" stroke="#7c3aed" strokeWidth={2.5} fill="url(#areaGrad)" dot={{ fill: '#7c3aed', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="charts-grid">
          {/* Points Bar Chart */}
          <div className="chart-card">
            <div className="chart-title">Points Earned</div>
            <div className="chart-subtitle">Total points per {TABS[activeTab].toLowerCase()} period</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="points" name="Points" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Done vs Total */}
          <div className="chart-card">
            <div className="chart-title">Done vs Active</div>
            <div className="chart-subtitle">Habits completed vs active habits</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Active" fill="rgba(255,255,255,0.08)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="done" name="Done" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="charts-grid">
          {/* Habit Points Pie */}
          <div className="chart-card">
            <div className="chart-title">Points by Habit</div>
            <div className="chart-subtitle">Total points earned per habit (all time)</div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={habitBreakdown.filter(h => h.value > 0)}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {habitBreakdown.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} formatter={(v, n) => [v + ' pts', n]} />
                <Legend
                  formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Daily trend line */}
          <div className="chart-card">
            <div className="chart-title">Trend Line</div>
            <div className="chart-subtitle">Completion rate movement</div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="rate" name="Rate" stroke="#ec4899" strokeWidth={2.5} dot={{ fill: '#ec4899', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Per-habit Table */}
        <div className="chart-card">
          <div className="chart-title">Habit Leaderboard</div>
          <div className="chart-subtitle">Ranked by total points earned</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 16 }}>
            {[...habitBreakdown].sort((a, b) => b.value - a.value).map((h, i) => {
              const maxVal = habitBreakdown.reduce((m, x) => Math.max(m, x.value), 1);
              return (
                <div key={h.name} className="leaderboard-item">
                  <div className={`leaderboard-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}`}>
                    #{i + 1}
                  </div>
                  <span style={{ fontSize: 20 }}>{h.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{h.name}</div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${maxVal > 0 ? (h.value / maxVal) * 100 : 0}%`,
                        background: `linear-gradient(90deg, ${CHART_COLORS[i % CHART_COLORS.length]}, ${CHART_COLORS[(i + 1) % CHART_COLORS.length]})`,
                        borderRadius: 3,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--warning)' }}>⚡ {h.value}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{h.done} days</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
