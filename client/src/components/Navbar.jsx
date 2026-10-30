import React from 'react';
import { 
  Bot, 
  LifeBuoy, 
  User, 
  ShieldCheck, 
  Wrench, 
  PlusCircle, 
  LogOut, 
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';

export default function Navbar({ user, onLogout, onOpenCreate, onSwitchRole, onOpenLogin }) {
  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="role-badge admin"><ShieldCheck size={14} /> Administrator</span>;
      case 'support_engineer':
        return <span className="role-badge support_engineer"><Wrench size={14} /> Support Engineer</span>;
      default:
        return <span className="role-badge customer"><User size={14} /> Customer</span>;
    }
  };

  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="brand">
          <div className="brand-icon">
            <Bot size={24} />
          </div>
          <div>
            <span className="brand-title">Intelligent Helpdesk</span>
            <span className="brand-subtitle">Automated Root Cause AI Mapping</span>
          </div>
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              {/* Quick Role Switcher for Demo testing */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F8FAFC', padding: '4px 10px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ArrowRightLeft size={12} /> Switch Demo Role:
                </span>
                <button 
                  className={`btn btn-sm ${user.role === 'customer' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => onSwitchRole('customer@helpdesk.com', 'password123')}
                  title="Switch to Customer view"
                >
                  Customer
                </button>
                <button 
                  className={`btn btn-sm ${user.role === 'support_engineer' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => onSwitchRole('engineer@helpdesk.com', 'password123')}
                  title="Switch to Support Engineer view"
                >
                  Engineer
                </button>
                <button 
                  className={`btn btn-sm ${user.role === 'admin' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => onSwitchRole('admin@helpdesk.com', 'admin123')}
                  title="Switch to Administrator view"
                >
                  Admin
                </button>
              </div>

              {/* Create ticket button */}
              <button className="btn btn-primary" onClick={onOpenCreate}>
                <PlusCircle size={16} />
                <span>New Ticket</span>
              </button>

              {/* User details and badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid #E2E8F0', paddingLeft: '12px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0F172A' }}>{user.name}</div>
                  {getRoleBadge(user.role)}
                </div>
                <button 
                  className="btn btn-outline btn-sm" 
                  onClick={onLogout}
                  title="Logout"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </>
          ) : (
            <button className="btn btn-primary" onClick={onOpenLogin}>
              <User size={16} /> Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
