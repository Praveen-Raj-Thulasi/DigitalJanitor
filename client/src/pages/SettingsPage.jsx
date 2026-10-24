import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Bell, Cpu, Shield, Trash2, Download, Save,
  CheckCircle, AlertTriangle, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { settingsApi, aiApi, scansApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LoadingSkeleton } from '../components/ui';

const Section = ({ title, icon: Icon, children }) => (
  <div style={{
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.25rem',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
      <Icon size={16} color="var(--purple)" />
      <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '0.95rem', fontWeight: 700 }}>{title}</h2>
    </div>
    {children}
  </div>
);

const Toggle = ({ label, desc, value, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
    <div>
      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{label}</div>
      {desc && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{desc}</div>}
    </div>
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: value ? 'var(--lime)' : 'var(--bg-raised)',
        position: 'relative', transition: 'background var(--transition-mid)',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: value ? 22 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: value ? '#000' : 'var(--text-dim)',
        transition: 'left var(--transition-mid)',
      }} />
    </button>
  </div>
);

const SettingsPage = () => {
  const { user, loadUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingAi, setTestingAi] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [settRes, aiRes] = await Promise.all([
          settingsApi.get(),
          aiApi.getStatus(),
        ]);
        setSettings(settRes.data.data);
        setAiStatus(aiRes.data.data);
        setProfileForm({ name: user?.name || '', email: user?.email || '' });
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  const saveSettings = async (updates) => {
    setSaving(true);
    try {
      const { data } = await settingsApi.update(updates);
      setSettings(data.data);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key) => (val) => {
    const updated = { ...settings, [key]: val };
    if (key === 'theme') {
      setTheme(val ? 'dark' : 'light');
    }
    setSettings(updated);
    saveSettings({ [key]: val });
  };

  const handleScanOptionToggle = (key) => (val) => {
    const updated = {
      ...settings,
      defaultScanOptions: { ...settings.defaultScanOptions, [key]: val },
    };
    setSettings(updated);
    saveSettings({ defaultScanOptions: updated.defaultScanOptions });
  };

  const retestAi = async () => {
    setTestingAi(true);
    try {
      const { data } = await aiApi.getStatus();
      setAiStatus(data.data);
      toast.success(data.data.available ? 'Ollama is reachable!' : 'Ollama is still offline');
    } catch {
      toast.error('AI status check failed');
    } finally {
      setTestingAi(false);
    }
  };

  const clearScanData = async () => {
    if (!confirm('This will permanently delete all your scan history and cleanup plans. Are you sure?')) return;
    try {
      const { data } = await scansApi.getAll({ limit: 100 });
      for (const scan of data.data) {
        await scansApi.delete(scan._id);
      }
      toast.success('Scan data cleared');
    } catch {
      toast.error('Failed to clear scan data');
    }
  };

  if (loading) return <LoadingSkeleton height={400} radius={18} />;

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '1.75rem', marginBottom: '0.25rem' }}>Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Configure your Digital Janitor preferences.</p>
      </div>

      {/* Profile */}
      <Section title="Profile" icon={User}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Name</label>
            <input
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              style={{ width: '100%', padding: '0.65rem 1rem', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.875rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Email</label>
            <input
              value={profileForm.email}
              disabled
              style={{ width: '100%', padding: '0.65rem 1rem', background: 'var(--bg-midnight)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-dim)', fontSize: '0.875rem', cursor: 'not-allowed' }}
            />
            <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>Email cannot be changed after registration.</p>
          </div>
        </div>
      </Section>

      {/* Appearance */}
      <Section title="Appearance" icon={Bell}>
        <Toggle
          label="Dark mode"
          desc="Use the dark theme (default). Switch to light for bright environments."
          value={theme === 'dark'}
          onChange={(v) => { setTheme(v ? 'dark' : 'light'); saveSettings({ theme: v ? 'dark' : 'light' }); }}
        />
        <Toggle
          label="Notifications"
          desc="Show toast notifications for completed operations."
          value={settings?.notifications ?? true}
          onChange={handleToggle('notifications')}
        />
      </Section>

      {/* Default Scan Options */}
      <Section title="Default Scan Options" icon={Bell}>
        {[
          { key: 'identifyFileTypes', label: 'Identify file types', desc: 'Categorize files by extension.' },
          { key: 'findDuplicates', label: 'Find exact duplicates', desc: 'Hash file contents to detect identical files.' },
          { key: 'detectAmbiguousFilenames', label: 'Detect ambiguous filenames', desc: 'Flag generic names like Untitled, IMG_1234.' },
          { key: 'suggestOrganization', label: 'Suggest folder organization', desc: 'Generate rules-based folder suggestions.' },
          { key: 'generateFilenames', label: 'AI filename suggestions', desc: 'Requires Ollama running locally.' },
        ].map(({ key, label, desc }) => (
          <Toggle
            key={key}
            label={label}
            desc={desc}
            value={settings?.defaultScanOptions?.[key] ?? false}
            onChange={handleScanOptionToggle(key)}
          />
        ))}
      </Section>

      {/* AI / Ollama */}
      <Section title="Local AI (Ollama)" icon={Cpu}>
        <div style={{
          padding: '1rem', borderRadius: 10,
          background: aiStatus?.available ? 'rgba(199,255,77,0.06)' : 'rgba(255,77,106,0.06)',
          border: `1px solid ${aiStatus?.available ? 'rgba(199,255,77,0.25)' : 'rgba(255,77,106,0.25)'}`,
          marginBottom: '1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: aiStatus?.available ? 'var(--lime)' : 'var(--red)', boxShadow: aiStatus?.available ? '0 0 8px var(--lime)' : '0 0 8px var(--red)' }} />
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: aiStatus?.available ? 'var(--lime)' : 'var(--red)' }}>
                {aiStatus?.available ? `Connected — ${aiStatus.model}` : 'Ollama not detected'}
              </span>
            </div>
            <button onClick={retestAi} disabled={testingAi} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '0.3rem 0.7rem', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <RefreshCw size={12} className={testingAi ? 'spin' : ''} /> Test
            </button>
          </div>
          {!aiStatus?.available && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <strong>To enable local AI:</strong>
              <ol style={{ margin: '0.4rem 0 0 1.2rem', lineHeight: 2 }}>
                <li>Install Ollama: <code style={{ background: 'var(--bg-raised)', padding: '0 4px', borderRadius: 4 }}>curl https://ollama.ai/install.sh | sh</code></li>
                <li>Start service: <code style={{ background: 'var(--bg-raised)', padding: '0 4px', borderRadius: 4 }}>ollama serve</code></li>
                <li>Pull model: <code style={{ background: 'var(--bg-raised)', padding: '0 4px', borderRadius: 4 }}>ollama pull llama3.2</code></li>
              </ol>
            </div>
          )}
          {aiStatus?.available && !aiStatus?.modelAvailable && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--orange)' }}>
              ⚠️ Ollama is running but model <strong>{aiStatus.model}</strong> is not pulled.
              Run: <code style={{ background: 'var(--bg-raised)', padding: '0 4px', borderRadius: 4 }}>ollama pull {aiStatus.model}</code>
            </div>
          )}
        </div>

        <Toggle
          label="Enable AI features"
          desc="Allow the app to send file metadata to your local Ollama instance for analysis."
          value={settings?.aiEnabled ?? true}
          onChange={handleToggle('aiEnabled')}
        />

        {aiStatus?.models?.length > 0 && (
          <div style={{ marginTop: '0.75rem' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Available models:</p>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {aiStatus.models.map((m) => (
                <span key={m} style={{ padding: '0.2rem 0.6rem', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 20, fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{m}</span>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Privacy & Data */}
      <Section title="Privacy & Data" icon={Shield}>
        <div style={{ padding: '0.875rem 1rem', background: 'rgba(167,139,250,0.06)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--purple)' }}>What stays local:</strong> All file contents, directory handles, and filesystem operations happen entirely in your browser.<br />
          <strong style={{ color: 'var(--purple)' }}>What's stored in MongoDB:</strong> File metadata (names, sizes, paths, hashes), scan summaries, cleanup plans, and activity logs. No file contents are uploaded.
        </div>

        <Toggle
          label="Auto-cleanup (disabled by default)"
          desc="⚠️ Allows suggested operations to be applied without an additional confirmation step. Keep off for safety."
          value={settings?.autoCleanup ?? false}
          onChange={handleToggle('autoCleanup')}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--red)' }}>Clear all scan data</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Permanently deletes all scans, plans, and activity history.</div>
          </div>
          <button
            onClick={clearScanData}
            style={{ padding: '0.4rem 0.875rem', background: 'var(--red-glow)', border: '1px solid rgba(255,77,106,0.3)', borderRadius: 8, color: 'var(--red)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Trash2 size={13} /> Clear
          </button>
        </div>
      </Section>
    </div>
  );
};

export default SettingsPage;
