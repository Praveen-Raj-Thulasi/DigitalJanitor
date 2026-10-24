import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, X, Edit2, Filter, ChevronDown, Play, AlertTriangle,
  RotateCcw, Download, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { cleanupApi } from '../services/api';
import { exportCleanupPlan, formatBytes } from '../utils/filesystem';
import { FileCategoryBadge, LoadingSkeleton, EmptyState } from '../components/ui';

const ACTION_TYPE_COLORS = {
  rename: { bg: 'rgba(167,139,250,0.12)', color: 'var(--purple)', label: 'Rename' },
  move: { bg: 'rgba(199,255,77,0.12)', color: 'var(--lime-dim)', label: 'Move' },
  archive: { bg: 'rgba(255,157,77,0.12)', color: 'var(--orange)', label: 'Archive' },
  review: { bg: 'rgba(184,176,199,0.12)', color: 'var(--text-muted)', label: 'Review' },
};

const APPROVAL_COLORS = {
  pending: { bg: 'var(--bg-raised)', border: 'var(--border)' },
  approved: { bg: 'rgba(199,255,77,0.06)', border: 'rgba(199,255,77,0.3)' },
  rejected: { bg: 'rgba(255,77,106,0.06)', border: 'rgba(255,77,106,0.2)' },
  edited: { bg: 'rgba(167,139,250,0.06)', border: 'rgba(167,139,250,0.3)' },
};

