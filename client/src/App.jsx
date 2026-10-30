import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CustomerDashboard from './components/CustomerDashboard';
import EngineerDashboard from './components/EngineerDashboard';
import AdminDashboard from './components/AdminDashboard';
import CreateTicketModal from './components/CreateTicketModal';
import TicketDetailModal from './components/TicketDetailModal';
import LoginModal from './components/LoginModal';
import { api, getCurrentUser, removeToken, removeCurrentUser } from './services/api';
import { Bot, Shield, CheckCircle2, Cpu } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  // Trigger data reload on ticket updates
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      const savedUser = getCurrentUser();
      if (savedUser) {
        setCurrentUser(savedUser);
        try {
          const fresh = await api.getMe();
          setCurrentUser(fresh);
        } catch (err) {
          console.warn('Session check note:', err.message);
        }
      } else {
        const data = await api.login('customer@helpdesk.com', 'password123');
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.warn('Auto demo login note:', err.message);
      // Immediate fallback so interface renders instantly without getting stuck
      setCurrentUser({
        id: '6ac9b7e72d936b5550820c17',
        name: 'Michael Scott (Customer)',
        email: 'customer@helpdesk.com',
        role: 'customer',
        department: 'Sales & Marketing'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    removeCurrentUser();
    setCurrentUser(null);
    setIsLoginOpen(true);
  };

  const handleSwitchRole = async (email, password) => {
    try {
      setLoading(true);
      const data = await api.login(email, password);
      setCurrentUser(data.user);
      setSelectedTicketId(null);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Error switching role:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketSubmitted = (newTicket) => {
    setRefreshKey(prev => prev + 1);
    setSelectedTicketId(newTicket._id);
  };

  const handleTicketUpdated = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading && !currentUser) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--primary-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
          <Bot size={28} />
        </div>
        <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Initializing Intelligent Helpdesk...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Navigation Bar */}
      <Navbar
        user={currentUser}
        onLogout={handleLogout}
        onOpenCreate={() => setIsCreateOpen(true)}
        onSwitchRole={handleSwitchRole}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {/* Main Content Dashboard */}
      <main className="main-content" key={refreshKey}>
        {currentUser ? (
          currentUser.role === 'admin' ? (
            <AdminDashboard
              currentUser={currentUser}
              onSelectTicket={(id) => setSelectedTicketId(id)}
            />
          ) : currentUser.role === 'support_engineer' ? (
            <EngineerDashboard
              currentUser={currentUser}
              onSelectTicket={(id) => setSelectedTicketId(id)}
            />
          ) : (
            <CustomerDashboard
              currentUser={currentUser}
              onOpenCreate={() => setIsCreateOpen(true)}
              onSelectTicket={(id) => setSelectedTicketId(id)}
            />
          )
        ) : (
          <div style={{ padding: '80px 20px', textAlign: 'center' }}>
            <h2>Please sign in to access the helpdesk</h2>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => setIsLoginOpen(true)}>
              Sign In
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', background: '#FFFFFF', padding: '18px 24px', marginTop: 'auto', textAlign: 'center', fontSize: '0.8rem', color: '#64748B' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, color: '#0F172A' }}>Intelligent Helpdesk System</span>
            <span>&bull; Automated Root Cause Category Mapping</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>Frontend: React + Vite</span>
            <span>Backend: Node.js + Express</span>
            <span>Database: MongoDB Atlas / Local</span>
            <span>AI: Python Scikit-Learn TF-IDF</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CreateTicketModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmitSuccess={handleTicketSubmitted}
      />

      {selectedTicketId && (
        <TicketDetailModal
          ticketId={selectedTicketId}
          currentUser={currentUser}
          onClose={() => setSelectedTicketId(null)}
          onTicketUpdated={handleTicketUpdated}
        />
      )}

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setRefreshKey(prev => prev + 1);
        }}
      />
    </div>
  );
}
