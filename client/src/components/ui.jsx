import { motion } from 'framer-motion';

// Stat Card
export const DashboardStatCard = ({ title, value, subtitle, icon: Icon, color = 'purple', trend }) => {
  const colors = {
    purple: { accent: 'var(--purple)', glow: 'var(--purple-glow)', bg: 'rgba(167,139,250,0.08)' },
    lime: { accent: 'var(--lime)', glow: 'var(--lime-glow)', bg: 'rgba(199,255,77,0.08)' },
    orange: { accent: 'var(--orange)', glow: 'var(--orange-glow)', bg: 'rgba(255,157,77,0.08)' },
    red: { accent: 'var(--red)', glow: 'var(--red-glow)', bg: 'rgba(255,77,106,0.08)' },
  };
  const c = colors[color] || colors.purple;

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: `0 8px 32px ${c.glow}` }}
      transition={{ duration: 0.2 }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 80,
          height: 80,
          background: `radial-gradient(circle, ${c.glow} 0%, transparent 70%)`,
          borderRadius: '0 var(--radius-lg) 0 100%',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          {title}
        </span>
        {Icon && (
          <div style={{ padding: '0.4rem', background: c.bg, borderRadius: 'var(--radius-sm)', display: 'flex' }}>
            <Icon size={16} color={c.accent} />
          </div>
        )}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Space Grotesk, sans-serif', color: c.accent, lineHeight: 1 }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{subtitle}</div>
      )}
      {trend !== undefined && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: trend >= 0 ? 'var(--lime)' : 'var(--red)' }}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% this week
        </div>
      )}
    </motion.div>
  );
};

// Loading Skeleton
export const LoadingSkeleton = ({ width = '100%', height = 20, radius = 6, style = {} }) => (
  <div
    className="skeleton"
    style={{
      width,
      height,
      borderRadius: radius,
      background: 'linear-gradient(90deg, var(--bg-card) 25%, var(--bg-raised) 50%, var(--bg-card) 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-shimmer 1.5s infinite',
      ...style,
    }}
  />
);

// Empty State
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
    {Icon && (
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'var(--purple-glow)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '1.5rem',
        border: '1px solid var(--border)',
      }}>
        <Icon size={36} color="var(--purple)" />
      </div>
    )}
    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{title}</h3>
    <p style={{ color: 'var(--text-muted)', maxWidth: 360, marginBottom: '2rem', fontSize: '0.9rem' }}>{description}</p>
    {action}
  </div>
);

// Error State
export const ErrorState = ({ message, onRetry }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', textAlign: 'center' }}>
    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn btn-secondary">Retry</button>
    )}
  </div>
);

// Badge
export const FileCategoryBadge = ({ category }) => {
  const badgeColors = {
    images: { bg: 'rgba(167,139,250,0.15)', color: 'var(--purple)' },
    videos: { bg: 'rgba(255,157,77,0.15)', color: 'var(--orange)' },
    audio: { bg: 'rgba(199,255,77,0.15)', color: 'var(--lime-dim)' },
    documents: { bg: 'rgba(100,180,255,0.15)', color: '#64B4FF' },
    archives: { bg: 'rgba(255,200,100,0.15)', color: '#FFC864' },
    code: { bg: 'rgba(100,255,180,0.15)', color: '#64FFB4' },
    data: { bg: 'rgba(180,100,255,0.15)', color: '#B464FF' },
    temporary: { bg: 'rgba(255,77,106,0.15)', color: 'var(--red)' },
    unknown: { bg: 'rgba(184,176,199,0.15)', color: 'var(--text-muted)' },
  };

  const style = badgeColors[category] || badgeColors.unknown;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.2rem 0.6rem',
      borderRadius: 20,
      fontSize: '0.7rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      background: style.bg,
      color: style.color,
    }}>
      {category}
    </span>
  );
};

// Progress Bar
export const ProgressBar = ({ value, max = 100, color = 'lime', label }) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colorMap = { lime: 'var(--lime)', purple: 'var(--purple)', orange: 'var(--orange)', red: 'var(--red)' };

  return (
    <div>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>{label}</span>
          <span style={{ fontWeight: 700, color: colorMap[color] }}>{pct}%</span>
        </div>
      )}
      <div style={{ height: 8, background: 'var(--bg-raised)', borderRadius: 4, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${colorMap[color]}88, ${colorMap[color]})`,
            borderRadius: 4,
          }}
        />
      </div>
    </div>
  );
};

// Clutter Debt Gauge (0-100)
export const ClutterDebtGauge = ({ score }) => {
  const getColor = (s) => {
    if (s < 30) return 'var(--lime)';
    if (s < 60) return 'var(--orange)';
    return 'var(--red)';
  };

  const getLabel = (s) => {
    if (s < 20) return 'Squeaky Clean';
    if (s < 40) return 'Mild Clutter';
    if (s < 60) return 'Getting Messy';
    if (s < 80) return 'Quite Cluttered';
    return 'Digital Chaos';
  };

  const circumference = 2 * Math.PI * 60;
  const progress = circumference - (score / 100) * circumference;
  const color = getColor(score);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ position: 'relative', width: 160, height: 160 }}>
        <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="80" cy="80" r="60" fill="none" stroke="var(--bg-raised)" strokeWidth="12" />
          <motion.circle
            cx="80" cy="80" r="60"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: progress }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'Space Grotesk', color }}>{score}</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Clutter Score</span>
        </div>
      </div>
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color }}>{getLabel(score)}</span>
    </div>
  );
};

// AI Status Indicator
export const AiStatusIndicator = ({ status }) => {
  const isAvail = status?.available && status?.modelAvailable;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.4rem',
      padding: '0.3rem 0.75rem',
      background: isAvail ? 'rgba(199,255,77,0.1)' : 'rgba(255,77,106,0.1)',
      borderRadius: 20,
      border: `1px solid ${isAvail ? 'rgba(199,255,77,0.3)' : 'rgba(255,77,106,0.3)'}`,
      fontSize: '0.75rem',
      fontWeight: 600,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: isAvail ? 'var(--lime)' : 'var(--red)',
        boxShadow: isAvail ? '0 0 6px var(--lime)' : '0 0 6px var(--red)',
        animation: isAvail ? 'pulse 2s infinite' : 'none',
      }} />
      <span style={{ color: isAvail ? 'var(--lime)' : 'var(--red)' }}>
        {isAvail ? `AI: ${status.model}` : 'AI: Offline'}
      </span>
    </div>
  );
};
