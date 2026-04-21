import { supabase, isSupabaseReady } from './supabase';

/* ────────────────────────────────────────────────
   HABITS
──────────────────────────────────────────────── */

/** Fetch all habits for a user */
export async function fetchHabits(userId) {
  if (!isSupabaseReady) return { data: null, error: 'offline' };
  return await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
}

/** Insert a new habit */
export async function createHabit(habit) {
  if (!isSupabaseReady) return { data: null, error: 'offline' };
  return await supabase
    .from('habits')
    .insert([habit])
    .select()
    .single();
}

/** Update an existing habit */
export async function updateHabit(id, updates) {
  if (!isSupabaseReady) return { data: null, error: 'offline' };
  return await supabase
    .from('habits')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
}

/** Delete a habit and its logs */
export async function deleteHabitDb(id) {
  if (!isSupabaseReady) return { error: null };
  // Logs cascade delete via FK, but safe to do manually too
  await supabase.from('habit_logs').delete().eq('habit_id', id);
  return await supabase.from('habits').delete().eq('id', id);
}

/* ────────────────────────────────────────────────
   HABIT LOGS  (daily check-ins)
──────────────────────────────────────────────── */

/**
 * Fetch all logs for a user (all habits, all dates),
 * or optionally for a specific date range.
 */
export async function fetchLogs(userId, fromDate, toDate) {
  if (!isSupabaseReady) return { data: null, error: 'offline' };
  let query = supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId);

  if (fromDate) query = query.gte('log_date', fromDate);
  if (toDate) query = query.lte('log_date', toDate);

  return await query.order('log_date', { ascending: false });
}

/**
 * Toggle a log entry for a habit on a specific date.
 * Uses upsert with conflict on (habit_id, log_date).
 */
export async function toggleLog(habitId, userId, date, completed) {
  if (!isSupabaseReady) return { error: 'offline' };
  if (completed) {
    // Insert or update to completed = true
    return await supabase
      .from('habit_logs')
      .upsert(
        { habit_id: habitId, user_id: userId, log_date: date, completed: true },
        { onConflict: 'habit_id,log_date' }
      );
  } else {
    // Set completed = false (or delete the row)
    return await supabase
      .from('habit_logs')
      .upsert(
        { habit_id: habitId, user_id: userId, log_date: date, completed: false },
        { onConflict: 'habit_id,log_date' }
      );
  }
}

/* ────────────────────────────────────────────────
   USER PROFILE
──────────────────────────────────────────────── */

export async function fetchProfile(userId) {
  if (!isSupabaseReady) return { data: null, error: 'offline' };
  return await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
}

export async function updateProfile(userId, updates) {
  if (!isSupabaseReady) return { data: null, error: 'offline' };
  return await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
}

export async function upsertTotalPoints(userId, totalPoints) {
  if (!isSupabaseReady) return { error: 'offline' };
  return await supabase
    .from('profiles')
    .upsert({ id: userId, total_points: totalPoints }, { onConflict: 'id' });
}
