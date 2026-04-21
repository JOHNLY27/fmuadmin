import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, where, onSnapshot, writeBatch, doc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  DollarSign, TrendingUp, Bike, ShoppingBag, CreditCard, 
  Wallet, Banknote, CheckCircle2, Loader2, ArrowDownCircle, 
  ArrowUpCircle, AlertCircle, RefreshCw, History
} from 'lucide-react';

export default function FinanceScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  useEffect(() => {
    // Fetch all completed but unsetteld orders + some history
    const qOrders = query(collection(db, 'orders'), where('status', '==', 'completed'), limit(200));
    const unsub1 = onSnapshot(qOrders, (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qRiders = query(collection(db, 'users'), where('role', '==', 'rider'));
    const unsub2 = onSnapshot(qRiders, (snap) => {
      setRiders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qPayouts = query(collection(db, 'payouts'), orderBy('createdAt', 'desc'), limit(50));
    const unsub3 = onSnapshot(qPayouts, (snap) => {
      setPayouts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  const commissionRate = 0.15; // 15%

  // REAL-TIME RECONCILIATION LOGIC
  const riderReconciliation: Record<string, any> = {};
  
  orders.filter(o => o.payoutStatus !== 'settled').forEach(o => {
    if (!o.riderId) return;
    if (!riderReconciliation[o.riderId]) {
      const rider = riders.find(r => r.id === o.riderId);
      riderReconciliation[o.riderId] = {
        riderId: o.riderId,
        name: rider?.name || 'Unknown Agent',
        phone: rider?.phone || 'N/A',
        cashCollected: 0,
        digitalEarned: 0,
        platformCommission: 0,
        orderIds: []
      };
    }

    const rec = riderReconciliation[o.riderId];
    rec.orderIds.push(o.id);

    if (o.paymentMethod === 'cash') {
      rec.cashCollected += (o.price || 0);
      rec.platformCommission += (o.price || 0) * commissionRate;
    } else {
      // Digital payment: Admin has the money, owes rider 85%
      rec.digitalEarned += (o.price || 0) * (1 - commissionRate);
    }
  });

  const handleSettleRecord = async (riderId: string, type: 'payout' | 'collection') => {
    const data = riderReconciliation[riderId];
    const amount = type === 'payout' 
      ? (data.digitalEarned - data.platformCommission) 
      : (data.platformCommission - data.digitalEarned);

    const actionText = type === 'payout' 
      ? `Confirm payout of ₱${amount.toFixed(2)} to ${data.name}?`
      : `Confirm cash remittance of ₱${amount.toFixed(2)} received from ${data.name}?`;

    if (!window.confirm(actionText)) return;

    setProcessing(riderId);
    try {
      const batch = writeBatch(db);
      
      // 1. Resolve all relevant orders
      data.orderIds.forEach((id: string) => {
        batch.update(doc(db, 'orders', id), {
          payoutStatus: 'settled',
          settledAt: serverTimestamp(),
          settledBy: 'Admin'
        });
      });

      // 2. Create Audit Log
      const logRef = doc(collection(db, 'payouts'));
      batch.set(logRef, {
        riderId,
        riderName: data.name,
        amount: Math.abs(amount),
        type: type,
        orderCount: data.orderIds.length,
        createdAt: serverTimestamp(),
        status: 'completed'
      });

      await batch.commit();
      alert('Reconciliation successfully committed to chain.');
    } catch (e) {
      console.error(e);
      alert('Sync failed.');
    } finally {
      setProcessing(null);
    }
  };

  const todayVolume = orders.filter(o => {
    const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date();
    return d.toDateString() === new Date().toDateString();
  }).reduce((sum, o) => sum + (o.price || 0), 0);

  return (
    <div style={{ padding: '1rem', color: '#1e293b' }}>
      {/* Dynamic Finance Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>FINANCIAL COMMAND</h2>
          <p style={{ color: '#64748b', fontWeight: 600, marginTop: '0.25rem' }}>RECONCILING REGIONAL AGENT BALANCES & COD COLLECTIONS</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <div style={{ background: '#fff', padding: '0.75rem 1.25rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.05em' }}>TODAY'S VOLUME</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>₱{todayVolume.toLocaleString()}</div>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', background: '#f1f5f9', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
         <button 
           onClick={() => setActiveTab('pending')}
           style={{ padding: '0.6rem 1.5rem', borderRadius: '10px', border: 'none', background: activeTab === 'pending' ? '#fff' : 'transparent', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: activeTab === 'pending' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none' }}
         >
            <RefreshCw size={16} /> PENDING RECONCILIATION
         </button>
         <button 
           onClick={() => setActiveTab('history')}
           style={{ padding: '0.6rem 1.5rem', borderRadius: '10px', border: 'none', background: activeTab === 'history' ? '#fff' : 'transparent', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: activeTab === 'history' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none' }}
         >
            <History size={16} /> SETTLEMENT ARCHIVE
         </button>
      </div>

      {activeTab === 'pending' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {Object.values(riderReconciliation).length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', background: '#fff', borderRadius: '24px' }}>
               <CheckCircle2 size={48} style={{ color: '#10b981', marginBottom: '1rem', opacity: 0.2 }} />
               <h3 style={{ margin: 0, fontWeight: 900 }}>ALL AGENTS CLEARED</h3>
               <p style={{ color: '#64748b' }}>No pending cash remittances or payouts detected.</p>
            </div>
          ) : Object.values(riderReconciliation).map((rec: any) => {
            const netBalance = rec.digitalEarned - rec.platformCommission;
            const riderOwesOffice = netBalance < 0;
            const settlementAmount = Math.abs(netBalance);

            return (
              <div key={rec.riderId} style={{ background: '#fff', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                       <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Bike size={24} color="#0f172a" />
                       </div>
                       <div>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>{rec.name}</h3>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>#{rec.riderId.substring(0,8).toUpperCase()}</span>
                       </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.05em' }}>CURRENT BALANCE</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: riderOwesOffice ? '#ef4444' : '#10b981' }}>
                       {riderOwesOffice ? '-' : '+'}₱{settlementAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                   <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.7rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                         <Banknote size={14} /> CASH COLLECTION
                      </div>
                      <div style={{ fontWeight: 900, fontSize: '1rem' }}>₱{rec.cashCollected.toFixed(2)}</div>
                      <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700 }}>Owes ₱{rec.platformCommission.toFixed(2)} (15%)</div>
                   </div>
                   <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.7rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                         <CreditCard size={14} /> DIGITAL EARNINGS
                      </div>
                      <div style={{ fontWeight: 900, fontSize: '1rem' }}>₱{rec.digitalEarned.toFixed(2)}</div>
                      <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>Due to Agent (Net 85%)</div>
                   </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: riderOwesOffice ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)', borderRadius: '16px', marginBottom: '1.5rem' }}>
                   {riderOwesOffice ? <ArrowDownCircle color="#ef4444" /> : <ArrowUpCircle color="#10b981" />}
                   <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: riderOwesOffice ? '#991b1b' : '#065f46' }}>
                      {riderOwesOffice 
                        ? `AGENT OWES PLATFORM ₱${settlementAmount.toFixed(2)}` 
                        : `PLATFORM OWES AGENT ₱${settlementAmount.toFixed(2)}`}
                   </p>
                </div>

                <button 
                  onClick={() => handleSettleRecord(rec.riderId, riderOwesOffice ? 'collection' : 'payout')}
                  disabled={processing === rec.riderId}
                  style={{ width: '100%', background: '#0f172a', color: '#fff', border: 'none', padding: '1rem', borderRadius: '14px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: processing === rec.riderId ? 0.7 : 1 }}
                >
                   {processing === rec.riderId ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                   {riderOwesOffice ? 'RECORD CASH REMITTANCE' : 'PROCESS DIGITAL PAYOUT'}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
           <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                 <tr style={{ textAlign: 'left', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    {['TRANSACTION DATE', 'AGENT', 'TYPE', 'AMOUNT', 'VOL'].map(h => <th key={h} style={{ padding: '1.25rem', fontSize: '0.7rem', fontWeight: 900, color: '#64748b', letterSpacing: '0.05em' }}>{h}</th>)}
                 </tr>
              </thead>
              <tbody>
                 {payouts.map(p => {
                    const date = p.createdAt?.toDate ? p.createdAt.toDate() : new Date();
                    return (
                       <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ padding: '1.25rem' }}>
                             <div style={{ fontWeight: 800 }}>{date.toLocaleDateString()}</div>
                             <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                          <td style={{ padding: '1.25rem', fontWeight: 700 }}>{p.riderName || 'Agent'}</td>
                          <td style={{ padding: '1.25rem' }}>
                             <span style={{ 
                                background: p.type === 'collection' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                color: p.type === 'collection' ? '#3b82f6' : '#10b981',
                                padding: '4px 10px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 900
                             }}>
                                {p.type === 'collection' ? 'CASH REMITTANCE' : 'DIGITAL PAYOUT'}
                             </span>
                          </td>
                          <td style={{ padding: '1.25rem', fontWeight: 900 }}>₱{p.amount?.toFixed(2)}</td>
                          <td style={{ padding: '1.25rem', color: '#94a3b8', fontWeight: 700 }}>{p.orderCount} ords</td>
                       </tr>
                    )
                 })}
              </tbody>
           </table>
        </div>
      )}

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
