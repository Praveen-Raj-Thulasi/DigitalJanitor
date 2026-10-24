/**
 * Filesystem utilities for Digital Janitor
 * These run entirely in the browser and never send file contents to the server.
 */

// File extension → category mapping
const CATEGORY_MAP = {
  // Images
  jpg: 'images', jpeg: 'images', png: 'images', gif: 'images',
  webp: 'images', svg: 'images', bmp: 'images', ico: 'images',
  tiff: 'images', heic: 'images', avif: 'images', raw: 'images',
  // Videos
  mp4: 'videos', mkv: 'videos', avi: 'videos', mov: 'videos',
  webm: 'videos', wmv: 'videos', flv: 'videos', m4v: 'videos',
  // Audio
  mp3: 'audio', wav: 'audio', flac: 'audio', aac: 'audio',
  ogg: 'audio', m4a: 'audio', wma: 'audio',
  // Documents
  pdf: 'documents', doc: 'documents', docx: 'documents',
  xls: 'documents', xlsx: 'documents', ppt: 'documents',
  pptx: 'documents', txt: 'documents', md: 'documents',
  rtf: 'documents', odt: 'documents', csv: 'documents',
  // Archives
  zip: 'archives', tar: 'archives', gz: 'archives', rar: 'archives',
  '7z': 'archives', bz2: 'archives', xz: 'archives',
  // Code
  js: 'code', ts: 'code', jsx: 'code', tsx: 'code',
  py: 'code', java: 'code', cpp: 'code', c: 'code',
  cs: 'code', go: 'code', rs: 'code', php: 'code',
  rb: 'code', html: 'code', css: 'code', scss: 'code',
  json: 'data', xml: 'data', yaml: 'data', yml: 'data',
  sql: 'data', db: 'data', sqlite: 'data',
  // Temporary
  tmp: 'temporary', temp: 'temporary', bak: 'temporary',
  swp: 'temporary', swo: 'temporary', log: 'temporary',
  cache: 'temporary', crdownload: 'temporary', part: 'temporary',
};

const TEMPORARY_PATTERNS = [
  /^~/, /\.tmp$/, /\.temp$/, /\.bak$/, /\.swp$/, /\.swo$/,
  /desktop\.ini$/i, /thumbs\.db$/i, /\.DS_Store$/i,
  /\.crdownload$/, /\.part$/,
];

const AMBIGUOUS_PATTERNS = [
  /^(new|untitled|document|file|image|photo|video|audio|recording|download)/i,
  /^(img|pic|dsc|vlc|screenshot|screen shot|capture)/i,
  /^\d{4,}$/, // Only digits
  /^[a-f0-9]{8,}$/i, // Hash-like
  /^(copy of|copy \(\d+\))/i,
  /\(\d+\)$/, // Name (1), Name (2), etc.
];

