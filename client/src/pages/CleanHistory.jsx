import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, ScanLine, Wand2, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { activityApi, scansApi, cleanupApi } from '../services/api';
import { LoadingSkeleton, EmptyState } from '../components/ui';
import { toast } from 'sonner';

const EVENT_META = {
  scan_started:       { icon: '🔄', color: 'var(--purple)', label: 'Scan started' },
  scan_completed:     { icon: '🔍', color: 'var(--lime)', label: 'Scan completed' },
  scan_failed:        { icon: '❌', color: 'var(--red)', label: 'Scan failed' },
  plan_created:       { icon: '📋', color: 'var(--purple)', label: 'Cleanup plan created' },
  action_approved:    { icon: '✅', color: 'var(--lime)', label: 'Action approved' },
  action_rejected:    { icon: '🚫', color: 'var(--red)', label: 'Action rejected' },
  action_edited:      { icon: '✏️', color: 'var(--purple)', label: 'Action edited' },
  cleanup_confirmed:  { icon: '🎯', color: 'var(--lime)', label: 'Cleanup confirmed' },
  action_executed:    { icon: '✨', color: 'var(--lime)', label: 'File organized' },
  action_failed:      { icon: '💥', color: 'var(--red)', label: 'Action failed' },
  achievement_unlocked: { icon: '🏆', color: 'var(--orange)', label: 'Achievement unlocked' },
  settings_updated:   { icon: '⚙️', color: 'var(--text-muted)', label: 'Settings updated' },
  ai_analysis_requested: { icon: '🤖', color: 'var(--purple)', label: 'AI analysis requested' },
  ai_unavailable:     { icon: '⚠️', color: 'var(--orange)', label: 'AI unavailable' },
};

const CleanHistory = () => {
  const [activity, setActivity] = useState([]);
  const [scans, setScans] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('activity');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 20 };
        if (filterType !== 'all') params.eventType = filterType;

        const [actRes, scanRes, planRes] = await Promise.all([
          activityApi.getAll(params),
          scansApi.getAll({ page: 1, limit: 10 }),
          cleanupApi.getAll({ page: 1, limit: 10 }),
        ]);

        setActivity(actRes.data.data);
        setTotalPages(actRes.data.pagination.pages);
        setScans(scanRes.data.data);
        setPlans(planRes.data.data);
      } catch {
        toast.error('Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, filterType]);

  const TABS = [
    { id: 'activity', label: 'Activity Log' },
    { id: 'scans', label: 'Scan History' },
    { id: 'plans', label: 'Cleanup Plans' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '1.75rem', marginBottom: '0.25rem' }}>Clean History</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>A full audit trail of scans, plans, and cleanup operations.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '0.4rem', width: 'fit-content' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '0.4rem 1rem', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: activeTab === t.id ? 'var(--bg-raised)' : 'transparent',
              color: activeTab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: activeTab === t.id ? 600 : 400, fontSize: '0.85rem',
              transition: 'all var(--transition-fast)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Activity tab */}
      {activeTab === 'activity' && (
        <div>
          {/* Filter */}
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {['all', 'scan_completed', 'action_executed', 'action_approved', 'action_failed', 'achievement_unlocked'].map((t) => (
              <button
                key={t}
                onClick={() => { setFilterType(t); setPage(1); }}
                style={{
                  padding: '0.25rem 0.7rem', borderRadius: 20, fontSize: '0.75rem',
                  border: `1px solid ${filterType === t ? 'var(--purple)' : 'var(--border)'}`,
                  background: filterType === t ? 'var(--purple-glow)' : 'transparent',
                  color: filterType === t ? 'var(--purple)' : 'var(--text-muted)', cursor: 'pointer',
                }}
              >
                {t === 'all' ? 'All events' : EVENT_META[t]?.label || t}
              </button>
            ))}
          </div>

          {loading ? (
            Array(8).fill(0).map((_, i) => <LoadingSkeleton key={i} height={56} radius={8} style={{ marginBottom: 8 }} />)
          ) : activity.length === 0 ? (
            <EmptyState icon={History} title="No activity yet" description="Activity will appear here as you scan and organize files." />
          ) : (
            <>
              {activity.map((act) => {
                const meta = EVENT_META[act.eventType] || { icon: '•', color: 'var(--text-muted)', label: act.eventType };
                return (
                  <div key={act._id} style={{
                    display: 'flex', gap: '1rem', alignItems: 'flex-start',
                    padding: '0.875rem', background: 'var(--bg-card)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                    marginBottom: '0.5rem',
                  }}>
                    <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{meta.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: meta.color }}>{meta.label}</div>
                      {act.details && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                          {JSON.stringify(act.details).replace(/[{}"]/g, ' ').trim()}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', flexShrink: 0 }}>
                      {new Date(act.timestamp).toLocaleDateString()} {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.4rem 0.75rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.4rem 0.75rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Scans tab */}
      {activeTab === 'scans' && (
        <div>
          {scans.length === 0 ? (
            <EmptyState icon={ScanLine} title="No scan history" description="Completed scans will appear here." />
          ) : (
            scans.map((scan) => (
              <div key={scan._id} style={{ padding: '1rem 1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 600 }}>{scan.scanName}</span>
                  <span style={{ padding: '0.15rem 0.5rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, background: scan.status === 'complete' ? 'var(--lime-glow)' : 'var(--orange-glow)', color: scan.status === 'complete' ? 'var(--lime)' : 'var(--orange)' }}>{scan.status}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>{scan.fileCount?.toLocaleString()} files</span>
                  <span>Score: {scan.clutterDebtScore}/100</span>
                  <span>{scan.duplicateGroupCount} dup groups</span>
                  <span>{new Date(scan.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Plans tab */}
      {activeTab === 'plans' && (
        <div>
          {plans.length === 0 ? (
            <EmptyState icon={Wand2} title="No cleanup plans" description="Cleanup plans will appear here after you run scans." />
          ) : (
            plans.map((plan) => (
              <div key={plan._id} style={{ padding: '1rem 1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 600 }}>{plan.planName}</span>
                  <span style={{ padding: '0.15rem 0.5rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, background: 'var(--bg-raised)', color: 'var(--text-muted)' }}>{plan.status}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>{plan.summary?.totalActions} actions</span>
                  <span style={{ color: 'var(--lime)' }}>{plan.summary?.approvedCount} approved</span>
                  <span style={{ color: 'var(--red)' }}>{plan.summary?.rejectedCount} rejected</span>
                  <span style={{ color: 'var(--lime)' }}>{plan.summary?.executedCount} executed</span>
                  <span>{new Date(plan.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CleanHistory;
