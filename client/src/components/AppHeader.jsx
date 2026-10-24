import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Bell, ScanLine } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AiStatusIndicator } from './ui';
import { aiApi } from '../services/api';

const AppHeader = ({ sidebarWidth = 240 }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [aiStatus, setAiStatus] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data } = await aiApi.getStatus();
        setAiStatus(data.data);
      } catch {
        setAiStatus({ available: false, modelAvailable: false });
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        left: sidebarWidth,
        height: 64,
        background: 'var(--bg-midnight)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        zIndex: 90,
        transition: 'left 0.3s ease',
      }}
    >
      {/* Greeting */}
      <div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          {greeting},{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{user?.name?.split(' ')[0]}</strong>
        </span>
      </div>

      {/* Right section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* AI Status */}
        <AiStatusIndicator status={aiStatus} />

        {/* Quick scan */}
        <button
          onClick={() => navigate('/app/scan')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.4rem 0.9rem',
            background: 'var(--lime)',
            color: '#000',
            border: 'none',
            borderRadius: 20,
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--lime-dim)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--lime)'}
        >
          <ScanLine size={14} />
          Quick Scan
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title="Toggle theme"
          style={{
            background: 'var(--bg-raised)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '0.4rem',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            transition: 'all var(--transition-fast)',
          }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