const ActionRow = ({ action, onApprove, onReject, onEdit }) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(action.suggestedFilename || action.destinationRelativePath || '');
  const typeStyle = ACTION_TYPE_COLORS[action.actionType] || ACTION_TYPE_COLORS.review;
  const approvalStyle = APPROVAL_COLORS[action.approvalStatus] || APPROVAL_COLORS.pending;

  const handleSaveEdit = () => {
    onEdit(action._id, editValue);
    setEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        padding: '1rem',
        background: approvalStyle.bg,
        border: `1px solid ${approvalStyle.border}`,
        borderRadius: 'var(--radius-md)',
        marginBottom: '0.6rem',
        transition: 'all var(--transition-mid)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        {/* Action type badge */}
        <span style={{ padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: typeStyle.bg, color: typeStyle.color, flexShrink: 0, marginTop: 2 }}>
          {typeStyle.label}
        </span>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
              {action.sourceRelativePath}
            </span>
            {(action.suggestedFilename || action.destinationRelativePath) && (
              <>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>→</span>
                {editing ? (
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      style={{ padding: '0.25rem 0.5rem', background: 'var(--bg-raised)', border: '1px solid var(--purple)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'monospace', minWidth: 200 }}
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditing(false); }}
                    />
                    <button onClick={handleSaveEdit} style={{ background: 'var(--lime)', border: 'none', borderRadius: 4, padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: '#000' }}>Save</button>
                    <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}><X size={14} /></button>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--lime-dim)', wordBreak: 'break-all' }}>
                    {action.suggestedFilename || action.destinationRelativePath}
                  </span>
                )}
              </>
            )}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{action.reason}</p>
          {action.confidence !== undefined && (
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
              Confidence: {Math.round(action.confidence * 100)}% · Source: {action.source || 'deterministic'}
            </span>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
          {action.approvalStatus !== 'rejected' && (
            <button
              onClick={() => onApprove(action._id)}
              title="Approve"
              style={{
                width: 30, height: 30, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: action.approvalStatus === 'approved' || action.approvalStatus === 'edited' ? 'var(--lime)' : 'var(--bg-raised)',
                border: '1px solid var(--border)', cursor: 'pointer', color: action.approvalStatus === 'approved' || action.approvalStatus === 'edited' ? '#000' : 'var(--text-muted)',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Check size={14} />
            </button>
          )}
          {action.approvalStatus !== 'approved' && action.approvalStatus !== 'edited' && (
            <button
              onClick={() => onReject(action._id)}
              title="Reject"
              style={{
                width: 30, height: 30, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: action.approvalStatus === 'rejected' ? 'var(--red-glow)' : 'var(--bg-raised)',
                border: `1px solid ${action.approvalStatus === 'rejected' ? 'rgba(255,77,106,0.4)' : 'var(--border)'}`,
                cursor: 'pointer', color: action.approvalStatus === 'rejected' ? 'var(--red)' : 'var(--text-muted)',
              }}
            >
              <X size={14} />
            </button>
          )}
          {action.approvalStatus === 'rejected' && (
            <button onClick={() => onApprove(action._id)} title="Undo rejection" style={{ width: 30, height: 30, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-raised)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <RotateCcw size={12} />
            </button>
          )}
          <button
            onClick={() => setEditing(true)}
            title="Edit"
            style={{ width: 30, height: 30, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-raised)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <Edit2 size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const CleanupStudio = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planId = searchParams.get('planId');

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [confirmingExecute, setConfirmingExecute] = useState(false);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    if (!planId) { setLoading(false); return; }
    const fetchPlan = async () => {
      try {
        const { data } = await cleanupApi.getById(planId);
        setPlan(data.data);
      } catch (err) {
        toast.error('Failed to load cleanup plan');
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [planId]);

  const updateAction = async (actionId, approvalStatus, editValue) => {
    try {
      const update = { actionUpdates: [{ actionId, approvalStatus }] };
      if (editValue !== undefined) {
        update.actionUpdates[0].suggestedFilename = editValue;
        delete update.actionUpdates[0].approvalStatus;
      }
      const { data } = await cleanupApi.update(planId, update);
      setPlan(data.data);
    } catch (err) {
      toast.error('Failed to update action');
    }
  };

  const handleApprove = (actionId) => updateAction(actionId, 'approved');
  const handleReject = (actionId) => updateAction(actionId, 'rejected');
  const handleEdit = (actionId, value) => updateAction(actionId, undefined, value);

  const handleApproveAll = async () => {
    const pending = plan.actions.filter((a) => a.approvalStatus === 'pending').map((a) => ({ actionId: a._id, approvalStatus: 'approved' }));
    if (pending.length === 0) return;
    try {
      const { data } = await cleanupApi.update(planId, { actionUpdates: pending });
      setPlan(data.data);
      toast.success(`Approved ${pending.length} actions`);
    } catch {
      toast.error('Failed to approve all');
    }
  };

  // Execute approved actions (frontend is responsible for actual FS operations)
  const handleExecute = async () => {
    setExecuting(true);
    setConfirmingExecute(false);

    const approved = plan.actions.filter((a) => a.approvalStatus === 'approved' || a.approvalStatus === 'edited');
    if (approved.length === 0) {
      toast.warning('No approved actions to execute');
      setExecuting(false);
      return;
    }

    // Mark plan as executing
    await cleanupApi.update(planId, { status: 'executing' });

    // Since we can't guarantee FSA handles are available after page reload,
    // we report that the user needs to use the download plan approach or the
    // session handle approach.
    // In a full implementation, this would use the stored dir handle.
    // For now, we offer a downloadable plan and mark as attempted.
    const executionResults = approved.map((a) => ({
      actionId: a._id,
      success: false,
      errorMessage: 'File System Access handles not available in this session. Download the cleanup plan to apply changes manually.',
    }));

    try {
      const { data } = await cleanupApi.update(planId, { executionResults, status: 'partial' });
      setPlan(data.data);
      toast.warning('File handles not available. Download the cleanup plan to apply manually.', { duration: 6000 });
      exportCleanupPlan(plan, plan.scanId?.scanName || 'Cleanup Plan');
    } catch {
      toast.error('Execution reporting failed');
    } finally {
      setExecuting(false);
    }
  };

  const filteredActions = plan?.actions?.filter((a) => {
    const typeMatch = filterType === 'all' || a.actionType === filterType;
    const statusMatch = filterStatus === 'all' || a.approvalStatus === filterStatus;
    return typeMatch && statusMatch;
  }) || [];

  const approvedCount = plan?.actions?.filter((a) => a.approvalStatus === 'approved' || a.approvalStatus === 'edited').length || 0;

  if (!planId) {
    return (
      <EmptyState
        icon={Filter}
        title="No cleanup plan selected"
        description="Run a scan first to generate a cleanup plan, then review and apply suggestions here."
        action={<button onClick={() => navigate('/app/scan')} style={{ padding: '0.6rem 1.5rem', background: 'var(--lime)', color: '#000', border: 'none', borderRadius: 20, cursor: 'pointer', fontWeight: 700 }}>Start a scan</button>}
      />
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '1.75rem', marginBottom: '0.25rem' }}>Cleanup Studio</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Review and approve cleanup suggestions before anything changes.</p>
      </div>

      {loading ? (
        <LoadingSkeleton height={300} radius={18} />
      ) : plan ? (
        <>
          {/* Summary bar */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total actions</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--purple)' }}>{plan.actions.length}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Approved</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--lime)' }}>{approvedCount}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Rejected</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: 'var(--red)' }}>{plan.summary?.rejectedCount || 0}</div>
            </div>
            <div style={{ flex: 1 }} />
            <button onClick={handleApproveAll} style={{ padding: '0.5rem 1rem', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Approve all pending
            </button>
            <button onClick={() => exportCleanupPlan(plan, plan.scanId?.scanName)} style={{ padding: '0.5rem 1rem', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Download size={13} /> Export plan
            </button>
            {approvedCount > 0 && !confirmingExecute && (
              <button
                onClick={() => setConfirmingExecute(true)}
                style={{ padding: '0.5rem 1.25rem', background: 'var(--lime)', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Play size={14} /> Apply {approvedCount} actions
              </button>
            )}
            {confirmingExecute && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <AlertTriangle size={16} color="var(--orange)" />
                <span style={{ fontSize: '0.8rem', color: 'var(--orange)' }}>Confirm apply?</span>
                <button onClick={handleExecute} style={{ padding: '0.4rem 0.8rem', background: 'var(--lime)', color: '#000', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>Yes, apply</button>
                <button onClick={() => setConfirmingExecute(false)} style={{ padding: '0.4rem 0.8rem', background: 'none', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Cancel</button>
              </div>
            )}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {['all', 'rename', 'move', 'archive', 'review'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={{ padding: '0.3rem 0.8rem', borderRadius: 20, border: `1px solid ${filterType === t ? 'var(--purple)' : 'var(--border)'}`, background: filterType === t ? 'var(--purple-glow)' : 'transparent', color: filterType === t ? 'var(--purple)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: filterType === t ? 600 : 400 }}
              >
                {t === 'all' ? 'All types' : t}
              </button>
            ))}
            <div style={{ width: 1, background: 'var(--border)', margin: '0 0.25rem' }} />
            {['all', 'pending', 'approved', 'rejected', 'edited'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{ padding: '0.3rem 0.8rem', borderRadius: 20, border: `1px solid ${filterStatus === s ? 'var(--purple)' : 'var(--border)'}`, background: filterStatus === s ? 'var(--purple-glow)' : 'transparent', color: filterStatus === s ? 'var(--purple)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: filterStatus === s ? 600 : 400 }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Actions list */}
          <div>
            {filteredActions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                No actions match the current filter.
              </div>
            ) : (
              filteredActions.map((action) => (
                <ActionRow
                  key={action._id}
                  action={action}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onEdit={handleEdit}
                />
              ))
            )}
          </div>
        </>
      ) : (
        <EmptyState icon={Filter} title="Plan not found" description="This cleanup plan may have been deleted." />
      )}
    </div>
  );
};

export default CleanupStudio;
