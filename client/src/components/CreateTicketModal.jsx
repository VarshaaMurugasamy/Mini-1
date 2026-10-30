import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  AlertCircle, 
  Cpu, 
  CheckCircle2, 
  HelpCircle,
  Lightbulb
} from 'lucide-react';

export default function CreateTicketModal({ isOpen, onClose, onSubmitSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Real-time AI preview state
  const [aiPreview, setAiPreview] = useState(null);
  const [predicting, setPredicting] = useState(false);

  if (!isOpen) return null;

  const quickSamples = [
    {
      title: "VPN disconnecting constantly while on home WiFi",
      desc: "Cisco AnyConnect gives error: Connection attempt failed. I cannot ping our internal Git servers.",
      priority: "High"
    },
    {
      title: "ThinkPad laptop screen flickering black during meetings",
      desc: "The laptop display goes black for 3 seconds whenever slightly adjusted. External monitor is fine.",
      priority: "Medium"
    },
    {
      title: "Account locked out following Okta MFA update",
      desc: "My 6-digit Google Authenticator code is rejected as invalid and I cannot login to workday.",
      priority: "Urgent"
    },
    {
      title: "PostgreSQL query deadlocks and connection pool exhausted",
      desc: "Production database query takes over 45 seconds to fetch order history and reports lock timeout.",
      priority: "Urgent"
    }
  ];

  const handleApplySample = (sample) => {
    setTitle(sample.title);
    setDescription(sample.desc);
    setPriority(sample.priority);
    handleLiveAiPrediction(sample.title, sample.desc);
  };

  const handleLiveAiPrediction = async (sampleTitle = title, sampleDesc = description) => {
    const text = `${sampleTitle} ${sampleDesc}`.trim();
    if (text.length < 5) return;

    try {
      setPredicting(true);
      const res = await fetch('/ml/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: sampleTitle, text: sampleDesc })
      });
      const data = await res.json();
      setAiPreview(data);
    } catch (err) {
      console.warn("Could not fetch real-time preview:", err);
    } finally {
      setPredicting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please provide both ticket title and issue description.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('helpdesk_token')}`
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          priority
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit ticket');

      onSubmitSuccess(data.ticket);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '680px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary-purple-light)', color: 'var(--primary-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="modal-title">Create New Helpdesk Ticket</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Automated machine-learning root cause categorization will be performed</p>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={onClose} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ padding: '12px 16px', background: '#FEE2E2', color: '#DC2626', borderRadius: '10px', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {/* Quick 1-click test examples */}
            <div style={{ marginBottom: '18px', background: '#F8FAFC', padding: '12px 14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lightbulb size={13} color="#F59E0B" /> QUICK-FILL TEST TEMPLATES:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {quickSamples.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.74rem', padding: '4px 10px', background: '#FFFFFF' }}
                    onClick={() => handleApplySample(s)}
                  >
                    {s.title.split(' ')[0]} {s.title.split(' ')[1]}...
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="form-group">
              <label className="form-label">Subject / Issue Summary *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Cannot connect to internal corporate VPN"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (e.target.value.length > 5) handleLiveAiPrediction(e.target.value, description);
                }}
                required
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Detailed Description of Problem *</label>
              <textarea
                className="form-control"
                placeholder="Describe what happened, any error messages, and what you were doing when it occurred..."
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (e.target.value.length > 10) handleLiveAiPrediction(title, e.target.value);
                }}
                required
              />
            </div>

            {/* Priority selection */}
            <div className="form-group">
              <label className="form-label">Urgency & Priority</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {['Low', 'Medium', 'High', 'Urgent'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`btn btn-sm ${priority === p ? 'btn-primary' : 'btn-outline'}`}
                    style={{
                      borderColor: priority === p ? 'var(--primary-purple)' : '#E2E8F0',
                      background: priority === p ? 'var(--primary-purple)' : '#FFFFFF'
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Live AI Prediction Preview Box */}
            <div style={{ marginTop: '16px', background: 'linear-gradient(135deg, #F5F3FF 0%, #E0F2FE 100%)', border: '1px solid #DDD6FE', borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-purple)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Cpu size={15} /> AI PREDICTION ENGINE PREVIEW
                </span>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.72rem', padding: '3px 8px', background: '#FFFFFF' }}
                  onClick={() => handleLiveAiPrediction()}
                  disabled={predicting}
                >
                  {predicting ? 'Analyzing...' : 'Run Preview'}
                </button>
              </div>

              {aiPreview ? (
                <div style={{ background: '#FFFFFF', borderRadius: '10px', padding: '10px 14px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Predicted Root Cause:</span>
                      <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>{aiPreview.predicted_category}</strong>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>Confidence:</span>
                      <span className={`ai-confidence-pill ${aiPreview.confidence_level}`}>
                        {(aiPreview.confidence * 100).toFixed(1)}% ({aiPreview.confidence_level})
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontStyle: 'italic' }}>
                  Type a description or click a test template to preview AI classification.
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Send size={15} />
              {loading ? 'Classifying & Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
