import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bot, 
  Sparkles, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Send, 
  Lock, 
  FileText,
  ChevronRight,
  Shield,
  Layers
} from 'lucide-react';
import { api } from '../services/api';

export default function TicketDetailModal({ 
  ticketId, 
  currentUser, 
  onClose, 
  onTicketUpdated 
}) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [engineers, setEngineers] = useState([]);
  
  // Status & resolution notes state
  const [status, setStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Assignment state
  const [assignedTo, setAssignedTo] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Reclassification state
  const [reclassifying, setReclassifying] = useState(false);

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const canManage = currentUser?.role === 'support_engineer' || currentUser?.role === 'admin';

  useEffect(() => {
    fetchTicketData();
    if (canManage) {
      fetchEngineers();
    }
  }, [ticketId]);

  const fetchTicketData = async () => {
    try {
      setLoading(true);
      const data = await api.getTicketById(ticketId);
      setTicket(data);
      setStatus(data.status);
      setResolutionNotes(data.resolutionNotes || '');
      setAssignedTo(data.assignedTo?._id || '');
    } catch (err) {
      console.error('Error fetching ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEngineers = async () => {
    try {
      const data = await api.getEngineers();
      setEngineers(data);
    } catch (err) {
      console.error('Error fetching engineers:', err);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      setUpdatingStatus(true);
      const updated = await api.updateTicketStatus(ticket._id, {
        status,
        resolutionNotes
      });
      setTicket(updated);
      onTicketUpdated(updated);
    } catch (err) {
      alert('Error updating status: ' + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssign = async (engineerId) => {
    try {
      setAssigning(true);
      const updated = await api.assignTicket(ticket._id, engineerId || null);
      setTicket(updated);
      setAssignedTo(engineerId);
      onTicketUpdated(updated);
    } catch (err) {
      alert('Error assigning ticket: ' + err.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleReclassify = async () => {
    try {
      setReclassifying(true);
      const res = await api.reclassifyTicket(ticket._id);
      fetchTicketData();
      if (onTicketUpdated) onTicketUpdated(ticket);
    } catch (err) {
      alert('Error re-classifying ticket: ' + err.message);
    } finally {
      setReclassifying(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const comments = await api.addComment(ticket._id, commentText, isInternal);
      setTicket({ ...ticket, comments });
      setCommentText('');
      setIsInternal(false);
    } catch (err) {
      alert('Error posting comment: ' + err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (!ticketId) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '850px' }}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-purple)' }}>
                {ticket?.ticketNumber || 'Ticket Details'}
              </span>
              {ticket && (
                <span className={`priority-pill ${ticket.priority.toLowerCase()}`}>
                  {ticket.priority} Priority
                </span>
              )}
              {ticket && (
                <span className={`status-pill ${ticket.status.toLowerCase().replace(' ', '-')}`}>
                  {ticket.status}
                </span>
              )}
            </div>
            <h3 className="modal-title">{ticket?.title}</h3>
          </div>
          <button className="btn btn-outline btn-sm" onClick={onClose} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading ticket details...
          </div>
        ) : ticket ? (
          <div className="modal-body">
            {/* AI ROOT CAUSE CARD */}
            <div style={{ 
              background: 'linear-gradient(135deg, #F5F3FF 0%, #E0F2FE 100%)', 
              border: '1px solid #DDD6FE', 
              borderRadius: '16px', 
              padding: '20px', 
              marginBottom: '24px' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--primary-purple)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={22} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                      Automated Root Cause Category Mapping
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      Machine Learning Engine: {ticket.aiPrediction?.modelArchitecture || 'TF-IDF + Text Classifier'}
                    </span>
                  </div>
                </div>

                {canManage && (
                  <button 
                    className="btn btn-outline btn-sm" 
                    onClick={handleReclassify}
                    disabled={reclassifying}
                    style={{ background: '#FFFFFF', fontSize: '0.78rem' }}
                  >
                    <RefreshCw size={13} className={reclassifying ? 'spin' : ''} />
                    {reclassifying ? 'Re-analyzing...' : 'Re-classify with AI'}
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '14px' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', color: '#64748B', display: 'block', fontWeight: 600 }}>PREDICTED ROOT CAUSE</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-purple)' }}>
                    {ticket.category}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.74rem', color: '#64748B', display: 'block', fontWeight: 600 }}>CONFIDENCE METRIC</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <span className={`ai-confidence-pill ${ticket.aiPrediction?.confidenceLevel || 'low'}`}>
                      {((ticket.aiPrediction?.confidence || 0) * 100).toFixed(1)}% Confidence
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      ({ticket.aiPrediction?.confidenceLevel?.toUpperCase()} level)
                    </span>
                  </div>
                </div>
              </div>

              {/* Class Probability Distribution Meter */}
              {ticket.aiPrediction?.probabilities && (
                <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '10px' }}>
                    CATEGORY PROBABILITY DISTRIBUTION BREAKDOWN:
                  </div>
                  {Object.entries(ticket.aiPrediction.probabilities).map(([cat, prob]) => {
                    const pct = Math.round(prob * 100);
                    const isSelected = cat === ticket.category;
                    return (
                      <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ width: '180px', fontSize: '0.75rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--primary-purple)' : '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {cat}
                        </span>
                        <div style={{ flex: 1, height: '14px', background: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div style={{ 
                            height: '100%', 
                            width: `${pct}%`, 
                            background: isSelected ? 'linear-gradient(90deg, #7C5CFC, #38BDF8)' : '#CBD5E1', 
                            borderRadius: '9999px',
                            transition: 'width 0.4s ease'
                          }} />
                        </div>
                        <span style={{ width: '38px', textAlign: 'right', fontSize: '0.74rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--primary-purple)' : '#64748B' }}>
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* DESCRIPTION & DETAILS */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Ticket Description
                </h4>
                <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '0.92rem', whiteHeight: '1.6', color: '#1E293B', whiteSpace: 'pre-wrap' }}>
                  {ticket.description}
                </div>

                {ticket.resolutionNotes && (
                  <div style={{ marginTop: '16px', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '14px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#065F46', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <CheckCircle2 size={16} /> Resolution Notes:
                    </div>
                    <div style={{ fontSize: '0.88rem', color: '#047857' }}>{ticket.resolutionNotes}</div>
                  </div>
                )}
              </div>

              {/* TICKET METADATA CARD */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Ticket Metadata
                </h4>

                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block' }}>Submitted By</span>
                  <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>{ticket.customer?.name}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>{ticket.customer?.email} ({ticket.customer?.department || 'General'})</span>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block' }}>Assigned Engineer</span>
                  {canManage ? (
                    <select
                      className="form-control"
                      style={{ fontSize: '0.82rem', padding: '6px 8px', marginTop: '4px' }}
                      value={assignedTo}
                      onChange={(e) => handleAssign(e.target.value)}
                      disabled={assigning}
                    >
                      <option value="">-- Unassigned --</option>
                      {engineers.map((eng) => (
                        <option key={eng._id} value={eng._id}>
                          {eng.name} ({eng.department})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <strong style={{ fontSize: '0.88rem', color: ticket.assignedTo ? '#0F172A' : '#94A3B8' }}>
                      {ticket.assignedTo ? ticket.assignedTo.name : 'Awaiting assignment'}
                    </strong>
                  )}
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block' }}>Created Date</span>
                  <span style={{ fontSize: '0.82rem', color: '#0F172A' }}>{new Date(ticket.createdAt).toLocaleString()}</span>
                </div>

                {ticket.resolvedAt && (
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block' }}>Resolved Date</span>
                    <span style={{ fontSize: '0.82rem', color: '#10B981', fontWeight: 600 }}>{new Date(ticket.resolvedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* WORKFLOW CONTROLS (SUPPORT ENGINEER / ADMIN ONLY) */}
            {canManage && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px', marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-purple)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                  <Shield size={16} /> Engineer Workflow Controls
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '12px', alignItems: 'flex-start' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Update Status</label>
                    <select
                      className="form-control"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Resolution Notes / Action Taken</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Cleared stuck Exchange queue and restarted SMTP relay..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                    />
                  </div>

                  <div style={{ marginTop: '22px' }}>
                    <button
                      className="btn btn-primary"
                      onClick={handleUpdateStatus}
                      disabled={updatingStatus}
                    >
                      {updatingStatus ? 'Saving...' : 'Apply Update'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* COMMENTS & DISCUSSION THREAD */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '12px' }}>
                Conversation & Notes ({ticket.comments?.length || 0})
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {ticket.comments?.length > 0 ? (
                  ticket.comments.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        background: c.isInternal ? '#FFFBEB' : '#FFFFFF',
                        border: c.isInternal ? '1px solid #FDE68A' : '1px solid #E2E8F0'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '0.85rem', color: '#0F172A' }}>{c.authorName}</strong>
                          <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '9999px', background: '#F1F5F9', color: '#64748B' }}>
                            {c.authorRole}
                          </span>
                          {c.isInternal && (
                            <span style={{ fontSize: '0.72rem', color: '#B45309', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Lock size={11} /> Internal Note
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.88rem', color: '#334155', whiteSpace: 'pre-wrap' }}>
                        {c.text}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '10px', color: '#94A3B8', fontSize: '0.85rem', textAlign: 'center' }}>
                    No messages yet on this ticket.
                  </div>
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type a message or response..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" disabled={submittingComment || !commentText.trim()}>
                    <Send size={15} /> Post
                  </button>
                </div>
                {canManage && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="checkbox"
                      id="internalCheck"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                    />
                    <label htmlFor="internalCheck" style={{ fontSize: '0.76rem', color: '#64748B', cursor: 'pointer' }}>
                      Mark as internal note (hidden from customer)
                    </label>
                  </div>
                )}
              </form>
            </div>

            {/* AUDIT HISTORY TIMELINE */}
            {ticket.history?.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Activity Audit Trail
                </h4>
                <div style={{ borderLeft: '2px solid #E2E8F0', paddingLeft: '16px', marginLeft: '6px' }}>
                  {ticket.history.map((h, idx) => (
                    <div key={idx} style={{ marginBottom: '10px', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-22px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary-purple)' }} />
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
                        {h.action} &bull; <span style={{ fontWeight: 400, color: '#64748B' }}>by {h.performerName}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{h.details}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{new Date(h.timestamp).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
