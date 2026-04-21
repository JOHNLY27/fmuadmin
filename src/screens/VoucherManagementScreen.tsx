import { useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Ticket, Plus, Trash2, Calendar, DollarSign, Tag, Zap, Terminal, ShieldCheck } from 'lucide-react';

export default function VoucherManagementScreen() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newVoucher, setNewVoucher] = useState({
    code: '',
    title: '',
    desc: '',
    value: '',
    type: 'fixed' as 'fixed' | 'percent',
    expiry: '',
    minSpend: '0'
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'vouchers'), (snap) => {
      setVouchers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'vouchers'), {
        ...newVoucher,
        code: newVoucher.code.toUpperCase(),
        value: Number(newVoucher.value),
        minSpend: Number(newVoucher.minSpend),
        createdAt: serverTimestamp(),
        isActive: true
      });
      setIsFormOpen(false);
      setNewVoucher({ code: '', title: '', desc: '', value: '', type: 'fixed', expiry: '', minSpend: '0' });
    } catch (err) { console.error(err); }
  };

  const toggleStatus = async (id: string, current: boolean) => {
    await updateDoc(doc(db, 'vouchers', id), { isActive: !current });
  };

  const deleteVoucher = async (id: string) => {
    if (confirm('Decommission this voucher protocol?')) {
      await deleteDoc(doc(db, 'vouchers', id));
    }
  };

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: 'calc(100vh - 100px)', padding: '2rem', borderRadius: '1.5rem', color: '#f8fafc' }}>
      {/* HUD Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
             <Ticket size={24} style={{ color: '#3b82f6' }} />
             <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>VOUCHER COMMAND</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.8rem', fontWeight: 800 }}>
            <span style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%', boxShadow: '0 0 10px #3b82f6' }}></span>
            MANAGING DISCOUNT PROTOCOLS
          </div>
        </div>
        <button 
           onClick={() => setIsFormOpen(!isFormOpen)}
           style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)' }}
        >
          <Plus size={18} />
          GENERATE VOUCHER
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isFormOpen ? '1fr 350px' : '1fr', gap: '2rem' }}>
        {/* Voucher Table */}
        <div style={{ background: '#1e293b', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
           <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                 <tr style={{ textAlign: 'left', background: 'rgba(15, 23, 42, 0.4)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {['CODE', 'PROMO DETAILS', 'REWARD', 'MIN SPEND', 'STATUS', 'ACTIONS'].map(h => <th key={h} style={{ padding: '1.25rem', fontSize: '0.7rem', fontWeight: 900, color: '#64748b', letterSpacing: '0.1em' }}>{h}</th>)}
                 </tr>
              </thead>
              <tbody>
                 {vouchers.map(v => (
                    <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s ease' }}>
                       <td style={{ padding: '1.25rem' }}>
                          <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '4px 10px', borderRadius: '6px', fontWeight: 900, fontSize: '0.85rem', width: 'fit-content' }}>{v.code}</div>
                       </td>
                       <td style={{ padding: '1.25rem' }}>
                          <div style={{ fontWeight: 700 }}>{v.title}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{v.desc}</div>
                       </td>
                       <td style={{ padding: '1.25rem', fontWeight: 900, color: '#3b82f6' }}>
                          {v.type === 'percent' ? `${v.value}%` : `₱${v.value}`}
                       </td>
                       <td style={{ padding: '1.25rem', color: '#94a3b8' }}>₱{v.minSpend}</td>
                       <td style={{ padding: '1.25rem' }}>
                          <button 
                            onClick={() => toggleStatus(v.id, v.isActive)}
                            style={{ 
                              background: v.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                              color: v.isActive ? '#22c55e' : '#ef4444',
                              border: 'none', padding: '4px 12px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer'
                            }}
                          >
                             {v.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </button>
                       </td>
                       <td style={{ padding: '1.25rem' }}>
                          <button onClick={() => deleteVoucher(v.id)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>

        {/* Create Form Sidebar */}
        {isFormOpen && (
           <div style={{ background: '#1e293b', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', animation: 'slideIn 0.3s ease-out' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <ShieldCheck size={18} style={{ color: '#3b82f6' }} />
                 NEW PROTOCOL
              </h3>
              
              <form onSubmit={handleCreateVoucher} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>VOUCHER CODE</label>
                    <input 
                      required 
                      value={newVoucher.code} 
                      onChange={e => setNewVoucher({...newVoucher, code: e.target.value})}
                      placeholder="E.G. BUTUAN50"
                      style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.75rem', color: '#fff', fontWeight: 700 }} 
                    />
                 </div>
                 
                 <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>REWARD VALUE</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                       <input 
                        required 
                        type="number"
                        value={newVoucher.value} 
                        onChange={e => setNewVoucher({...newVoucher, value: e.target.value})}
                        style={{ flex: 1, background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.75rem', color: '#fff' }} 
                       />
                       <select 
                        value={newVoucher.type} 
                        onChange={e => setNewVoucher({...newVoucher, type: e.target.value as any})}
                        style={{ background: '#3b82f6', border: 'none', borderRadius: '10px', padding: '0 0.5rem', color: '#fff', fontWeight: 700 }}
                       >
                          <option value="fixed">₱</option>
                          <option value="percent">%</option>
                       </select>
                    </div>
                 </div>

                 <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>MINIMUM SPEND</label>
                    <input 
                      value={newVoucher.minSpend} 
                      onChange={e => setNewVoucher({...newVoucher, minSpend: e.target.value})}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.75rem', color: '#fff' }} 
                    />
                 </div>

                 <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>VOUCHER TITLE</label>
                    <input 
                      required 
                      value={newVoucher.title} 
                      onChange={e => setNewVoucher({...newVoucher, title: e.target.value})}
                      placeholder="E.G. Weekend Sale"
                      style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.75rem', color: '#fff' }} 
                    />
                 </div>

                 <button type="submit" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: 800, marginTop: '1rem', cursor: 'pointer' }}>
                    INITIALIZE VOUCHER
                 </button>
              </form>
           </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
           from { transform: translateX(20px); opacity: 0; }
           to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
