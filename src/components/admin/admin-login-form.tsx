'use client';

import { useState } from 'react';
import { Eye, EyeOff, Shield } from '../icons';

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'scaffold2026';

export function AdminLoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      document.cookie = `scaffold_role=admin; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
      document.cookie = `scaffold_uid=admin; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
      document.cookie = `scaffold_onboarded=1; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
      window.location.href = '/admin';
    } else {
      setError('Invalid credentials.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: 380,
      padding: 32,
      border: '1px solid var(--hairline)',
      background: 'var(--panel)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Shield className="h-7 w-7 text-ember" />
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>Admin Panel</span>
      </div>

      {error && <p className="form-error" style={{ marginBottom: 16 }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <label className="field">
          <span className="field-label">Username</span>
          <input
            className="input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            required
            autoFocus
          />
        </label>

        <label className="field">
          <span className="field-label">Password</span>
          <div style={{ position: 'relative' }}>
            <input
              className="input"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--ash)',
                padding: 4,
                display: 'flex',
              }}
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        <button
          className="btn btn-primary btn-lg w-full justify-center"
          type="submit"
          disabled={loading}
          style={{ marginTop: 8 }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
