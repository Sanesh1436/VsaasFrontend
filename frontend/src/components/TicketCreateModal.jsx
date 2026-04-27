import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Save, AlertTriangle } from 'lucide-react';

const TicketCreateModal = ({ onClose, onCreated }) => {
  const [alertTypes, setAlertTypes] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', alert_type: '', priority: 3,
    site_name: '', branch_code: '', camera: '', contacts_info: '', camera_error_info: '',
    snapshot: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesRes, camsRes] = await Promise.all([
          api.get('tickets/alert-types/'),
          api.get('tickets/cameras/'),
        ]);
        setAlertTypes(typesRes.data);
        setCameras(camsRes.data);
      } catch (err) { console.error('Failed to load form data'); }
    };
    fetchData();
  }, []);

  const handleAlertTypeChange = (alertTypeId) => {
    const at = alertTypes.find(a => a.id === parseInt(alertTypeId));
    setForm({ ...form, alert_type: alertTypeId, priority: at ? at.default_priority : form.priority });
  };

  const handleCameraChange = (cameraId) => {
    const cam = cameras.find(c => c.id === parseInt(cameraId));
    setForm({ ...form, camera: cameraId, camera_error_info: cam ? `Camera: ${cam.name} (${cam.ip_address}), Channel: ${cam.channel_number}` : '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.alert_type) { setError('Title and Alert Type are required'); return; }
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (form[key] !== null && form[key] !== '') {
          formData.append(key, form[key]);
        }
      });
      await api.post('tickets/create/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const priorityText = { 1: '🔴 P1 — CRITICAL', 2: '🟡 P2 — MEDIUM', 3: '🟢 P3 — NORMAL' };
  const priorityStyle = {
    1: { background: 'var(--priority-critical-bg)', color: 'var(--priority-critical)', border: '1px solid var(--priority-critical-border)' },
    2: { background: 'var(--priority-medium-bg)', color: 'var(--priority-medium)', border: '1px solid var(--priority-medium-border)' },
    3: { background: 'var(--priority-normal-bg)', color: 'var(--priority-normal)', border: '1px solid var(--priority-normal-border)' },
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Create New Alert Ticket</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Generate a security incident ticket</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="light-form">
          <div className="modal-body space-y-4">
            {error && (
              <div className="p-3 rounded-xl text-sm font-medium"
                style={{ background: 'var(--priority-critical-bg)', color: 'var(--priority-critical)', border: '1px solid var(--priority-critical-border)' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label>Alert Title</label>
              <input placeholder="e.g., Fire detected at Main Entrance" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label>Alert Type</label>
                <select value={form.alert_type} onChange={e => handleAlertTypeChange(e.target.value)} required>
                  <option value="">Select alert type</option>
                  {alertTypes.map(at => <option key={at.id} value={at.id}>{at.name} (P{at.default_priority})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <div className="p-3 rounded-xl font-bold text-center text-sm" style={priorityStyle[form.priority]}>
                  {priorityText[form.priority]}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea rows={3} placeholder="Detailed description of the incident..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label>Site / Branch Name</label>
                <input placeholder="e.g., Branch Alpha" value={form.site_name} onChange={e => setForm({ ...form, site_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Branch Code</label>
                <input placeholder="e.g., BR-101" value={form.branch_code} onChange={e => setForm({ ...form, branch_code: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label>Camera Source</label>
              <select value={form.camera} onChange={e => handleCameraChange(e.target.value)}>
                <option value="">No camera linked</option>
                {cameras.map(cam => <option key={cam.id} value={cam.id}>{cam.name} — {cam.location} ({cam.ip_address})</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Snapshot Image</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={e => setForm({ ...form, snapshot: e.target.files[0] })}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[var(--primary)] file:text-white hover:file:bg-[var(--primary-hover)] cursor-pointer"
              />
            </div>

            <div className="form-group">
              <label>Emergency Contacts</label>
              <textarea rows={2} placeholder={"Police: 100\nFire Dept: 101\nSecurity HQ: 112"} value={form.contacts_info} onChange={e => setForm({ ...form, contacts_info: e.target.value })} />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl font-bold transition-all"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'transparent' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: 'var(--primary)', color: 'white', boxShadow: '0 4px 16px var(--primary-glow)' }}>
              <Save size={18} />
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketCreateModal;
