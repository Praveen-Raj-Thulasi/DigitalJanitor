import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ScanLine, Wand2, Shield, Cpu, ArrowRight, Github, ChevronRight } from 'lucide-react';

const FEATURES = [
  {
    icon: ScanLine,
    name: 'Clutter Radar',
    color: 'var(--purple)',
    glow: 'var(--purple-glow)',
    desc: 'Deep-scan any folder. Instantly see duplicates, junk files, and chaotic naming — all organized in a beautiful interactive view.',
  },
  {
    icon: Wand2,
    name: 'AI Sorting Brain',
    color: 'var(--lime)',
    glow: 'var(--lime-glow)',
    desc: 'Powered by local open-weight models via Ollama. Suggests meaningful filenames and smart folder structures — completely offline.',
  },
  {
    icon: Shield,
    name: 'Safe Cleanup',
    color: 'var(--orange)',
    glow: 'var(--orange-glow)',
    desc: 'Review every suggestion before anything changes. No auto-delete. No surprises. You stay in control at every step.',
  },
  {
    icon: Cpu,
    name: 'Local-First Privacy',
    color: 'var(--purple)',
    glow: 'var(--purple-glow)',
    desc: 'Files stay on your machine. Only metadata and your review history go to the database. No cloud AI, no telemetry.',
  },
];

