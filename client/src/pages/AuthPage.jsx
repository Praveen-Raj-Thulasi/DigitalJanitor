import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const AuthPage = ({ mode = 'login' }) => {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const from = location.state?.from?.pathname || '/app';

  const validate = () => {
    const errs = {};
    if (!isLogin && form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!form.email.match(/^\S+@\S+\.\S+$/)) errs.email = 'Valid email address required';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
        toast.success('Welcome back!');
      } else {
        await register(form.name, form.email, form.password);
        toast.success('Account created! Let\'s get cleaning 🧹');
      }
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || (isLogin ? 'Login failed' : 'Registration failed');
      toast.error(msg);
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (hasError) => ({
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'var(--bg-raised)',
    border: `1px solid ${hasError ? 'var(--red)' : 'var(--border)'}`,
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color var(--transition-fast)',
    boxSizing: 'border-box',
  });

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-midnight)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', position: 'relative',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%', maxWidth: 420,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🧹</div>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '1.5rem', marginBottom: '0.25rem' }}>
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {isLogin ? 'Sign in to your Digital Janitor account' : 'Start your digital cleanup journey'}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {!isLogin && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                Full name
              </label>
              <input
                id="auth-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Jane Smith"
                style={inputStyle(errors.name)}
                onFocus={e => e.target.style.borderColor = 'var(--purple)'}
                onBlur={e => e.target.style.borderColor = errors.name ? 'var(--red)' : 'var(--border)'}
              />
              {errors.name && <p style={{ color: 'var(--red)', fontSize: '0.75rem', marginTop: '0.3rem' }}>{errors.name}</p>}
            </div>
          )}

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
              Email address
            </label>
            <input
              id="auth-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jane@example.com"
              style={inputStyle(errors.email)}
              onFocus={e => e.target.style.borderColor = 'var(--purple)'}
              onBlur={e => e.target.style.borderColor = errors.email ? 'var(--red)' : 'var(--border)'}
            />
            {errors.email && <p style={{ color: 'var(--red)', fontSize: '0.75rem', marginTop: '0.3rem' }}>{errors.email}</p>}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="auth-password"
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 8 characters"
                style={{ ...inputStyle(errors.password), paddingRight: '2.75rem' }}
                onFocus={e => e.target.style.borderColor = 'var(--purple)'}
                onBlur={e => e.target.style.borderColor = errors.password ? 'var(--red)' : 'var(--border)'}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', display: 'flex',
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p style={{ color: 'var(--red)', fontSize: '0.75rem', marginTop: '0.3rem' }}>{errors.password}</p>}
          </div>

          {errors.form && (
            <div style={{
              padding: '0.75rem 1rem', background: 'var(--red-glow)',
              border: '1px solid rgba(255,77,106,0.3)', borderRadius: 8,
              color: 'var(--red)', fontSize: '0.85rem', marginBottom: '1rem',
            }}>
              {errors.form}
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '0.875rem',
              background: loading ? 'var(--bg-raised)' : 'var(--lime)',
              color: loading ? 'var(--text-muted)' : '#000',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: '0.95rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            {loading ? '...' : isLogin ? 'Sign in' : 'Create account'}
          </motion.button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {isLogin ? (
            <>Don't have an account? <Link to="/register" style={{ color: 'var(--purple)', fontWeight: 600 }}>Sign up</Link></>
          ) : (
            <>Already have an account? <Link to="/login" style={{ color: 'var(--purple)', fontWeight: 600 }}>Sign in</Link></>
          )}
        </div>

        <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
          <Link to="/" style={{ color: 'var(--text-dim)', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <ArrowLeft size={12} /> Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
