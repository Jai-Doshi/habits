import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isSupabaseReady } from '../lib/supabase';
import {
  fetchHabits, createHabit, updateHabit, deleteHabitDb,
  fetchLogs, toggleLog, fetchProfile, upsertTotalPoints,
} from '../lib/db';
import { localDateStr, todayLocal } from '../lib/date';

const HabitsContext = createContext(null);

/* ─── Design tokens ─── */
export const HABIT_COLORS = [
  'linear-gradient(135deg, #7c3aed, #a855f7)',
  'linear-gradient(135deg, #ec4899, #f472b6)',
  'linear-gradient(135deg, #10b981, #34d399)',
  'linear-gradient(135deg, #f59e0b, #fbbf24)',
  'linear-gradient(135deg, #3b82f6, #60a5fa)',
  'linear-gradient(135deg, #ef4444, #f87171)',
  'linear-gradient(135deg, #8b5cf6, #a78bfa)',
  'linear-gradient(135deg, #06b6d4, #22d3ee)',
];

/* ─── Demo data — ONLY used when Supabase is not configured ─── */
const generateMockLogs = () => {
  const logs = {};
  const today = new Date();
  for (let i = 30; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = localDateStr(d);
    if (i > 0) logs[key] = Math.random() > 0.3;
  }
  return logs;
};

const DEMO_HABITS = [
  { id: 1, name: 'Morning Meditation',    emoji: '🧘', points: 3, color: HABIT_COLORS[0], startDate: '2026-04-01', endDate: '2026-12-31', category: 'Wellness' },
  { id: 2, name: 'Read 30 Minutes',       emoji: '📚', points: 4, color: HABIT_COLORS[4], startDate: '2026-04-01', endDate: '2026-12-31', category: 'Learning' },
  { id: 3, name: 'Drink 8 Glasses Water', emoji: '💧', points: 2, color: HABIT_COLORS[2], startDate: '2026-04-01', endDate: '2026-12-31', category: 'Health' },
  { id: 4, name: 'Exercise 30 Min',       emoji: '🏋️', points: 5, color: HABIT_COLORS[1], startDate: '2026-04-05', endDate: '2026-12-31', category: 'Fitness' },
  { id: 5, name: 'No Social Media',       emoji: '📵', points: 3, color: HABIT_COLORS[3], startDate: '2026-04-10', endDate: '2026-06-30', category: 'Mindfulness' },
];

/* ─── Row mappers ─── */
const rowToHabit = (row) => ({
  id: row.id,
  name: row.name,
  emoji: row.emoji,
  points: row.points,
  color: row.color || HABIT_COLORS[0],
  startDate: row.start_date,
  endDate: row.end_date,
  category: row.category || 'Other',
});

const habitToRow = (habit, userId) => ({
  user_id: userId,
  name: habit.name,
  emoji: habit.emoji,
  points: habit.points,
  color: habit.color,
  start_date: habit.startDate,
  end_date: habit.endDate,
  category: habit.category,
});

const rowsToLogsMap = (rows) => {
  const map = {};
  for (const row of rows) {
    if (!map[row.habit_id]) map[row.habit_id] = {};
    map[row.habit_id][row.log_date] = row.completed;
  }
  return map;
};

