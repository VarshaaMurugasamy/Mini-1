import React, { useState, useEffect } from 'react';
import { 
  Ticket as TicketIcon, 
  PlusCircle, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  Bot,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function CustomerDashboard({ 
  currentUser, 
  onOpenCreate, 
  onSelectTicket 
}) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, search]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (search) params.search = search;
      const data = await api.getTickets(params);
      setTickets(data.tickets || []);
    } catch (err) {
      console.error('Error fetching customer tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

  return (
    <div>
      {/* Welcome & Quick KPI Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F0F9FF 55%, #EEF2FF 100%)', 
        borderRadius: '22px', 
        padding: '26px 30px', 
        border: '1px solid #BAE6FD', 
        boxShadow: 'var(--shadow-md)', 
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-purple)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Customer Portal
            </span>
            <span style={{ fontSize: '0.75rem', background: 'var(--primary-purple-light)', color: 'var(--primary-purple)', padding: '2px 8px', borderRadius: '9999px', fontWeight: 600 }}>
              {currentUser.department}
            </span>
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A' }}>
            Welcome, {currentUser.name}
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748B', maxWidth: '600px', marginTop: '2px' }}>
            Submit tickets for hardware, network, software, or account issues. Our AI automatically maps root causes to accelerate technical resolution.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenCreate} style={{ padding: '12px 20px', fontSize: '0.95rem' }}>
          <PlusCircle size={18} /> Submit Helpdesk Ticket
        </button>
      </div>

      {/* KPI Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#EDE9FE', color: '#7C5CFC' }}>
            <TicketIcon size={24} />
          </div>
          <div>
            <div className="stat-title">My Total Tickets</div>
            <div className="stat-value">{totalCount}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E0F2FE', color: '#0284C7' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-title">Active / In Progress</div>
            <div className="stat-value">{openCount}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#D1FAE5', color: '#10B981' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="stat-title">Resolved Tickets</div>
            <div className="stat-value">{resolvedCount}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={14} /> Filter Status:
            </span>
            {['All', 'Open', 'In Progress', 'Resolved', 'Closed'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.8rem', padding: '5px 12px' }}
              >
                {s}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search my tickets..."
              className="form-control"
              style={{ paddingLeft: '36px', fontSize: '0.85rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="card" style={{ padding: '0' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
            Ticket History & Status Tracking
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>
            Showing {tickets.length} tickets
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            Loading tickets...
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#F1F5F9', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <TicketIcon size={28} />
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>No tickets found</h4>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '4px', maxWidth: '400px', margin: '4px auto 16px' }}>
              You don't have any tickets matching the current filters. Click below to submit an issue.
            </p>
            <button className="btn btn-primary" onClick={onOpenCreate}>
              <PlusCircle size={15} /> Create First Ticket
            </button>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Summary & Description</th>
                  <th>AI Root Cause Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned Support</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t._id} style={{ cursor: 'pointer' }} onClick={() => onSelectTicket(t._id)}>
                    <td style={{ fontWeight: 700, color: 'var(--primary-purple)', whiteSpace: 'nowrap' }}>
                      {t.ticketNumber}
                    </td>
                    <td style={{ maxWidth: '320px' }}>
                      <strong style={{ fontSize: '0.9rem', color: '#0F172A', display: 'block' }}>{t.title}</strong>
                      <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.description}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className="category-pill" data-category={t.category} style={{ width: 'fit-content' }}>
                          <Bot size={12} /> {t.category}
                        </span>
                        {t.aiPrediction?.confidence > 0 && (
                          <span className={`ai-confidence-pill ${t.aiPrediction?.confidenceLevel || 'low'}`} style={{ width: 'fit-content' }}>
                            {(t.aiPrediction.confidence * 100).toFixed(0)}% AI Conf.
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`priority-pill ${t.priority.toLowerCase()}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${t.status.toLowerCase().replace(' ', '-')}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>
                      {t.assignedTo ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                          <UserCheck size={14} color="#10B981" />
                          <span style={{ fontWeight: 600 }}>{t.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontStyle: 'italic' }}>
                          Pending assignment
                        </span>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); onSelectTicket(t._id); }}>
                        View <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
