import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Filter, SortAsc, SortDesc, Search, FolderOpen, AlertCircle
} from 'lucide-react';
import { scansApi } from '../services/api';
import { FileCategoryBadge, LoadingSkeleton, EmptyState } from '../components/ui';
import { formatBytes } from '../utils/filesystem';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const CATEGORY_COLORS = {
  images: '#A78BFA', videos: '#FF9D4D', audio: '#C7FF4D',
  documents: '#64B4FF', archives: '#FFC864', code: '#64FFB4',
  data: '#B464FF', temporary: '#FF4D6A', unknown: '#7B7390',
};

const ClutterRadar = () => {
  const [searchParams] = useSearchParams();
  const scanIdParam = searchParams.get('scanId');

  const [scans, setScans] = useState([]);
  const [selectedScanId, setSelectedScanId] = useState(scanIdParam || '');
  const [scan, setScan] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingScan, setLoadingScan] = useState(false);

  // Filter state
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterFlag, setFilterFlag] = useState('all'); // all | ambiguous | duplicate | temporary
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  // Load scan list
  useEffect(() => {
    const fetchScans = async () => {
      try {
        const { data } = await scansApi.getAll({ limit: 30 });
        setScans(data.data);
        if (!selectedScanId && data.data.length > 0) {
          setSelectedScanId(data.data[0]._id);
        }
      } catch {
        toast.error('Failed to load scans');
      } finally {
        setLoading(false);
      }
    };
    fetchScans();
  }, []);

  // Load selected scan detail
  useEffect(() => {
    if (!selectedScanId) return;
    const fetchScan = async () => {
      setLoadingScan(true);
      try {
        const { data } = await scansApi.getById(selectedScanId);
        setScan(data.data);
        setFiles(data.data.fileMetadata || []);
      } catch {
        toast.error('Failed to load scan details');
      } finally {
        setLoadingScan(false);
      }
    };
    fetchScan();
  }, [selectedScanId]);

  // Filtered & sorted files
  const filtered = files
    .filter((f) => {
      const nameMatch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.relativePath.toLowerCase().includes(search.toLowerCase());
      const catMatch = filterCategory === 'all' || f.category === filterCategory;
      const flagMatch =
        filterFlag === 'all' ||
        (filterFlag === 'ambiguous' && f.isAmbiguous) ||
        (filterFlag === 'duplicate' && f.isDuplicate) ||
        (filterFlag === 'temporary' && f.category === 'temporary');
      return nameMatch && catMatch && flagMatch;
    })
    .sort((a, b) => {
      let aVal, bVal;
      if (sortBy === 'name') { aVal = a.name; bVal = b.name; }
      else if (sortBy === 'size') { aVal = a.sizeBytes; bVal = b.sizeBytes; }
      else if (sortBy === 'category') { aVal = a.category; bVal = b.category; }
      else { aVal = a.lastModified; bVal = b.lastModified; }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  // Category chart data
  const chartData = scan
    ? Object.entries(scan.categoryCounts || {})
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value, fill: CATEGORY_COLORS[name] || '#7B7390' }))
    : [];

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(col); setSortDir('asc'); }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '1.75rem', marginBottom: '0.25rem' }}>Clutter Radar</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Interactive visualization of scanned folder contents.
        </p>
      </div>

      {/* Scan selector */}
      {!loading && scans.length > 0 && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>View scan:</label>
          <select
            value={selectedScanId}
            onChange={(e) => setSelectedScanId(e.target.value)}
            style={{
              padding: '0.5rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.875rem', cursor: 'pointer', flex: 1, maxWidth: 400,
            }}
          >
            {scans.map((s) => (
              <option key={s._id} value={s._id}>
                {s.scanName} — {s.fileCount?.toLocaleString()} files
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <LoadingSkeleton height={300} radius={18} />
      ) : scans.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No scans yet" description="Run a scan first to view the Clutter Radar." />
      ) : (
        <>
          {/* Summary stats */}
          {scan && !loadingScan && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Total files', val: scan.fileCount?.toLocaleString(), color: 'var(--purple)' },
                { label: 'Duplicates', val: `${scan.duplicateFileCount || 0} files`, color: 'var(--red)' },
                { label: 'Ambiguous names', val: scan.ambiguousFilenameCount || 0, color: 'var(--orange)' },
                { label: 'Temporary files', val: scan.categoryCounts?.temporary || 0, color: 'var(--orange)' },
                { label: 'Total size', val: formatBytes(scan.totalSizeBytes || 0), color: 'var(--text-muted)' },
                { label: 'Clutter score', val: `${scan.clutterDebtScore}/100`, color: scan.clutterDebtScore > 60 ? 'var(--red)' : scan.clutterDebtScore > 30 ? 'var(--orange)' : 'var(--lime)' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: 'Space Grotesk', color, marginBottom: '0.25rem' }}>{val}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Chart */}
          {!loadingScan && chartData.length > 0 && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
                File Distribution by Category
              </h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} barSize={32}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-dim)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.8rem' }}
                    cursor={{ fill: 'rgba(167,139,250,0.06)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* File explorer */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search files..."
                  style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2.25rem', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>

              {/* Category filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer' }}
              >
                <option value="all">All categories</option>
                {Object.keys(CATEGORY_COLORS).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Flag filter */}
              {['all', 'ambiguous', 'duplicate', 'temporary'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterFlag(f)}
                  style={{
                    padding: '0.35rem 0.75rem', borderRadius: 20, fontSize: '0.75rem', cursor: 'pointer',
                    border: `1px solid ${filterFlag === f ? 'var(--orange)' : 'var(--border)'}`,
                    background: filterFlag === f ? 'var(--orange-glow)' : 'transparent',
                    color: filterFlag === f ? 'var(--orange)' : 'var(--text-dim)',
                    fontWeight: filterFlag === f ? 600 : 400,
                  }}
                >
                  {f === 'all' ? 'All files' : f}
                </button>
              ))}

              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>
                {filtered.length} of {files.length} files
              </span>
            </div>

            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 100px 80px', gap: '0.5rem', padding: '0.65rem 1.25rem', borderBottom: '1px solid var(--border)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {[['name', 'Name'], ['category', 'Type'], ['size', 'Size'], ['date', 'Modified'], [null, 'Flags']].map(([col, label]) => (
                <div
                  key={label}
                  onClick={col ? () => toggleSort(col) : undefined}
                  style={{ cursor: col ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: '0.3rem', userSelect: 'none' }}
                >
                  {label}
                  {col && sortBy === col && (sortDir === 'asc' ? <SortAsc size={11} /> : <SortDesc size={11} />)}
                </div>
              ))}
            </div>

            {/* File rows */}
            {loadingScan ? (
              <div style={{ padding: '2rem' }}>
                {Array(8).fill(0).map((_, i) => <LoadingSkeleton key={i} height={36} radius={4} style={{ marginBottom: 6 }} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                No files match the current filter.
              </div>
            ) : (
              <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                {filtered.slice(0, 500).map((f, i) => (
                  <div
                    key={`${f.relativePath}-${i}`}
                    style={{
                      display: 'grid', gridTemplateColumns: '1fr 100px 120px 100px 80px', gap: '0.5rem',
                      padding: '0.6rem 1.25rem',
                      borderBottom: '1px solid var(--border)',
                      alignItems: 'center',
                      background: f.isDuplicate ? 'rgba(255,77,106,0.03)' : f.isAmbiguous ? 'rgba(255,157,77,0.03)' : 'transparent',
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-raised)'}
                    onMouseLeave={e => e.currentTarget.style.background = f.isDuplicate ? 'rgba(255,77,106,0.03)' : f.isAmbiguous ? 'rgba(255,157,77,0.03)' : 'transparent'}
                  >
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.name}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.relativePath}
                      </div>
                    </div>
                    <FileCategoryBadge category={f.category} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatBytes(f.sizeBytes || 0)}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      {f.lastModified ? new Date(f.lastModified).toLocaleDateString() : '—'}
                    </span>
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                      {f.isDuplicate && <span style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem', borderRadius: 4, background: 'var(--red-glow)', color: 'var(--red)', fontWeight: 700 }}>DUP</span>}
                      {f.isAmbiguous && <span style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem', borderRadius: 4, background: 'var(--orange-glow)', color: 'var(--orange)', fontWeight: 700 }}>AMB</span>}
                      {f.category === 'temporary' && <span style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem', borderRadius: 4, background: 'rgba(255,157,77,0.1)', color: 'var(--orange)', fontWeight: 700 }}>TMP</span>}
                    </div>
                  </div>
                ))}
                {filtered.length > 500 && (
                  <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Showing first 500 of {filtered.length} files. Use filters to narrow results.
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ClutterRadar;
