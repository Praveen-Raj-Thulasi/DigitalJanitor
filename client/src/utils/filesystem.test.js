import { describe, it, expect } from 'vitest';
import {
  getFileExtension,
  getFileCategory,
  isTemporaryFile,
  isAmbiguousFilename,
  calculateClutterScore,
  formatBytes,
} from '../src/utils/filesystem.js';

describe('getFileExtension', () => {
  it('returns lowercase extension', () => {
    expect(getFileExtension('Photo.JPG')).toBe('jpg');
    expect(getFileExtension('document.PDF')).toBe('pdf');
  });
  it('returns empty string for no extension', () => {
    expect(getFileExtension('Makefile')).toBe('');
    expect(getFileExtension('')).toBe('');
  });
});

describe('getFileCategory', () => {
  it('categorizes common types', () => {
    expect(getFileCategory('photo.jpg')).toBe('images');
    expect(getFileCategory('movie.mp4')).toBe('videos');
    expect(getFileCategory('song.mp3')).toBe('audio');
    expect(getFileCategory('report.pdf')).toBe('documents');
    expect(getFileCategory('backup.zip')).toBe('archives');
    expect(getFileCategory('script.js')).toBe('code');
  });
  it('returns unknown for unrecognized extensions', () => {
    expect(getFileCategory('file.xyz123')).toBe('unknown');
  });
});

describe('isTemporaryFile', () => {
  it('detects temporary files', () => {
    expect(isTemporaryFile('session.tmp')).toBe(true);
    expect(isTemporaryFile('.DS_Store')).toBe(true);
    expect(isTemporaryFile('Thumbs.db')).toBe(true);
    expect(isTemporaryFile('desktop.ini')).toBe(true);
    expect(isTemporaryFile('~lockfile')).toBe(true);
  });
  it('does not flag normal files', () => {
    expect(isTemporaryFile('report.pdf')).toBe(false);
    expect(isTemporaryFile('index.js')).toBe(false);
  });
});

describe('isAmbiguousFilename', () => {
  it('detects ambiguous names', () => {
    expect(isAmbiguousFilename('Untitled.docx')).toBe(true);
    expect(isAmbiguousFilename('IMG_1234.jpg')).toBe(true);
    expect(isAmbiguousFilename('New Document.txt')).toBe(true);
    expect(isAmbiguousFilename('Copy of report.pdf')).toBe(true);
    expect(isAmbiguousFilename('screenshot.png')).toBe(true);
  });
  it('does not flag descriptive names', () => {
    expect(isAmbiguousFilename('quarterly-report-2026.pdf')).toBe(false);
    expect(isAmbiguousFilename('family-photo-vacation.jpg')).toBe(false);
  });
});

describe('calculateClutterScore', () => {
  it('returns 0 for empty folder', () => {
    expect(calculateClutterScore({ fileCount: 0, duplicateRatio: 0, ambiguousRatio: 0, temporaryRatio: 0 })).toBe(0);
  });
  it('returns high score for mostly duplicates', () => {
    const score = calculateClutterScore({ fileCount: 100, duplicateRatio: 0.8, ambiguousRatio: 0.5, temporaryRatio: 0.3 });
    expect(score).toBeGreaterThan(60);
  });
  it('returns low score for clean folder', () => {
    const score = calculateClutterScore({ fileCount: 100, duplicateRatio: 0.01, ambiguousRatio: 0.02, temporaryRatio: 0.01 });
    expect(score).toBeLessThan(20);
  });
  it('is capped at 100', () => {
    const score = calculateClutterScore({ fileCount: 100, duplicateRatio: 1, ambiguousRatio: 1, temporaryRatio: 1 });
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('formatBytes', () => {
  it('formats bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
  });
});