/* ────────────────────────────────────────────────────────────
   Provider — accepts userId prop from AuthContext
──────────────────────────────────────────────────────────── */
export function HabitsProvider({ children, userId }) {
  const [habits, setHabits]             = useState([]);
  const [logs, setLogs]                 = useState({});
  const [selectedDate, setSelectedDate] = useState(todayLocal());
  const [totalPoints, setTotalPoints]   = useState(0);
  const [loading, setLoading]           = useState(true);
  const [dbMode, setDbMode]             = useState(isSupabaseReady && userId ? 'supabase' : 'demo');

  /* ─── Reload whenever the logged-in user changes ─── */
  useEffect(() => {
    // ── DEMO MODE: no Supabase configured ──
    if (!isSupabaseReady) {
      const demoLogs = {};
      DEMO_HABITS.forEach(h => { demoLogs[h.id] = generateMockLogs(); });
      setHabits(DEMO_HABITS);
      setLogs(demoLogs);
      setTotalPoints(1240);
      setDbMode('demo');
      setLoading(false);
      return;
    }

    // ── Supabase ready but no user yet (auth still resolving) ──
    if (!userId) {
      setHabits([]);
      setLogs({});
      setTotalPoints(0);
      setLoading(false);
      return;
    }

    // ── SUPABASE MODE: load real user data ──
    setDbMode('supabase');
    setLoading(true);

    const load = async () => {
      try {
        // 1. Habits
        const { data: habitRows, error: hErr } = await fetchHabits(userId);
        if (hErr) {
          // Real DB error (e.g. RLS, network) — show empty, log the error
          console.error('fetchHabits error:', hErr);
          setHabits([]);
          setLogs({});
          setTotalPoints(0);
          return;
        }

        // 2. Logs (last 365 days)
        const from = new Date();
        from.setFullYear(from.getFullYear() - 1);
        const { data: logRows } = await fetchLogs(
          userId,
          localDateStr(from),
          todayLocal()
        );

        // 3. Profile (for total_points)
        const { data: profile } = await fetchProfile(userId);

        // Set real data — even if empty arrays, that's correct
        setHabits((habitRows || []).map(rowToHabit));
        setLogs(rowsToLogsMap(logRows || []));
        setTotalPoints(profile?.total_points ?? 0);

      } catch (err) {
        // Unexpected exception — clear state but don't load demo data
        console.error('HabitsProvider load error:', err);
        setHabits([]);
        setLogs({});
        setTotalPoints(0);
      } finally {
        // Always release the loading lock
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  /* ─── TOGGLE ─── */
  const toggleHabit = useCallback(async (habitId, date) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const wasChecked = !!logs[habitId]?.[date];
    const nowChecked = !wasChecked;
    const delta = nowChecked ? habit.points : -habit.points;

    // Optimistic update
    setLogs(prev => ({ ...prev, [habitId]: { ...(prev[habitId] || {}), [date]: nowChecked } }));
    setTotalPoints(p => Math.max(0, p + delta));

    if (isSupabaseReady && dbMode === 'supabase' && userId) {
      const { error } = await toggleLog(habitId, userId, date, nowChecked);
      if (error) {
        // Rollback on failure
        setLogs(prev => ({ ...prev, [habitId]: { ...(prev[habitId] || {}), [date]: wasChecked } }));
        setTotalPoints(p => Math.max(0, p - delta));
        console.error('toggleLog error:', error);
        return;
      }
      await upsertTotalPoints(userId, Math.max(0, totalPoints + delta));
    }
  }, [habits, logs, totalPoints, dbMode, userId]);

  /* ─── ADD ─── */
  const addHabit = useCallback(async (habit) => {
    const color = HABIT_COLORS[habits.length % HABIT_COLORS.length];
    const newHabit = { ...habit, color: habit.color || color };

    if (isSupabaseReady && dbMode === 'supabase' && userId) {
      const { data: newRow, error } = await createHabit(habitToRow(newHabit, userId));
      if (error) { console.error('createHabit error:', error); return; }
      if (newRow) {
        setHabits(prev => [...prev, rowToHabit(newRow)]);
        setLogs(prev => ({ ...prev, [newRow.id]: {} }));
        return;
      }
    }
    // Demo / local fallback
    const withId = { ...newHabit, id: Date.now() };
    setHabits(prev => [...prev, withId]);
    setLogs(prev => ({ ...prev, [withId.id]: {} }));
  }, [habits, dbMode, userId]);

  /* ─── EDIT ─── */
  const editHabit = useCallback(async (id, updates) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
    if (isSupabaseReady && dbMode === 'supabase' && userId) {
      const { error } = await updateHabit(id, habitToRow(updates, userId));
      if (error) console.error('updateHabit error:', error);
    }
  }, [dbMode, userId]);

  /* ─── DELETE ─── */
  const deleteHabit = useCallback(async (id) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setLogs(prev => { const n = { ...prev }; delete n[id]; return n; });
    if (isSupabaseReady && dbMode === 'supabase') {
      const { error } = await deleteHabitDb(id);
      if (error) console.error('deleteHabit error:', error);
    }
  }, [dbMode]);

  /* ─── HELPERS ─── */
  const getActiveHabitsForDate = useCallback((date) =>
    habits.filter(h => h.startDate <= date && h.endDate >= date), [habits]);

  const getDayCompletion = useCallback((date) => {
    const active = getActiveHabitsForDate(date);
    if (!active.length) return 0;
    return Math.round(active.filter(h => logs[h.id]?.[date]).length / active.length * 100);
  }, [getActiveHabitsForDate, logs]);

  return (
    <HabitsContext.Provider value={{
      habits, logs, selectedDate, setSelectedDate, totalPoints,
      loading, dbMode,
      toggleHabit, addHabit, editHabit, deleteHabit,
      getActiveHabitsForDate, getDayCompletion, HABIT_COLORS,
    }}>
      {children}
    </HabitsContext.Provider>
  );
}

export const useHabits = () => useContext(HabitsContext);
