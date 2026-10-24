import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, ChevronRight, CheckCircle, AlertCircle, X, Loader2,
  ScanLine, Settings2, Layers, Copy, Tag, FileText, Brain
} from 'lucide-react';
import { toast } from 'sonner';
import {
  isFSASupported, enumerateDirectory, enumerateFileList,
  findDuplicates, calculateClutterScore, generateDeterministicSuggestions,
  getFileCategory, formatBytes
} from '../utils/filesystem';
import { scansApi, cleanupApi } from '../services/api';
import { ProgressBar } from '../components/ui';

const STEPS = ['Choose Folder', 'Scan Options', 'Scanning', 'Results'];

const DEFAULT_OPTIONS = {
  identifyFileTypes: true,
  findDuplicates: true,
  detectAmbiguousFilenames: true,
  suggestOrganization: true,
  generateFilenames: false,
  analyzeDocumentText: false,
};

const ScanWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [dirHandle, setDirHandle] = useState(null);
  const [folderName, setFolderName] = useState('');
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [scanResult, setScanResult] = useState(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState(null);
  const cancelRef = useRef(false);
  const fileInputRef = useRef(null);
  const fsaSupported = isFSASupported();

  // Step 0: Choose folder
  const handlePickDirectory = async () => {
    try {
      const handle = await window.showDirectoryPicker({ mode: 'read' });
      setDirHandle(handle);
      setFolderName(handle.name);
      setStep(1);
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast.error('Could not open folder: ' + err.message);
      }
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    // Get folder name from first file's path
    const firstPath = files[0].webkitRelativePath;
    const folder = firstPath ? firstPath.split('/')[0] : 'Selected Files';
    setFolderName(folder);
    setDirHandle({ fallback: true, fileList: files });
    setStep(1);
  };

  // Step 2: Run scan
  const runScan = useCallback(async () => {
    setStep(2);
    setError(null);
    cancelRef.current = false;
    setCancelled(false);

    try {
      let files = [];

      setProgressLabel('Enumerating files...');
      setScanProgress(5);

      if (dirHandle.fallback) {
        files = enumerateFileList(dirHandle.fileList);
      } else {
        files = await enumerateDirectory(dirHandle, '', (count) => {
          if (cancelRef.current) throw new Error('Cancelled');
          setProgressLabel(`Found ${count} files...`);
        });
      }

      if (cancelRef.current) return;
      setScanProgress(25);
      setProgressLabel(`Processing ${files.length} files...`);

      // Category counts
      const categoryCounts = { images: 0, videos: 0, audio: 0, documents: 0, archives: 0, code: 0, data: 0, temporary: 0, unknown: 0 };
      let ambiguousCount = 0;
      for (const f of files) {
        if (categoryCounts[f.category] !== undefined) categoryCounts[f.category]++;
        else categoryCounts.unknown++;
        if (f.isAmbiguous) ambiguousCount++;
      }

      setScanProgress(40);

      // Duplicate detection
      let dupGroups = [];
      let duplicateFileCount = 0;
      let potentialSpaceSavings = 0;

      if (options.findDuplicates && !dirHandle.fallback) {
        setProgressLabel('Hashing files for duplicate detection...');
        const result = await findDuplicates(files, (processed, total) => {
          if (cancelRef.current) throw new Error('Cancelled');
          const pct = 40 + Math.round((processed / total) * 40);
          setScanProgress(pct);
          setProgressLabel(`Checking for duplicates... (${processed}/${total})`);
        });
        dupGroups = result.groups;
        duplicateFileCount = result.duplicateFileCount;
        potentialSpaceSavings = result.potentialSpaceSavings;
      } else if (options.findDuplicates && dirHandle.fallback) {
        setProgressLabel('Note: Duplicate detection by content hash is limited in fallback mode');
        setScanProgress(80);
      }

      if (cancelRef.current) return;
      setScanProgress(85);
      setProgressLabel('Calculating clutter score...');

      const totalBytes = files.reduce((sum, f) => sum + (f.sizeBytes || 0), 0);
      const clutterDebtScore = calculateClutterScore({
        fileCount: files.length,
        duplicateRatio: files.length > 0 ? duplicateFileCount / files.length : 0,
        ambiguousRatio: files.length > 0 ? ambiguousCount / files.length : 0,
        temporaryRatio: files.length > 0 ? categoryCounts.temporary / files.length : 0,
      });

      setScanProgress(95);
      setProgressLabel('Saving scan...');

      // Prepare file metadata (no content, no handles)
      const fileMetadata = files.map((f) => ({
        name: f.name,
        relativePath: f.relativePath,
        sizeBytes: f.sizeBytes,
        extension: f.extension,
        category: f.category,
        mimeType: f.mimeType,
        lastModified: f.lastModified,
        isAmbiguous: f.isAmbiguous,
        isDuplicate: f.isDuplicate || false,
        duplicateGroupId: f.duplicateGroupId || null,
        hash: f.hash || null,
      }));

      const scanData = {
        scanName: `${folderName} – ${new Date().toLocaleDateString()}`,
        folderPath: folderName,
        fileCount: files.length,
        totalSizeBytes: totalBytes,
        categoryCounts,
        duplicateGroupCount: dupGroups.length,
        duplicateFileCount,
        potentialSpaceSavings,
        ambiguousFilenameCount: ambiguousCount,
        clutterDebtScore,
        scanOptions: options,
        fileMetadata,
        duplicateGroups: dupGroups.map((g) => ({
          groupId: g.groupId,
          hash: g.hash,
          sizeBytes: g.sizeBytes,
          count: g.count,
          paths: g.paths,
        })),
        status: 'complete',
      };

      const { data } = await scansApi.create(scanData);
      setScanProgress(100);
      setProgressLabel('Scan complete!');

      // Generate deterministic actions
      const actions = generateDeterministicSuggestions(files);

      setScanResult({
        scan: data.data,
        files,
        dupGroups,
        actions,
        isFallback: !!dirHandle.fallback,
      });

      setStep(3);
    } catch (err) {
      if (err.message === 'Cancelled' || cancelRef.current) {
        setCancelled(true);
        setStep(0);
        return;
      }
      console.error('Scan error:', err);
      setError(err.message || 'Scan failed');
      toast.error('Scan failed: ' + (err.message || 'Unknown error'));
    }
  }, [dirHandle, folderName, options]);

  const handleCancel = () => {
    cancelRef.current = true;
    setCancelled(true);
  };

  // Create cleanup plan and navigate
  const handleContinueToCleanup = async () => {
    if (!scanResult) return;
    try {
      const { data } = await cleanupApi.create({
        scanId: scanResult.scan._id,
        planName: `Cleanup: ${scanResult.scan.scanName}`,
        actions: scanResult.actions.slice(0, 200), // Limit actions
      });
      navigate(`/app/cleanup?planId=${data.data._id}`);
    } catch (err) {
      toast.error('Failed to create cleanup plan');
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '0.5rem' }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700,
              background: i < step ? 'var(--lime)' : i === step ? 'var(--purple)' : 'var(--bg-raised)',
              color: i < step ? '#000' : i === step ? '#fff' : 'var(--text-dim)',
              border: i === step ? '2px solid var(--purple)' : '2px solid transparent',
              transition: 'all 0.3s',
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: '0.8rem', color: i === step ? 'var(--text-primary)' : 'var(--text-dim)', fontWeight: i === step ? 600 : 400 }}>
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div style={{ width: 24, height: 1, background: i < step ? 'var(--lime)' : 'var(--border)' }} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 0: Choose folder */}
        {step === 0 && (
          <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '2.5rem', textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--purple-glow)', border: '1px solid var(--border-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <FolderOpen size={32} color="var(--purple)" />
              </div>
              <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Choose a folder to scan</h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 2rem' }}>
                Files are read locally in your browser. No contents are uploaded — only metadata and your cleanup decisions are saved.
              </p>

              {fsaSupported ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handlePickDirectory}
                    style={{
                      padding: '0.875rem 2.5rem', background: 'var(--lime)', color: '#000',
                      border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 800,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    }}
                  >
                    <FolderOpen size={18} /> Select folder
                  </motion.button>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Uses File System Access API — full read support with rename/move capability
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ padding: '1rem', background: 'var(--orange-glow)', border: '1px solid rgba(255,157,77,0.3)', borderRadius: 'var(--radius-md)', maxWidth: 480, fontSize: '0.85rem', color: 'var(--orange)' }}>
                    ⚠️ Your browser doesn't support the File System Access API. Using fallback mode: metadata-only scanning, no direct file operations.
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    // @ts-ignore
                    webkitdirectory=""
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFileInputChange}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '0.875rem 2.5rem', background: 'var(--bg-raised)',
                      color: 'var(--text-primary)', border: '1px solid var(--border)',
                      borderRadius: 12, fontSize: '1rem', cursor: 'pointer',
                    }}
                  >
                    Select folder (fallback)
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 1: Options */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '2rem' }}>
              <h2 style={{ fontFamily: 'Space Grotesk', marginBottom: '0.5rem' }}>Scan options</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Scanning: <strong style={{ color: 'var(--purple)' }}>{folderName}</strong>
              </p>

              {[
                { key: 'identifyFileTypes', icon: Layers, label: 'Identify file types', desc: 'Categorize files by extension: images, videos, documents, etc.' },
                { key: 'findDuplicates', icon: Copy, label: 'Find exact duplicates', desc: 'Hash file contents to detect identical files. Requires readable files.' },
                { key: 'detectAmbiguousFilenames', icon: Tag, label: 'Detect ambiguous filenames', desc: 'Flag generic names like "Untitled", "IMG_1234", "new document".' },
                { key: 'suggestOrganization', icon: Settings2, label: 'Suggest folder organization', desc: 'Generate rules-based suggestions for sorting files into folders.' },
                { key: 'generateFilenames', icon: Brain, label: 'AI filename suggestions (requires Ollama)', desc: 'Use local AI to suggest descriptive filenames for ambiguous files.' },
                { key: 'analyzeDocumentText', icon: FileText, label: 'Analyze document text (local, Ollama)', desc: 'Summarize text documents locally with the configured model.' },
              ].map(({ key, icon: Icon, label, desc }) => (
                <div
                  key={key}
                  onClick={() => setOptions((o) => ({ ...o, [key]: !o[key] }))}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '1rem',
                    padding: '1rem', borderRadius: 'var(--radius-md)',
                    border: `1px solid ${options[key] ? 'var(--border-hover)' : 'var(--border)'}`,
                    background: options[key] ? 'var(--purple-glow)' : 'var(--bg-raised)',
                    cursor: 'pointer', marginBottom: '0.75rem',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: options[key] ? 'rgba(167,139,250,0.2)' : 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color={options[key] ? 'var(--purple)' : 'var(--text-muted)'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: options[key] ? 'var(--text-primary)' : 'var(--text-muted)', marginBottom: '0.2rem' }}>{label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{desc}</div>
                  </div>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', border: `2px solid ${options[key] ? 'var(--purple)' : 'var(--border)'}`,
                    background: options[key] ? 'var(--purple)' : 'transparent', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {options[key] && <span style={{ color: '#fff', fontSize: '0.6rem' }}>✓</span>}
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button onClick={() => setStep(0)} style={{ padding: '0.75rem 1.5rem', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', color: 'var(--text-muted)' }}>
                  Back
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={runScan}
                  style={{ flex: 1, padding: '0.75rem', background: 'var(--lime)', color: '#000', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <ScanLine size={16} /> Start scanning
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Progress */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '3rem', textAlign: 'center' }}>
              {error ? (
                <>
                  <AlertCircle size={48} color="var(--red)" style={{ marginBottom: '1rem' }} />
                  <h2 style={{ marginBottom: '0.5rem' }}>Scan failed</h2>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{error}</p>
                  <button onClick={() => setStep(0)} style={{ padding: '0.75rem 1.5rem', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', color: 'var(--text-primary)' }}>
                    Try again
                  </button>
                </>
              ) : (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-flex', marginBottom: '1.5rem' }}
                  >
                    <Loader2 size={48} color="var(--purple)" />
                  </motion.div>
                  <h2 style={{ fontFamily: 'Space Grotesk', marginBottom: '0.5rem' }}>Scanning {folderName}...</h2>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{progressLabel}</p>
                  <div style={{ maxWidth: 400, margin: '0 auto 2rem' }}>
                    <ProgressBar value={scanProgress} color="purple" />
                  </div>
                  <button onClick={handleCancel} style={{ padding: '0.5rem 1.25rem', background: 'none', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <X size={12} style={{ marginRight: 4 }} /> Cancel
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 3: Results */}
        {step === 3 && scanResult && (
          <motion.div key="step3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '2rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <CheckCircle size={48} color="var(--lime)" style={{ marginBottom: '1rem' }} />
                <h2 style={{ fontFamily: 'Space Grotesk', marginBottom: '0.5rem' }}>Scan complete!</h2>
                <p style={{ color: 'var(--text-muted)' }}>{scanResult.scan.scanName}</p>
              </div>

              {scanResult.isFallback && (
                <div style={{ padding: '0.875rem 1rem', background: 'var(--orange-glow)', border: '1px solid rgba(255,157,77,0.3)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.8rem', color: 'var(--orange)' }}>
                  ⚠️ Fallback mode: Duplicate hashing and file operations are not available. Download a cleanup plan to apply changes manually.
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  { label: 'Files found', val: scanResult.scan.fileCount.toLocaleString(), color: 'var(--purple)' },
                  { label: 'Duplicate groups', val: scanResult.scan.duplicateGroupCount, color: 'var(--red)' },
                  { label: 'Clutter score', val: scanResult.scan.clutterDebtScore + '/100', color: 'var(--orange)' },
                  { label: 'Ambiguous names', val: scanResult.scan.ambiguousFilenameCount, color: 'var(--orange)' },
                  { label: 'Space to save', val: formatBytes(scanResult.scan.potentialSpaceSavings), color: 'var(--lime)' },
                  { label: 'Suggestions', val: scanResult.actions.length, color: 'var(--purple)' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ background: 'var(--bg-raised)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'Space Grotesk', color, marginBottom: '0.3rem' }}>{val}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => { setStep(0); setScanResult(null); setDirHandle(null); setFolderName(''); }}
                  style={{ padding: '0.75rem 1.25rem', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  Scan another folder
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handleContinueToCleanup}
                  style={{ flex: 1, padding: '0.875rem', background: 'var(--lime)', color: '#000', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  Continue to Cleanup Studio <ChevronRight size={16} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScanWizard;
