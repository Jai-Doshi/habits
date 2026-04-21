import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { Home, Eye, BarChart3, User } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HabitsProvider, useHabits } from './context/HabitsContext';
import Sidebar from './components/Sidebar';
import SplashScreen from './components/SplashScreen';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import HomePage from './pages/HomePage';
import OverviewPage from './pages/OverviewPage';
import StatisticsPage from './pages/StatisticsPage';
import ProfilePage from './pages/ProfilePage';

/* ─── Mobile bottom nav ─── */
function BottomNav() {
  const { habits } = useHabits();
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
        {({ isActive }) => (
          <>
            <Home size={22} strokeWidth={isActive ? 2.5 : 2} />
            Today
            {habits.length > 0 && <span className="bottom-nav-badge">{habits.length}</span>}
          </>
        )}
      </NavLink>
      <NavLink to="/overview" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
        {({ isActive }) => (
          <>
            <Eye size={22} strokeWidth={isActive ? 2.5 : 2} />
            Overview
          </>
        )}
      </NavLink>
      <NavLink to="/statistics" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
        {({ isActive }) => (
          <>
            <BarChart3 size={22} strokeWidth={isActive ? 2.5 : 2} />
            Stats
          </>
        )}
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
        {({ isActive }) => (
          <>
            <User size={22} strokeWidth={isActive ? 2.5 : 2} />
            Profile
          </>
        )}
      </NavLink>
    </nav>
  );
}

/* ─── Inner app — only rendered when user is authenticated ─── */
function AuthenticatedApp() {
  const { user } = useAuth();

  return (
    <HabitsProvider userId={user?.id}>
      <BrowserRouter>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/"           element={<HomePage />} />
              <Route path="/overview"   element={<OverviewPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
              <Route path="/profile"    element={<ProfilePage />} />
              <Route path="*"           element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </BrowserRouter>
    </HabitsProvider>
  );
}

/* ─── Auth gate — shows login/signup when not logged in ─── */
function AuthGate() {
  const { user, authLoading, isDemo } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup'

  // Still resolving session
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#06060d',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 40, height: 40, border: '3px solid rgba(124,58,237,0.3)',
          borderTopColor: '#7c3aed', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Demo mode: auto-sign-in with a local demo user (user is set in AuthContext)
  // or real Supabase: user is set after sign-in
  if (user) return <AuthenticatedApp />;

  return authView === 'login'
    ? <LoginPage onSwitchToSignup={() => setAuthView('signup')} />
    : <SignupPage onSwitchToLogin={() => setAuthView('login')} />;
}

/* ─── Root App ─── */
export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AuthProvider>
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}
      <div style={{ opacity: showSplash ? 0 : 1, transition: 'opacity 0.4s ease' }}>
        <AuthGate />
      </div>
    </AuthProvider>
  );
}
