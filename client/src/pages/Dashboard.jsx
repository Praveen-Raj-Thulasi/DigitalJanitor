import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ScanLine, Files, Copy, Zap, TrendingUp, Clock, Award, Activity, ArrowRight, FolderOpen
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';
import { scansApi, cleanupApi, activityApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DashboardStatCard, ClutterDebtGauge, LoadingSkeleton, EmptyState, FileCategoryBadge } from '../components/ui';
import { formatBytes } from '../utils/filesystem';

const CATEGORY_COLORS = {
  images: '#A78BFA', videos: '#FF9D4D', audio: '#C7FF4D',
  documents: '#64B4FF', archives: '#FFC864', code: '#64FFB4',
  data: '#B464FF', temporary: '#FF4D6A', unknown: '#7B7390',
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [scans, setScans] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, scansRes, actRes] = await Promise.all([
          scansApi.getStats(),
          scansApi.getAll({ limit: 5 }),
          activityApi.getAll({ limit: 10 }),
        ]);
        setStats(statsRes.data.data);
        setScans(scansRes.data.data);
        setActivity(actRes.data.data);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const hasData = scans.length > 0;

  // Compute pie chart data from latest scan
  const latestScan = stats?.latestScan;
  const pieData = latestScan
    ? Object.entries(latestScan.categoryCounts || {})
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }))
    : [];

  const statCards = [
    {
      title: 'Clutter Debt Score',
      value: stats?.latestClutterScore ?? 0,
      subtitle: 'Latest scan — lower is better',
      icon: TrendingUp,
      color: stats?.latestClutterScore > 60 ? 'red' : stats?.latestClutterScore > 30 ? 'orange' : 'lime',
    },
    {
      title: 'Files Scanned',
      value: stats?.totalFilesScanned?.toLocaleString() ?? 0,
      subtitle: `Across ${stats?.totalScans ?? 0} scans`,
      icon: Files,
      color: 'purple',
    },
    {
      title: 'Duplicate Space',
      value: formatBytes(stats?.totalDuplicateSpace ?? 0),
      subtitle: 'Potential savings from duplicates',
      icon: Copy,
      color: 'orange',
    },
    {
      title: 'Cleanup Progress',
      value: `${stats?.cleanupProgress ?? 0}%`,
      subtitle: `${stats?.totalExecuted ?? 0} of ${stats?.totalApproved ?? 0} actions applied`,
      icon: Zap,
      color: 'lime',
    },
  ];

  const eventLabels = {
    scan_completed: '🔍 Scan completed',
    plan_created: '📋 Cleanup plan created',
    action_approved: '✅ Action approved',
    action_executed: '✨ File organized',
    action_failed: '❌ Action failed',
    achievement_unlocked: '🏆 Achievement unlocked',
    scan_started: '🔄 Scan started',
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontFamily: 'Space Grotesk', marginBottom: '0.25rem' }}>
          Overview
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Your digital cleanup command center
        </p>
      </div>

      {/* New user empty state */}
      {!loading && !hasData && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)', padding: '3rem',
            textAlign: 'center', marginBottom: '2rem',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧹</div>
          <h2 style={{ fontFamily: 'Space Grotesk', marginBottom: '0.75rem' }}>Welcome, {user?.name?.split(' ')[0]}!</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 2rem', lineHeight: 1.7 }}>
            Your workspace is clean — for now. Start your first scan to discover duplicates,
            disorganized files, and cleanup opportunities.
          </p>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/app/scan')}
            style={{
              padding: '0.875rem 2rem',
              background: 'var(--lime)', color: '#000',
              border: 'none', borderRadius: 12,
              fontSize: '1rem', fontWeight: 800, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: 'var(--shadow-lime)',
            }}
          >
            <ScanLine size={18} /> Start your first scan
          </motion.button>
        </motion.div>
      )}

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {loading
          ? Array(4).fill(0).map((_, i) => <LoadingSkeleton key={i} height={130} radius={18} />)
          : statCards.map((card) => (
              <DashboardStatCard key={card.title} {...card} />
            ))}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 320px', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Clutter Gauge */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '1.5rem',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '0.9rem', marginBottom: '1.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Clutter Debt Gauge
          </h3>
          {loading ? <LoadingSkeleton width={160} height={160} radius={80} /> : (
            <ClutterDebtGauge score={stats?.latestClutterScore ?? 0} />
          )}
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '1rem', maxWidth: 220 }}>
            Score based on duplicate ratio, ambiguous filenames, and temporary file count from your latest scan.
          </p>
        </div>

        {/* File Type Distribution */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '0.9rem', marginBottom: '1.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            File Type Distribution
          </h3>
          {loading ? <LoadingSkeleton height={180} radius={8} /> : pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#7B7390'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.8rem' }}
                    formatter={(v) => [v, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
                {pieData.map((d) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: CATEGORY_COLORS[d.name] || '#7B7390' }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              No scan data yet
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Recent Activity
          </h3>
          {loading ? (
            Array(4).fill(0).map((_, i) => <LoadingSkeleton key={i} height={36} radius={6} style={{ marginBottom: 8 }} />)
          ) : activity.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {activity.slice(0, 6).map((act) => (
                <div key={act._id} style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                    {eventLabels[act.eventType] || act.eventType}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                    {new Date(act.timestamp).toLocaleDateString()} {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>No activity yet</p>
          )}
        </div>
      </div>

      {/* Recent Scans */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Recent Scans
          </h3>
          <button
            onClick={() => navigate('/app/history')}
            style={{ background: 'none', border: 'none', color: 'var(--purple)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            View all <ArrowRight size={12} />
          </button>
        </div>

        {loading ? (
          <LoadingSkeleton height={120} radius={8} />
        ) : scans.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {scans.map((scan) => (
              <div
                key={scan._id}
                onClick={() => navigate(`/app/scan?scanId=${scan._id}`)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.875rem 1rem',
                  background: 'var(--bg-raised)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)', cursor: 'pointer',
                  transition: 'border-color var(--transition-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FolderOpen size={16} color="var(--purple)" />
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{scan.scanName}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      {scan.fileCount.toLocaleString()} files · {new Date(scan.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600,
                    background: scan.clutterDebtScore > 60 ? 'var(--red-glow)' : scan.clutterDebtScore > 30 ? 'var(--orange-glow)' : 'var(--lime-glow)',
                    color: scan.clutterDebtScore > 60 ? 'var(--red)' : scan.clutterDebtScore > 30 ? 'var(--orange)' : 'var(--lime)',
                  }}>
                    Score: {scan.clutterDebtScore}
                  </span>
                  <span style={{
                    padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600,
                    background: scan.status === 'complete' ? 'var(--lime-glow)' : 'var(--orange-glow)',
                    color: scan.status === 'complete' ? 'var(--lime)' : 'var(--orange)',
                  }}>
                    {scan.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ScanLine}
            title="No scans yet"
            description="Run your first scan to see results here."
            action={
              <button onClick={() => navigate('/app/scan')} style={{
                padding: '0.6rem 1.5rem', background: 'var(--lime)', color: '#000',
                border: 'none', borderRadius: 20, cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem',
              }}>
                Start scanning
              </button>
            }
          />
        )}
      </div>

      {/* Clean Streak */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Clean Streak
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2.5rem' }}>🔥</span>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--orange)' }}>
                {user?.cleanStreak ?? 0} days
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>consecutive cleanup sessions</div>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Files Organized
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2.5rem' }}>✨</span>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--lime)' }}>
                {user?.totalFilesOrganized?.toLocaleString() ?? 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>files organized all-time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
