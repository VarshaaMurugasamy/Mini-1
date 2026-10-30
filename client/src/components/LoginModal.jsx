import React, { useState } from 'react';
import { 
  X, 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  Wrench, 
  User, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function LoginModal({ isOpen, onClose, onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Marketing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let data;
      if (isRegister) {
        data = await api.register(name, email, password, department);
      } else {
        data = await api.login(email, password);
      }
      onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail, demoPassword) => {
    setError('');
    setLoading(true);
    try {
      const data = await api.login(demoEmail, demoPassword);
      onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">
              {isRegister ? 'Create Customer Account' : 'Sign In to Helpdesk'}
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748B' }}>
              Access AI-powered ticket management and resolution
            </p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={onClose} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{ padding: '10px 14px', background: '#FEE2E2', color: '#DC2626', borderRadius: '10px', marginBottom: '14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {/* Quick 1-Click Demo Profiles */}
          <div style={{ marginBottom: '18px', background: 'linear-gradient(135deg, #F5F3FF 0%, #E0F2FE 100%)', padding: '14px', borderRadius: '14px', border: '1px solid #DDD6FE' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-purple)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={13} /> 1-CLICK DEMO LOGIN (TEST ACCOUNTS):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ background: '#FFFFFF', justifyContent: 'flex-start', fontSize: '0.8rem', padding: '7px 10px' }}
                onClick={() => handleQuickDemoLogin('customer@helpdesk.com', 'password123')}
                disabled={loading}
              >
                <User size={14} color="#0284C7" /> Log in as Customer (Michael Scott)
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ background: '#FFFFFF', justifyContent: 'flex-start', fontSize: '0.8rem', padding: '7px 10px' }}
                onClick={() => handleQuickDemoLogin('engineer@helpdesk.com', 'password123')}
                disabled={loading}
              >
                <Wrench size={14} color="#7C5CFC" /> Log in as Support Engineer (Sarah Connor)
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ background: '#FFFFFF', justifyContent: 'flex-start', fontSize: '0.8rem', padding: '7px 10px' }}
                onClick={() => handleQuickDemoLogin('admin@helpdesk.com', 'admin123')}
                disabled={loading}
              >
                <ShieldCheck size={14} color="#D97706" /> Log in as Administrator (Alex Johnson)
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0', color: '#94A3B8', fontSize: '0.75rem' }}>
            <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
            <span style={{ padding: '0 10px' }}>OR USE CREDENTIALS</span>
            <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
          </div>

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Sales, Finance, Engineering"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
              {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.82rem', color: '#64748B' }}>
            {isRegister ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--primary-purple)', fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => setIsRegister(false)}
                >
                  Sign in
                </button>
              </span>
            ) : (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--primary-purple)', fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => setIsRegister(true)}
                >
                  Register new account
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
