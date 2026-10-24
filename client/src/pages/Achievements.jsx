import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ProgressBar } from '../components/ui';

const ACHIEVEMENTS = [
  {
    id: 'first_scan',
    emoji: '🔍',
    name: 'First Scan',
    desc: 'Complete your first folder scan.',
    condition: (user) => user.totalScans >= 1,
    progress: (user) => Math.min(1, user.totalScans / 1),
    detail: 'Run a scan to unlock',
    color: 'var(--purple)',
    glow: 'var(--purple-glow)',
  },
  {
    id: 'clutter_crusher',
    emoji: '💥',
    name: 'Clutter Crusher',
    desc: 'Organize 10 or more files.',
    condition: (user) => user.totalFilesOrganized >= 10,
    progress: (user) => Math.min(1, user.totalFilesOrganized / 10),
    detail: (user) => `${user.totalFilesOrganized}/10 files organized`,
    color: 'var(--orange)',
    glow: 'var(--orange-glow)',
  },
  {
    id: 'duplicate_detective',
    emoji: '🕵️',
    name: 'Duplicate Detective',
    desc: 'Identify your first group of duplicate files.',
    condition: (user) => user.totalScans >= 1,
    progress: (user) => user.totalScans >= 1 ? 1 : 0,
    detail: 'Scan with duplicate detection enabled',
    color: 'var(--red)',
    glow: 'var(--red-glow)',
  },
  {
    id: 'clean_sweep',
    emoji: '✨',
    name: 'Clean Sweep',
    desc: 'Organize 50 or more files.',
    condition: (user) => user.totalFilesOrganized >= 50,
    progress: (user) => Math.min(1, user.totalFilesOrganized / 50),
    detail: (user) => `${user.totalFilesOrganized}/50 files organized`,
    color: 'var(--lime)',
    glow: 'var(--lime-glow)',
  },
  {
    id: 'consistency_champion',
    emoji: '🔥',
    name: 'Consistency Champion',
    desc: 'Complete cleanup sessions 3 days in a row.',
    condition: (user) => (user.cleanStreak || 0) >= 3,
    progress: (user) => Math.min(1, (user.cleanStreak || 0) / 3),
    detail: (user) => `${user.cleanStreak || 0}/3 day streak`,
    color: 'var(--orange)',
    glow: 'var(--orange-glow)',
  },
];

const Achievements = () => {
  const { user } = useAuth();

  if (!user) return null;

  const unlocked = ACHIEVEMENTS.filter((a) => a.condition(user));
  const locked = ACHIEVEMENTS.filter((a) => !a.condition(user));
  const totalPoints = unlocked.length * 100;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '1.75rem', marginBottom: '0.25rem' }}>Achievements</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Earned through real completed cleanup actions — no shortcuts.
        </p>
      </div>

      {/* Points summary */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)', padding: '2rem', marginBottom: '2rem',
        display: 'flex', alignItems: 'center', gap: '2rem',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--lime)' }}>{totalPoints}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Points</div>
        </div>
        <div style={{ width: 1, height: 60, background: 'var(--border)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--purple)' }}>{unlocked.length}/{ACHIEVEMENTS.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Unlocked</div>
        </div>
        <div style={{ width: 1, height: 60, background: 'var(--border)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--orange)' }}>{user.cleanStreak || 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Day Streak</div>
        </div>
        <div style={{ flex: 1 }}>
          <ProgressBar value={unlocked.length} max={ACHIEVEMENTS.length} color="lime" label="Collection progress" />
        </div>
      </div>

      {/* Unlocked */}
      {unlocked.length > 0 && (
        <>
          <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', marginBottom: '1rem', color: 'var(--lime)' }}>
            ✓ Unlocked
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {unlocked.map((a) => (
              <motion.div
                key={a.id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ y: -3 }}
                style={{
                  background: `linear-gradient(135deg, ${a.glow}, transparent)`,
                  border: `1px solid ${a.color}44`,
                  borderRadius: 'var(--radius-lg)', padding: '1.5rem',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', top: 8, right: 12, fontSize: '0.7rem', fontWeight: 700, color: a.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  +100 pts
                </div>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{a.emoji}</div>
                <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', color: a.color, marginBottom: '0.4rem' }}>{a.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <>
          <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
            🔒 Locked
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {locked.map((a) => (
              <div
                key={a.id}
                style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', padding: '1.5rem',
                  opacity: 0.7,
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', filter: 'grayscale(100%)' }}>{a.emoji}</div>
                <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{a.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: '1rem' }}>{a.desc}</p>
                <ProgressBar value={a.progress(user) * 100} color="purple" />
                <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                  {typeof a.detail === 'function' ? a.detail(user) : a.detail}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
        ℹ️ Points are based on actual completed cleanup operations. No points are awarded for risky or automatic file deletions.
      </div>
    </div>
  );
};

export default Achievements;
