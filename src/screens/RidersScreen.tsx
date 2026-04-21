import { useEffect, useState } from 'react';
import { collection, query, where, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { CheckCircle, XCircle, Eye, MapPin, Car, CreditCard, Ban } from 'lucide-react';

export default function RidersScreen() {
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedRider, setSelectedRider] = useState<any>(null);

  useEffect(() => {
    // Live subscribe to all riders
    const q = query(collection(db, 'users'), where('role', '==', 'rider'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRiders(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'users', id), { status: newStatus });
    } catch (e) {
      alert("Failed to update status");
    }
  };

  const filteredRiders = riders.filter(r => {
    const status = r.status || 'pending';
    return status === activeTab;
  });

  const pendingCount = riders.filter(r => (r.status || 'pending') === 'pending').length;
  const approvedCount = riders.filter(r => r.status === 'approved').length;
  const rejectedCount = riders.filter(r => r.status === 'rejected').length;

  return (
    <div>
      <h2 className="screen-title">Rider & Driver Management</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Review rider applications, verify documents (license, vehicle), and monitor performance. Connected live to Firebase.
      </p>

      {/* Stats Row */}
      <div className="dashboard-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fef9c315', color: '#854d0e' }}><Eye size={24} /></div>
          <div className="stat-info"><h3>Pending Review</h3><p>{pendingCount}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#dcfce715', color: '#166534' }}><CheckCircle size={24} /></div>
          <div className="stat-info"><h3>Active Riders</h3><p>{approvedCount}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fee2e215', color: '#991b1b' }}><Ban size={24} /></div>
          <div className="stat-info"><h3>Suspended</h3><p>{rejectedCount}</p></div>
        </div>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
          Pending Verifications ({pendingCount})
        </div>
        <div className={`tab ${activeTab === 'approved' ? 'active' : ''}`} onClick={() => setActiveTab('approved')}>
          Active Riders ({approvedCount})
        </div>
        <div className={`tab ${activeTab === 'rejected' ? 'active' : ''}`} onClick={() => setActiveTab('rejected')}>
          Suspended ({rejectedCount})
        </div>
      </div>

      {/* Rider Detail Modal */}
      {selectedRider && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setSelectedRider(null)}>
          <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', padding: '2rem', maxWidth: '500px', width: '90%', boxShadow: 'var(--shadow-lg)' }}
            onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>📋 Rider Application Details</h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div><strong>Name:</strong> {selectedRider.name || 'N/A'}</div>
              <div><strong>Email:</strong> {selectedRider.email || 'N/A'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={16} /> <strong>Location:</strong> {selectedRider.location?.city || 'N/A'}, {selectedRider.location?.province || 'N/A'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={14} /> <strong>Barangay:</strong> {selectedRider.location?.barangay || 'Not specified'}
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />
              <h4>🚗 Vehicle & Documents</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Car size={16} /> <strong>Vehicle:</strong> {selectedRider.requirements?.vehicleModel || 'Not submitted'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={16} /> <strong>Plate #:</strong> {selectedRider.requirements?.vehiclePlateNumber || 'Not submitted'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={16} /> <strong>License #:</strong> {selectedRider.requirements?.licenseNumber || 'Not submitted'}
              </div>
              
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />
              <h4 style={{ color: 'var(--primary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>📷 Uploaded Verification Photos</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ gap: '0.25rem', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>License Photo</span>
                  {selectedRider.requirements?.licenseImage ? (
                    <a href={selectedRider.requirements.licenseImage} target="_blank" rel="noreferrer">
                      <img src={selectedRider.requirements.licenseImage} alt="License" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} />
                    </a>
                  ) : (
                    <div style={{ width: '100%', height: '80px', backgroundColor: '#f1f5f9', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#94a3b8', border: '1px dashed #cbd5e1' }}>No photo</div>
                  )}
                </div>
                <div style={{ gap: '0.25rem', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Vehicle Plate Photo</span>
                  {selectedRider.requirements?.plateImage ? (
                    <a href={selectedRider.requirements.plateImage} target="_blank" rel="noreferrer">
                      <img src={selectedRider.requirements.plateImage} alt="Plate" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} />
                    </a>
                  ) : (
                    <div style={{ width: '100%', height: '80px', backgroundColor: '#f1f5f9', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#94a3b8', border: '1px dashed #cbd5e1' }}>No photo</div>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { handleUpdateStatus(selectedRider.id, 'approved'); setSelectedRider(null); }}>
                <CheckCircle size={16} /> Approve
              </button>
              <button className="btn" style={{ flex: 1, backgroundColor: 'var(--danger)', color: 'white' }} onClick={() => { handleUpdateStatus(selectedRider.id, 'rejected'); setSelectedRider(null); }}>
                <XCircle size={16} /> Reject
              </button>
              <button className="btn btn-outline" onClick={() => setSelectedRider(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        <div className="table-header">
          <h2>{activeTab === 'pending' ? '⏳ Awaiting Your Action' : activeTab === 'approved' ? '✅ Active Fleet' : '🚫 Suspended Riders'}</h2>
          <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>● LIVE</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Rider Name</th>
              <th>Email</th>
              <th>Location</th>
              <th>Vehicle</th>
              <th>License Plate</th>
              <th>Documents</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Loading riders from Firebase...</td></tr>
            ) : filteredRiders.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                {activeTab === 'pending' ? 'No pending applications. Riders who sign up on the mobile app will appear here.' : 'No riders in this category.'}
              </td></tr>
            ) : (
              filteredRiders.map((rider) => (
                <tr key={rider.id}>
                  <td style={{ fontWeight: 600 }}>{rider.name || 'Unknown'}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{rider.email}</td>
                  <td>{rider.location?.city || 'N/A'}</td>
                  <td>{rider.requirements?.vehicleModel || <span style={{ color: 'var(--text-muted)' }}>Not submitted</span>}</td>
                  <td style={{ fontFamily: 'monospace' }}>{rider.requirements?.vehiclePlateNumber || '—'}</td>
                  <td>
                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      onClick={() => setSelectedRider(rider)}>
                      <Eye size={12} /> View Details
                    </button>
                  </td>
                  <td>
                    {activeTab === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn" style={{ backgroundColor: 'var(--success)', color: 'white', padding: '0.4rem' }}
                          onClick={() => handleUpdateStatus(rider.id, 'approved')} title="Approve">
                          <CheckCircle size={16} />
                        </button>
                        <button className="btn" style={{ backgroundColor: 'var(--danger)', color: 'white', padding: '0.4rem' }}
                          onClick={() => handleUpdateStatus(rider.id, 'rejected')} title="Reject">
                          <XCircle size={16} />
                        </button>
                      </div>
                    )}
                    {activeTab === 'approved' && (
                      <button className="btn" style={{ backgroundColor: 'var(--danger)', color: 'white', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                        onClick={() => handleUpdateStatus(rider.id, 'rejected')}>
                        <Ban size={14} /> Suspend
                      </button>
                    )}
                    {activeTab === 'rejected' && (
                      <button className="btn" style={{ backgroundColor: 'var(--success)', color: 'white', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                        onClick={() => handleUpdateStatus(rider.id, 'approved')}>
                        <CheckCircle size={14} /> Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
