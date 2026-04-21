import { useEffect, useState } from 'react';
import { collection, query, where, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Users, Search, Ban, CheckCircle, Mail, MapPin, Calendar } from 'lucide-react';

export default function UsersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'banned' | 'active'>('all');

  useEffect(() => {
    // Subscribe to all users with role 'user'
    const q = query(collection(db, 'users'), where('role', '==', 'user'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleToggleBan = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'banned' ? 'approved' : 'banned';
    const action = currentStatus === 'banned' ? 'REACTIVATE' : 'BAN';
    
    if (window.confirm(`Are you sure you want to ${action} this customer?`)) {
      try {
        await updateDoc(doc(db, 'users', id), { status: nextStatus });
      } catch (e) {
        alert("Failed to update user status");
      }
    }
  };

  const filtered = users.filter(u => {
    const matchesSearch = (u.name || '').toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'banned' ? u.status === 'banned' : u.status !== 'banned');
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      <h2 className="screen-title">Customer Registry</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Monitor user activity and manage community access. Use bans to restrict violators.
      </p>

      {/* Quick Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#dbeafe15', color: '#1d4ed8' }}><Users size={24} /></div>
          <div className="stat-info"><h3>Total Customers</h3><p>{users.length}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#dcfce715', color: '#166534' }}><CheckCircle size={24} /></div>
          <div className="stat-info"><h3>Active Accounts</h3><p>{users.filter(u => u.status !== 'banned').length}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fee2e215', color: '#991b1b' }}><Ban size={24} /></div>
          <div className="stat-info"><h3>Restricted</h3><p>{users.filter(u => u.status === 'banned').length}</p></div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
           <button className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('all')}>All</button>
           <button className={`btn ${filter === 'active' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('active')}>Active</button>
           <button className={`btn ${filter === 'banned' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('banned')}>Banned</button>
        </div>
        
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem', boxSizing: 'border-box' }} />
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Contact Info</th>
              <th>Preferred City</th>
              <th>Status</th>
              <th>Member Since</th>
              <th>Control</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Fetching customer data...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No customers found matching your criteria.</td></tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name || 'Anonymous'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <Mail size={14} color="var(--text-muted)" /> {u.email}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <MapPin size={14} color="var(--text-muted)" /> {u.location?.city || 'Butuan'}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${u.status === 'banned' ? 'badge-danger' : 'badge-success'}`}>
                      {u.status === 'banned' ? 'RESTRICTED' : 'ACTIVE'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <Calendar size={14} /> {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td>
                    <button className={`btn ${u.status === 'banned' ? 'btn-primary' : 'btn-outline'}`} 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderColor: u.status === 'banned' ? '' : 'var(--danger)', color: u.status === 'banned' ? '' : 'var(--danger)' }}
                      onClick={() => handleToggleBan(u.id, u.status)}>
                      {u.status === 'banned' ? 'Reactivate' : 'BAN USER'}
                    </button>
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