export const getFileExtension = (name) => {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

export const getFileCategory = (name) => {
  const ext = getFileExtension(name);
  return CATEGORY_MAP[ext] || 'unknown';
};

export const isTemporaryFile = (name) => {
  return TEMPORARY_PATTERNS.some((pattern) => pattern.test(name));
};

export const isAmbiguousFilename = (name) => {
  const nameWithoutExt = name.replace(/\.[^.]+$/, '');
  return AMBIGUOUS_PATTERNS.some((pattern) => pattern.test(nameWithoutExt));
};

export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Compute SHA-256 hash of a File object
 * Used for exact duplicate detection
 */
export const hashFile = async (file) => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Calculate Clutter Debt Score (0-100)
 * Higher = more cluttered
 */
export const calculateClutterScore = ({ fileCount, duplicateRatio, ambiguousRatio, temporaryRatio }) => {
  if (fileCount === 0) return 0;
  
  const dupScore = Math.min(duplicateRatio * 40, 40);
  const ambigScore = Math.min(ambiguousRatio * 30, 30);
  const tempScore = Math.min(temporaryRatio * 30, 30);
  
  return Math.round(dupScore + ambigScore + tempScore);
};

/**
 * Check if File System Access API is supported
 */
export const isFSASupported = () => {
  return 'showDirectoryPicker' in window;
};

/**
 * Enumerate files from a FileSystemDirectoryHandle (recursive)
 */
export const enumerateDirectory = async (dirHandle, basePath = '', onProgress = null) => {
  const files = [];
  
  for await (const [name, handle] of dirHandle.entries()) {
    const relativePath = basePath ? `${basePath}/${name}` : name;
    
    if (handle.kind === 'file') {
      try {
        const file = await handle.getFile();
        files.push({
          name,
          relativePath,
          handle,
          fileObject: file,
          sizeBytes: file.size,
          lastModified: new Date(file.lastModified),
          extension: getFileExtension(name),
          category: getFileCategory(name),
          mimeType: file.type || '',
          isTemporary: isTemporaryFile(name),
          isAmbiguous: isAmbiguousFilename(name),
        });
      } catch (err) {
        // Permission or read error — skip file
        console.warn(`Skipping ${relativePath}:`, err.message);
      }
    } else if (handle.kind === 'directory') {
      try {
        const subFiles = await enumerateDirectory(handle, relativePath, onProgress);
        files.push(...subFiles);
      } catch (err) {
        console.warn(`Skipping directory ${relativePath}:`, err.message);
      }
    }
    
    if (onProgress) onProgress(files.length);
  }
  
  return files;
};

/**
 * Enumerate files from a FileList (fallback - no handles)
 */
export const enumerateFileList = (fileList) => {
  const files = [];
  for (const file of fileList) {
    const relativePath = file.webkitRelativePath || file.name;
    const name = file.name;
    files.push({
      name,
      relativePath,
      handle: null,
      fileObject: file,
      sizeBytes: file.size,
      lastModified: new Date(file.lastModified),
      extension: getFileExtension(name),
      category: getFileCategory(name),
      mimeType: file.type || '',
      isTemporary: isTemporaryFile(name),
      isAmbiguous: isAmbiguousFilename(name),
    });
  }
  return files;
};

/**
 * Find exact duplicates by hashing readable files.
 * For performance, first group by size, then hash within same-size groups.
 */
export const findDuplicates = async (files, onProgress = null) => {
  // Step 1: Group by size
  const bySize = {};
  for (const f of files) {
    if (!bySize[f.sizeBytes]) bySize[f.sizeBytes] = [];
    bySize[f.sizeBytes].push(f);
  }

  // Step 2: Only hash files where size matches
  const duplicateGroups = {};
  let processed = 0;

  for (const [size, group] of Object.entries(bySize)) {
    if (group.length < 2 || Number(size) === 0) {
      processed += group.length;
      continue;
    }

    for (const f of group) {
      if (f.fileObject && f.fileObject.size <= 500 * 1024 * 1024) { // Skip files > 500MB
        try {
          const hash = await hashFile(f.fileObject);
          f.hash = hash;
          const key = hash;
          if (!duplicateGroups[key]) duplicateGroups[key] = [];
          duplicateGroups[key].push(f);
        } catch {
          // Can't hash this file — skip
        }
      }
      processed++;
      if (onProgress) onProgress(processed, files.length);
    }
  }

  // Step 3: Keep only groups with 2+ files
  const groups = Object.entries(duplicateGroups)
    .filter(([, group]) => group.length >= 2)
    .map(([hash, group]) => ({
      groupId: hash.substring(0, 16),
      hash,
      sizeBytes: group[0].sizeBytes,
      count: group.length,
      paths: group.map((f) => f.relativePath),
      files: group,
    }));

  // Mark duplicates on file objects
  for (const group of groups) {
    for (const f of group.files) {
      f.isDuplicate = true;
      f.duplicateGroupId = group.groupId;
    }
  }

  const duplicateFileCount = groups.reduce((sum, g) => sum + g.count, 0);
  const potentialSpaceSavings = groups.reduce((sum, g) => sum + g.sizeBytes * (g.count - 1), 0);

  return { groups, duplicateFileCount, potentialSpaceSavings };
};

/**
 * Generate deterministic cleanup suggestions (no AI required)
 */
export const generateDeterministicSuggestions = (files) => {
  const actions = [];

  for (const file of files) {
    // Suggest moving temporary files to a Trash/ folder
    if (file.isTemporary) {
      actions.push({
        actionType: 'archive',
        sourceRelativePath: file.relativePath,
        destinationRelativePath: `_Archive/${file.name}`,
        originalFilename: file.name,
        reason: 'Detected as a temporary or cache file',
        confidence: 0.75,
        source: 'deterministic',
      });
    }

    // Suggest organizing by category
    if (file.category !== 'unknown' && !file.relativePath.includes('/')) {
      const folder = file.category.charAt(0).toUpperCase() + file.category.slice(1);
      actions.push({
        actionType: 'move',
        sourceRelativePath: file.relativePath,
        destinationRelativePath: `${folder}/${file.name}`,
        originalFilename: file.name,
        reason: `Categorized as ${file.category}`,
        confidence: 0.6,
        source: 'deterministic',
      });
    }
  }

  return actions;
};

/**
 * Execute an approved rename operation using FSA handles
 */
export const executeRename = async (fileHandle, newName) => {
  try {
    // FileSystemFileHandle.move() is the FSA way to rename
    if (typeof fileHandle.move === 'function') {
      await fileHandle.move(newName);
      return { success: true };
    }
    return {
      success: false,
      errorMessage: 'Rename not supported in this browser. Download a cleanup plan instead.',
    };
  } catch (err) {
    return { success: false, errorMessage: err.message };
  }
};

/**
 * Execute an approved move operation using FSA handles
 */
export const executeMove = async (fileHandle, destinationDirHandle, newName) => {
  try {
    if (typeof fileHandle.move === 'function') {
      await fileHandle.move(destinationDirHandle, newName || fileHandle.name);
      return { success: true };
    }
    return {
      success: false,
      errorMessage: 'Move not supported in this browser. Download a cleanup plan instead.',
    };
  } catch (err) {
    return { success: false, errorMessage: err.message };
  }
};

/**
 * Generate a downloadable cleanup plan JSON
 */
export const exportCleanupPlan = (plan, scanName) => {
  const data = {
    exportedAt: new Date().toISOString(),
    scanName,
    note: 'This is a cleanup plan export. Apply it manually or with a compatible script.',
    actions: plan.actions
      .filter((a) => a.approvalStatus === 'approved' || a.approvalStatus === 'edited')
      .map((a) => ({
        type: a.actionType,
        from: a.sourceRelativePath,
        to: a.destinationRelativePath || a.suggestedFilename,
        reason: a.reason,
      })),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `digital-janitor-cleanup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