const WORKFLOW_STEPS = [
  { n: '01', label: 'Scan', desc: 'Select a folder. The browser reads metadata locally.' },
  { n: '02', label: 'Analyze', desc: 'Deterministic rules + optional local AI find patterns.' },
  { n: '03', label: 'Review', desc: 'You approve, reject, or edit every suggestion.' },
  { n: '04', label: 'Clean', desc: 'Apply approved changes. Download a plan if needed.' },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ background: 'var(--bg-midnight)', color: 'var(--text-primary)', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(21,18,31,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🧹</span>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.1rem' }}>Digital Janitor</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)',
              padding: '0.45rem 1rem', borderRadius: 20, cursor: 'pointer', fontSize: '0.875rem',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.color = 'var(--purple)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/register')}
            style={{
              background: 'var(--lime)', border: 'none', color: '#000',
              padding: '0.45rem 1rem', borderRadius: 20, cursor: 'pointer',
              fontSize: '0.875rem', fontWeight: 700,
            }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: '8rem', paddingBottom: '5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span style={{
            display: 'inline-block', marginBottom: '1.5rem',
            padding: '0.35rem 1rem', borderRadius: 20,
            background: 'var(--purple-glow)', border: '1px solid var(--border-hover)',
            fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
            color: 'var(--purple)',
          }}>
            Open-Source AI Challenge · Slow and Steady
          </span>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontFamily: 'Space Grotesk', fontWeight: 900,
            lineHeight: 1.1, marginBottom: '1rem',
          }}>
            Your files are{' '}
            <span style={{
              background: 'linear-gradient(135deg, var(--purple), var(--lime))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              a mess.
            </span>
            <br />We don't judge.
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: 560, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            Privacy-first, local AI-powered file organization. Scan. Analyze. Review. Clean — with zero cloud drama and full transparency.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/register')}
              style={{
                padding: '0.875rem 2rem', background: 'var(--lime)', color: '#000',
                border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 800,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                boxShadow: 'var(--shadow-lime)',
              }}
            >
              Clean my digital life <ArrowRight size={18} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
              style={{
                padding: '0.875rem 2rem', background: 'transparent',
                color: 'var(--text-primary)', border: '1px solid var(--border)',
                borderRadius: 12, fontSize: '1rem', cursor: 'pointer',
              }}
            >
              See how it works
            </motion.button>
          </div>
        </motion.div>

        {/* Dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{
            margin: '4rem auto 0', maxWidth: 900,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: '0 20px 80px rgba(0,0,0,0.5), 0 0 0 1px var(--border)',
            padding: '1.5rem',
          }}
        >
          {/* Mock dashboard preview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
            {[
              { label: 'Clutter Score', val: '42', color: 'var(--orange)' },
              { label: 'Files Scanned', val: '1,284', color: 'var(--purple)' },
              { label: 'Duplicates', val: '3.2 GB', color: 'var(--red)' },
              { label: 'Cleanup Progress', val: '78%', color: 'var(--lime)' },
            ].map((item) => (
              <div key={item.label} style={{ background: 'var(--bg-raised)', borderRadius: 12, padding: '1rem', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{item.label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: item.color }}>{item.val}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 2, background: 'var(--bg-raised)', borderRadius: 12, padding: '1rem', border: '1px solid var(--border)', minHeight: 100 }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>File Type Distribution</div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 60 }}>
                {[80, 45, 30, 60, 20, 50, 35, 15].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: `${h}%`, background: i % 3 === 0 ? 'var(--purple)' : i % 3 === 1 ? 'var(--lime)' : 'var(--orange)', borderRadius: '3px 3px 0 0', opacity: 0.7 }} />
                ))}
              </div>
            </div>
            <div style={{ flex: 1, background: 'var(--bg-raised)', borderRadius: 12, padding: '1rem', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI Status</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--lime)', boxShadow: '0 0 6px var(--lime)' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--lime)' }}>llama3.2 · Local</span>
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>Running on your machine</div>
            </div>
          </div>
          <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
            ↑ Dashboard preview — populate with your own scans
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section style={{ padding: '5rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontFamily: 'Space Grotesk', marginBottom: '0.75rem' }}>Everything you need to declutter</h2>
          <p style={{ color: 'var(--text-muted)' }}>Built for privacy, designed for control.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '1.75rem',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, background: `radial-gradient(circle, ${f.glow} 0%, transparent 70%)` }} />
              <div style={{ width: 44, height: 44, borderRadius: 10, background: f.glow, border: `1px solid ${f.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <f.icon size={20} color={f.color} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontFamily: 'Space Grotesk', marginBottom: '0.5rem', color: f.color }}>{f.name}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ padding: '5rem 2rem', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontFamily: 'Space Grotesk', marginBottom: '0.75rem' }}>Scan → Analyze → Review → Clean</h2>
            <p style={{ color: 'var(--text-muted)' }}>A transparent, step-by-step workflow designed to keep you in control.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2rem' }}>
            {WORKFLOW_STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.12 }}
                style={{ textAlign: 'center' }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', margin: '0 auto 1rem',
                  background: 'var(--bg-raised)', border: '2px solid var(--purple)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Space Grotesk', fontWeight: 800, color: 'var(--purple)',
                }}>
                  {step.n}
                </div>
                <h3 style={{ fontFamily: 'Space Grotesk', marginBottom: '0.5rem' }}>{step.label}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Open Source */}
      <section style={{ padding: '5rem 2rem', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontFamily: 'Space Grotesk', marginBottom: '0.75rem' }}>Why Open-Source AI?</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 560, margin: '0 auto' }}>
            Digital Janitor is built on the principle that your files and your data belong to you.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {[
            { icon: '🏠', title: 'Local model execution', desc: 'Ollama runs open-weight models on your hardware. No API keys, no subscription, no data leaving your machine.' },
            { icon: '🔒', title: 'Privacy by design', desc: 'File contents are never uploaded. Only metadata and your review decisions are stored in MongoDB.' },
            { icon: '🔧', title: 'Model flexibility', desc: 'Configure any Ollama-compatible model. Switch from llama3.2 to mistral to phi3 without touching code.' },
            { icon: '⚡', title: 'Works without AI', desc: 'Deterministic duplicate detection, category classification, and clutter scoring work even when Ollama is offline.' },
            { icon: '👁', title: 'Transparent operations', desc: 'Every suggestion comes with a reason. Every action is logged. Nothing happens without your explicit approval.' },
            { icon: '💻', title: 'Hardware-honest', desc: 'Local LLMs require meaningful RAM and compute. We document requirements and never fabricate AI responses.' },
          ].map((item) => (
            <div key={item.title} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '1.5rem',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{item.icon}</div>
              <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '0.95rem', marginBottom: '0.4rem' }}>{item.title}</h3>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '5rem 2rem', textAlign: 'center', background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
        <motion.div whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }}>
          <h2 style={{ fontSize: '2.2rem', fontFamily: 'Space Grotesk', marginBottom: '1rem' }}>
            Your mess. Our mission.<br />
            <span style={{ color: 'var(--lime)' }}>Zero digital drama.</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            Start your first scan in under 60 seconds.
          </p>
          <button
            onClick={() => navigate('/register')}
            style={{
              padding: '0.875rem 2.5rem',
              background: 'var(--lime)', color: '#000',
              border: 'none', borderRadius: 12,
              fontSize: '1rem', fontWeight: 800, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: 'var(--shadow-lime)',
            }}
          >
            Get started free <ChevronRight size={18} />
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '2rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🧹</span>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '0.9rem' }}>Digital Janitor</span>
          <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>· Open Source</span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <a href="https://github.com" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Github size={14} /> GitHub
          </a>
          <span>Privacy: Files stay local</span>
          <span>AI: Ollama (local only)</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
