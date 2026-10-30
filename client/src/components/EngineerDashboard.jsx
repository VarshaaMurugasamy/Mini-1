import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  UserCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Filter, 
  Search, 
  Bot, 
  ChevronRight,
  Shield,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export default function EngineerDashboard({ 
  currentUser, 
  onSelectTicket 
}) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState('all'); // 'all', 'me', 'unassigned'
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [search, setSearch] = useState('');

  const categories = [
    'All',
    'Network Issues',
    'Hardware Issues',
    'Software Issues',
    'Login and Authentication',
    'Database Issues',
    'Email and Communication',
    'Other / Unknown'
  ];

  useEffect(() => {
    fetchTickets();
  }, [scope, categoryFilter, statusFilter, priorityFilter, search]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = {};
      if (scope === 'me') params.assigned = 'me';
      if (scope === 'unassigned') params.assigned = 'unassigned';
      if (categoryFilter !== 'All') params.category = categoryFilter;
      if (statusFilter !== 'All') params.status = statusFilter;
      if (priorityFilter !== 'All') params.priority = priorityFilter;
      if (search) params.search = search;

      const data = await api.getTickets(params);
      setTickets(data.tickets || []);
    } catch (err) {
      console.error('Error fetching engineer tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeTicket = async (e, ticketId) => {
    e.stopPropagation();
    try {
      await api.assignTicket(ticketId, currentUser.id);
      fetchTickets();
    } catch (err) {
      alert('Error assigning ticket: ' + err.message);
    }
  };

  const handleQuickStatusChange = async (e, ticketId, newStatus) => {
    e.stopPropagation();
    try {
      await api.updateTicketStatus(ticketId, { status: newStatus });
      fetchTickets();
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const assignedToMeCount = tickets.filter(t => t.assignedTo?._id === currentUser.id).length;
  const unassignedCount = tickets.filter(t => !t.assignedTo).length;
  const urgentCount = tickets.filter(t => t.priority === 'High' || t.priority === 'Urgent').length;

  return (
    <div>
      {/* Engineer Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 50%, #E0F2FE 100%)', 
        borderRadius: '22px', 
        padding: '26px 30px', 
        border: '1px solid #DDD6FE', 
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
              Support Engineering Workbench
            </span>
            <span style={{ fontSize: '0.75rem', background: '#FFFFFF', color: 'var(--primary-purple)', padding: '2px 8px', borderRadius: '9999px', fontWeight: 600, border: '1px solid #DDD6FE' }}>
              Level 2 Technical Response
            </span>
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A' }}>
            Engineer Workspace &bull; {currentUser.name}
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748B', maxWidth: '650px', marginTop: '2px' }}>
            Review AI classified root cause mapping, troubleshoot customer requests, resolve tickets, and record diagnostic notes.
          </p>
        </div>

        <button className="btn btn-outline" onClick={fetchTickets} style={{ background: '#FFFFFF' }}>
          <RefreshCw size={15} /> Refresh Queue
        </button>
      </div>

      {/* KPI Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#EDE9FE', color: '#7C5CFC' }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div className="stat-title">Assigned to Me</div>
            <div className="stat-value">{assignedToMeCount}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-title">Unassigned Pool</div>
            <div className="stat-value">{unassignedCount}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FEE2E2', color: '#EF4444' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="stat-title">High & Urgent Priority</div>
            <div className="stat-value">{urgentCount}</div>
          </div>
        </div>
      </div>

      {/* Filtering Controls */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        {/* Scope selector tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', marginBottom: '14px' }}>
          <button
            className={`btn btn-sm ${scope === 'all' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setScope('all')}
          >
            All Tickets
          </button>
          <button
            className={`btn btn-sm ${scope === 'me' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setScope('me')}
          >
            Assigned to Me
          </button>
          <button
            className={`btn btn-sm ${scope === 'unassigned' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setScope('unassigned')}
          >
            Unassigned Queue
          </button>
        </div>

        {/* Filters and search row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '4px' }}>CATEGORY</label>
            <select
              className="form-control"
              style={{ fontSize: '0.82rem', padding: '6px 10px' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '4px' }}>STATUS</label>
            <select
              className="form-control"
              style={{ fontSize: '0.82rem', padding: '6px 10px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '4px' }}>PRIORITY</label>
            <select
              className="form-control"
              style={{ fontSize: '0.82rem', padding: '6px 10px' }}
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '4px' }}>SEARCH</label>
            <input
              type="text"
              placeholder="Search keyword or ID..."
              className="form-control"
              style={{ fontSize: '0.82rem', padding: '6px 10px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tickets Management Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
            Support Queue ({tickets.length})
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Click any row to open full technical diagnosis & conversation notes
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            Loading tickets queue...
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: '#64748B' }}>
            No tickets match the selected filters.
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Customer & Dept</th>
                  <th>Issue Summary</th>
                  <th>AI Root Cause Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned Engineer</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => {
                  const isAssignedToMe = t.assignedTo?._id === currentUser.id;
                  return (
                    <tr key={t._id} style={{ cursor: 'pointer' }} onClick={() => onSelectTicket(t._id)}>
                      <td style={{ fontWeight: 700, color: 'var(--primary-purple)', whiteSpace: 'nowrap' }}>
                        {t.ticketNumber}
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.85rem', color: '#0F172A', display: 'block' }}>{t.customer?.name}</strong>
                        <span style={{ fontSize: '0.74rem', color: '#64748B' }}>{t.customer?.department || 'General'}</span>
                      </td>
                      <td style={{ maxWidth: '280px' }}>
                        <strong style={{ fontSize: '0.88rem', color: '#0F172A', display: 'block' }}>{t.title}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.description}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span className="category-pill" style={{ width: 'fit-content' }}>
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
                        <select
                          className="form-control"
                          style={{ fontSize: '0.78rem', padding: '4px 8px', width: '120px' }}
                          value={t.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleQuickStatusChange(e, t._id, e.target.value)}
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>
                      <td>
                        {t.assignedTo ? (
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: isAssignedToMe ? 'var(--primary-purple)' : '#334155' }}>
                            {isAssignedToMe ? '★ You' : t.assignedTo.name}
                          </span>
                        ) : (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            onClick={(e) => handleTakeTicket(e, t._id)}
                          >
                            Assign to Me
                          </button>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); onSelectTicket(t._id); }}>
                          Details <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
