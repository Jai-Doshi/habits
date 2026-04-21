import { useEffect, useState } from 'react';
import './SplashScreen.css';

export default function SplashScreen({ onFinish }) {
  const [phase, setPhase] = useState('enter'); // enter → loaded → exit
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 18 + 4;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => setPhase('exit'), 400);
      }
      setProgress(Math.min(p, 100));
    }, 120);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (phase === 'exit') {
      const t = setTimeout(onFinish, 700);
      return () => clearTimeout(t);
    }
  }, [phase, onFinish]);

  return (
    <div className={`splash ${phase}`}>
      {/* Animated background orbs */}
      <div className="splash-orb splash-orb-1" />
      <div className="splash-orb splash-orb-2" />
      <div className="splash-orb splash-orb-3" />

      {/* Grid overlay */}
      <div className="splash-grid" />

      <div className="splash-content">
        {/* Logo */}
        <div className="splash-logo-wrap">
          <div className="splash-logo-glow" />
          <img
            src="/logo.png"
            alt="HabitFlow Logo"
            className="splash-logo"
            draggable={false}
          />
        </div>

        {/* App Name */}
        <div className="splash-name-wrap">
          <h1 className="splash-name">
            <span className="splash-name-habit">Habit</span>
            <span className="splash-name-flow">Flow</span>
          </h1>
          <p className="splash-tagline">Build habits. Earn points. Transform your life.</p>
        </div>

        {/* Loading bar */}
        <div className="splash-loader">
          <div className="splash-loader-bar">
            <div
              className="splash-loader-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="splash-loader-text">
            {progress < 40 ? 'Setting up your habits...' :
             progress < 75 ? 'Loading your progress...' :
             progress < 100 ? 'Almost ready...' :
             'Welcome back! ✨'}
          </span>
        </div>
      </div>

      {/* Bottom brand */}
      <div className="splash-footer">
        <span>Made with ❤️ for better living</span>
      </div>
    </div>
  );
}
