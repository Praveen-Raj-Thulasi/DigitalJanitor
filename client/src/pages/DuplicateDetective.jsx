import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Trash2, Info, ChevronDown, ChevronRight } from 'lucide-react';
import { scansApi } from '../services/api';
import { formatBytes } from '../utils/filesystem';
import { LoadingSkeleton, EmptyState } from '../components/ui';
import { toast } from 'sonner';

const DuplicateGroupCard = ({ group, onMarkKeep }) => {
  const [expanded, setExpanded] = useState(true);
  const [keepIndex, setKeepIndex] = useState(0);

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', marginBottom: '1rem', overflow: 'hidden',
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.25rem', cursor: 'pointer',
          background: 'var(--bg-raised)', borderBottom: expanded ? '1px solid var(--border)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--red-glow)', border: '1px solid rgba(255,77,106,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Copy size={16} color="var(--red)" />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, fontFamily: 'monospace' }}>
              {group.groupId}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {group.count} identical files · {formatBytes(group.sizeBytes)} each · {formatBytes(group.sizeBytes * (group.count - 1))} wasted
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, background: 'var(--red-glow)', color: 'var(--red)' }}>
            {group.count} duplicates
          </span>
          {expanded ? <ChevronDown size={16} color="var(--text-muted)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '1rem 1.25rem' }}>
          <div style={{
            padding: '0.6rem 0.75rem', background: 'rgba(255,157,77,0.08)',
            border: '1px solid rgba(255,157,77,0.2)', borderRadius: 8, marginBottom: '1rem',
            fontSize: '0.75rem', color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
            <Info size={13} />
            These files have identical content (matching SHA-256 hash + size). Choose one to keep and note the rest for removal.
            No files are automatically deleted.
          </div>

          {group.paths.map((path, i) => (
            <div
              key={path}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.7rem 0.875rem', marginBottom: '0.5rem',
                background: keepIndex === i ? 'rgba(199,255,77,0.06)' : 'var(--bg-raised)',
                border: `1px solid ${keepIndex === i ? 'rgba(199,255,77,0.3)' : 'var(--border)'}`,
                borderRadius: 8, transition: 'all var(--transition-fast)',
              }}
            >
              <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-primary)', wordBreak: 'break-all', flex: 1 }}>
                {path}
              </span>
              <button
                onClick={() => setKeepIndex(i)}
                style={{
                  marginLeft: '1rem', flexShrink: 0,
                  padding: '0.25rem 0.6rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700,
                  background: keepIndex === i ? 'var(--lime)' : 'var(--bg-raised)',
                  color: keepIndex === i ? '#000' : 'var(--text-muted)',
                  border: `1px solid ${keepIndex === i ? 'rgba(199,255,77,0.5)' : 'var(--border)'}`,
                  cursor: 'pointer',
                }}
              >
                {keepIndex === i ? '✓ Keep' : 'Keep this'}
              </button>
            </div>
          ))}

          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Keeping: <strong style={{ color: 'var(--lime)', fontFamily: 'monospace' }}>{group.paths[keepIndex]}</strong>
            <br />
            You'll need to manually delete the other {group.count - 1} file{group.count - 1 > 1 ? 's' : ''}.
            No automatic deletion is performed.
          </div>
        </div>
      )}
    </div>
  );
};

const DuplicateDetective = () => {
  const [scans, setScans] = useState([]);
  const [selectedScan, setSelectedScan] = useState(null);
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(false);

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const { data } = await scansApi.getAll({ limit: 20 });
        const withDups = data.data.filter((s) => s.duplicateGroupCount > 0);
        setScans(withDups);
        if (withDups.length > 0) {
          setSelectedScan(withDups[0]._id);
        }
      } catch {
        toast.error('Failed to load scans');
      } finally {
        setLoading(false);
      }
    };
    fetchScans();
  }, []);

  useEffect(() => {
    if (!selectedScan) return;
    const fetchGroups = async () => {
      setLoadingGroups(true);
      try {
        const { data } = await scansApi.getById(selectedScan);
        setDuplicateGroups(data.data.duplicateGroups || []);
      } catch {
        toast.error('Failed to load duplicate data');
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchGroups();
  }, [selectedScan]);

  const totalWasted = duplicateGroups.reduce((sum, g) => sum + g.sizeBytes * (g.count - 1), 0);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '1.75rem', marginBottom: '0.25rem' }}>Duplicate Detective</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Files confirmed as exact duplicates by SHA-256 hash and file size.
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton height={200} radius={18} />
      ) : scans.length === 0 ? (
        <EmptyState
          icon={Copy}
          title="No duplicate data found"
          description="Scans with duplicate detection enabled will show results here. Run a scan with 'Find exact duplicates' option."
        />
      ) : (
        <>
          {/* Scan selector */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Scan:</label>
            <select
              value={selectedScan || ''}
              onChange={(e) => setSelectedScan(e.target.value)}
              style={{
                padding: '0.5rem 1rem', background: 'var(--bg-card)',
                border: '1px solid var(--border)', borderRadius: 8,
                color: 'var(--text-primary)', fontSize: '0.875rem', cursor: 'pointer',
              }}
            >
              {scans.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.scanName} ({s.duplicateGroupCount} groups)
                </option>
              ))}
            </select>
          </div>

          {/* Summary */}
          {!loadingGroups && duplicateGroups.length > 0 && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem', marginBottom: '1.5rem',
            }}>
              {[
                { label: 'Duplicate groups', val: duplicateGroups.length, color: 'var(--red)' },
                { label: 'Total duplicate files', val: duplicateGroups.reduce((s, g) => s + g.count, 0), color: 'var(--orange)' },
                { label: 'Space you could reclaim', val: formatBytes(totalWasted), color: 'var(--lime)' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'Space Grotesk', color, marginBottom: '0.3rem' }}>{val}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{
            padding: '0.6rem 0.875rem', background: 'rgba(167,139,250,0.06)',
            border: '1px solid var(--border)', borderRadius: 8, marginBottom: '1.5rem',
            fontSize: '0.78rem', color: 'var(--text-muted)',
          }}>
            <strong style={{ color: 'var(--purple)' }}>How duplicates are detected:</strong> Files are grouped by matching SHA-256 cryptographic hash + exact file size.
            Files with matching names alone are not considered duplicates. No files are automatically deleted.
          </div>

          {loadingGroups ? (
            Array(3).fill(0).map((_, i) => <LoadingSkeleton key={i} height={120} radius={12} style={{ marginBottom: 12 }} />)
          ) : (
            duplicateGroups.map((group) => (
              <DuplicateGroupCard key={group.groupId} group={group} />
            ))
          )}
        </>
      )}
    </div>
  );
};

export default DuplicateDetective;
