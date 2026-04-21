import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  Star, 
  Search, 
  Filter, 
  Trash2, 
  MessageSquare,
  User,
  ShieldCheck,
  Calendar,
  MoreVertical
} from 'lucide-react';

export default function RatingsScreen() {
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [starFilter, setStarFilter] = useState<number | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'ratings'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRatings(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const stats = {
    avg: ratings.length ? (ratings.reduce((a, b) => a + b.rating, 0) / ratings.length).toFixed(1) : '0.0',
    total: ratings.length,
    fiveStars: ratings.filter(r => r.rating === 5).length,
    positivePct: ratings.length ? Math.round((ratings.filter(r => r.rating >= 4).length / ratings.length) * 100) : 0
  };

  const filteredRatings = ratings.filter(r => {
    const matchesSearch = r.comment?.toLowerCase().includes(searchTerm.toLowerCase()) || r.orderId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStar = starFilter ? r.rating === starFilter : true;
    return matchesSearch && matchesStar;
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this intelligence report?')) {
      await deleteDoc(doc(db, 'ratings', id));
    }
  };

  return (
    <div style={{ padding: '1rem 0' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
           <h2 className="screen-title">Intelligence & Fleet Ratings</h2>
           <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Comprehensive performance analysis of regional mission agents.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-main)', padding: '0.4rem', borderRadius: '12px' }}>
           <button 
             onClick={() => setStarFilter(null)}
             className={`btn ${!starFilter ? 'btn-primary' : 'btn-outline'}`}
             style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', border: !starFilter ? 'none' : '1px solid var(--border-color)' }}
           >
             ALL
           </button>
           {[5, 4, 3, 2, 1].map(s => (
             <button 
               key={s}
               onClick={() => setStarFilter(s)}
               className={`btn ${starFilter === s ? 'btn-primary' : 'btn-outline'}`}
               style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', gap: '4px', border: starFilter === s ? 'none' : '1px solid var(--border-color)' }}
             >
               {s} ★
             </button>
           ))}
        </div>
      </div>

      {/* Analytics Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
         <div style={statCard}>
            <div style={statHeader}>
               <Star size={20} color="var(--warning)" fill="var(--warning)" />
               <span style={statLabel}>AVG RATING</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
               <h3 style={statValue}>{stats.avg}</h3>
               <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ 5.0</span>
            </div>
         </div>

         <div style={statCard}>
            <div style={statHeader}>
               <MessageSquare size={20} color="var(--primary)" />
               <span style={statLabel}>TOTAL LOGS</span>
            </div>
            <h3 style={statValue}>{stats.total}</h3>
         </div>

         <div style={statCard}>
            <div style={statHeader}>
               <ShieldCheck size={20} color="var(--success)" />
               <span style={statLabel}>5-STAR MISSIONS</span>
            </div>
            <h3 style={statValue}>{stats.fiveStars}</h3>
         </div>

         <div style={statCard}>
            <div style={statHeader}>
               <Filter size={20} color="var(--primary-dark)" />
               <span style={statLabel}>APPROVAL INDEX</span>
            </div>
            <h3 style={statValue}>{stats.positivePct}%</h3>
         </div>
      </div>

      {/* Main Feedback Log */}
      <div className="table-container">
         <div className="table-header">
            <h2 style={{ fontSize: '1.1rem' }}>Fleet Performance Record</h2>
            <div style={{ position: 'relative' }}>
               <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
               <input 
                 placeholder="Search Order ID..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 style={{ 
                   padding: '0.6rem 0.6rem 0.6rem 2.2rem', 
                   borderRadius: '8px', 
                   border: '1px solid var(--border-color)', 
                   fontSize: '0.85rem',
                   width: '240px'
                 }} 
               />
            </div>
         </div>

         <table>
            <thead>
               <tr>
                  <th>MISSION AGENT</th>
                  <th>INTEL / FEEDBACK</th>
                  <th style={{ textAlign: 'center' }}>RATING</th>
                  <th>DATE / ORDER</th>
                  <th style={{ textAlign: 'right' }}>ACTION</th>
               </tr>
            </thead>
            <tbody>
               {loading ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>Decrypting feedback logs...</td></tr>
               ) : filteredRatings.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No intelligence records found.</td></tr>
               ) : (
                  filteredRatings.map((item) => (
                    <tr key={item.id}>
                       <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                             <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'var(--secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900 }}>
                                {item.targetId?.charAt(0).toUpperCase()}
                             </div>
                             <div>
                                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800 }}>{item.targetId?.substring(0,8).toUpperCase()}</p>
                                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{item.type?.toUpperCase()} AGENT</p>
                             </div>
                          </div>
                       </td>
                       <td style={{ maxWidth: '300px' }}>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: '1.4' }}>
                             "{item.comment || "Negative space. Zero text intel provided."}"
                          </p>
                       </td>
                       <td>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                             {[1,2,3,4,5].map(s => (
                               <Star key={s} size={14} color={s <= item.rating ? 'var(--warning)' : 'var(--border-color)'} fill={s <= item.rating ? 'var(--warning)' : 'transparent'} />
                             ))}
                          </div>
                       </td>
                       <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                             <Calendar size={12} color="var(--primary)" />
                             <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                                {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'REAL-TIME'}
                             </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>ID: {item.orderId?.substring(0,8).toUpperCase()}</p>
                       </td>
                       <td style={{ textAlign: 'right' }}>
                          <button 
                            onClick={(e) => handleDelete(item.id, e)}
                            style={{ 
                              padding: '0.5rem', 
                              backgroundColor: 'transparent', 
                              border: 'none', 
                              color: 'var(--text-muted)',
                              cursor: 'pointer'
                            }}
                            onMouseOver={e => (e.currentTarget as any).style.color = 'var(--danger)'}
                            onMouseOut={e => (e.currentTarget as any).style.color = 'var(--text-muted)'}
                          >
                             <Trash2 size={18} />
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

const statCard = {
  backgroundColor: 'white',
  padding: '1.5rem',
  borderRadius: '24px',
  border: '1px solid var(--border-light)',
  boxShadow: 'var(--shadow-sm)',
};

const statHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
};

const statLabel = {
  fontSize: '0.65rem',
  fontWeight: 900,
  letterSpacing: '1px',
  color: 'var(--text-muted)',
};

const statValue = {
  margin: 0,
  fontSize: '1.75rem',
  fontWeight: 900,
  color: 'var(--text-main)',
};


