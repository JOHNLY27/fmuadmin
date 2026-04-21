import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Map, Users, Bike, ShoppingBag } from 'lucide-react';

export default function DashboardScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [riderCount, setRiderCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);

  useEffect(() => {
    // Live orders
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Live transactions (FetchPay)
    const qTx = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(15));
    const unsubTx = onSnapshot(qTx, (snap) => {
      setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Count riders & users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const allUsers = snap.docs.map(doc => doc.data());
      setRiderCount(allUsers.filter(u => u.role === 'rider').length);
      setCustomerCount(allUsers.filter(u => u.role === 'user').length);
    });

    return () => {
      unsubOrders();
      unsubTx();
      unsubUsers();
    };
  }, []);

  const activeOrders = orders.filter(o => ['pending', 'accepted', 'picked_up'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'completed');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysRevenue = completedOrders.filter(o => {
    if (!o.createdAt) return false;
    try {
      const d = o.createdAt?.toDate ? o.createdAt.toDate() : 
                (o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : (o.createdAt ? new Date(o.createdAt) : new Date()));
      return d instanceof Date && !isNaN(d.getTime()) && d >= today;
    } catch (e) {
      return false;
    }
  }).reduce((sum, o) => sum + (Number(o.totalPrice || o.price) || 0), 0);

  const stats = [
    { title: 'Live Orders', value: activeOrders.length, icon: <Map size={24} />, color: '#943A24' },
    { title: 'Active Riders', value: riderCount, icon: <Bike size={24} />, color: '#2ecc71' },
    { title: 'Customers', value: customerCount, icon: <Users size={24} />, color: '#3498db' },
    { title: 'Today\'s Revenue', value: `₱${todaysRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: <ShoppingBag size={24} />, color: '#f39c12' },
  ];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'cancelled': return 'badge-danger';
      default: return 'badge-primary';
    }
  };

  const getTypeEmoji = (type: string) => {
    switch(type) {
      case 'food': return '🍽️';
      case 'ride': return '🚗';
      case 'parcel': return '📦';
      case 'pabili': return '🛍️';
      default: return '📋';
    }
  };

  return (
    <div>
      <h2 className="screen-title">Operations Command Center</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Real-time monitoring of all FetchMeUp services in Butuan City
      </p>
      
      <div className="dashboard-grid">
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: `${s.color}15`, color: s.color }}>
              {s.icon}
            </div>
            <div className="stat-info">
              <h3>{s.title}</h3>
              <p>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        {/* Orders Table */}
        <div className="table-container" style={{ margin: 0 }}>
          <div className="table-header">
            <h2>Active Missions (Live)</h2>
            <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>ORDERS</span>
          </div>
          <table style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th>Service</th>
                <th>Status</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>No orders.</td></tr>
              ) : (
                orders.slice(0, 10).map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 600 }}>{getTypeEmoji(o.type || '')} {(o.type || 'unknown').toUpperCase()}</td>
                    <td><span className={`badge ${getStatusBadge(o.status || '')}`}>{o.status}</span></td>
                    <td style={{ fontWeight: 800 }}>₱{(Number(o.totalPrice || o.price) || 0).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Financial Stream */}
        <div className="table-container" style={{ margin: 0, borderTop: '4px solid var(--primary)' }}>
          <div className="table-header">
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }}></div>
                <h2>Financial Stream</h2>
             </div>
             <div className="badge badge-warning" style={{ fontSize: '0.6rem' }}>FETCHPAY</div>
          </div>
          <table style={{ fontSize: '0.8rem' }}>
             <thead>
                <tr>
                   <th>Type</th>
                   <th>Status</th>
                   <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
             </thead>
             <tbody>
                {transactions.length === 0 ? (
                   <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>Loading streams...</td></tr>
                ) : (
                   transactions.map((tx) => (
                      <tr key={tx.id}>
                         <td>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.75rem' }}>{tx.type === 'credit' ? '↑' : '↓'} {(tx.description || 'Global TX').toUpperCase()}</p>
                            <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-dim)' }}>{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                         </td>
                         <td>
                            <span style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#e2fdf1', color: '#10b981', fontWeight: 800 }}>SUCCESS</span>
                         </td>
                         <td style={{ textAlign: 'right', fontWeight: 900, color: tx.type === 'credit' ? '#10b981' : 'var(--text-main)' }}>
                           {tx.type === 'credit' ? '+' : '-'}₱{tx.amount?.toFixed(2)}
                         </td>
                      </tr>
                   ))
                )}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
