import { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  Terminal, 
  Zap, 
  MessageSquare, 
  Send, 
  Clock, 
  CornerDownRight 
} from 'lucide-react';

export default function SupportScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState('OFFLINE');
  const [activeTab, setActiveTab ] = useState<'chat' | 'users'>('chat');

  // Chat State
  const [supportThreads, setSupportThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(data);
      setLoading(false);
    });

    const unsubMessages = onSnapshot(collection(db, 'messages'), 
      (snap) => {
        setDbStatus(`${snap.size} PKTS`);
        const allMsgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const supportMsgs = allMsgs.filter((m: any) => m.orderId?.toLowerCase().startsWith('support_'));
        
        const threads: Record<string, any> = {};
        supportMsgs.forEach((m: any) => {
          const uId = m.orderId.replace('support_', '');
          if (!uId || uId === 'undefined') return;
          if (!threads[uId]) threads[uId] = { userId: uId, lastMsg: m, messages: [] };
          threads[uId].messages.push(m);
          
          const curA = m.createdAt?.seconds || 0;
          const curB = threads[uId].lastMsg.createdAt?.seconds || 0;
          if (curA >= curB) threads[uId].lastMsg = m;
        });

        const threadList = Object.values(threads).map((t: any) => {
          t.messages.sort((a: any, b: any) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
          return t;
        }).sort((a: any, b: any) => (b.lastMsg.createdAt?.seconds || 0) - (a.lastMsg.createdAt?.seconds || 0));


        setSupportThreads(threadList);
      },
      () => setDbStatus('SYNC ERROR')
    );
    return () => { unsubUsers(); unsubMessages(); };
  }, []);

  useEffect(() => {
    if (selectedThread) {
      const thread = supportThreads.find(t => t.userId === selectedThread.userId);
      if (thread) setChatMessages(thread.messages);
    }
  }, [supportThreads, selectedThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedThread) return;
    try {
      await addDoc(collection(db, 'messages'), {
        orderId: `support_${selectedThread.userId}`,
        senderId: 'ADMIN_SYSTEM',
        text: replyText.trim(),
        createdAt: serverTimestamp(),
      });
      setReplyText('');
    } catch (err) { console.error(err); }
  };

  const getUserName = (userId: string) => {
    const u = users.find(u => u.id === userId);
    return u?.name || u?.email || 'Unknown User';
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>INITIALIZING IDENTITY REGISTRY...</div>;
  }

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: 'calc(100vh - 100px)', padding: '2rem', borderRadius: '1.5rem', color: '#f8fafc', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
      {/* HUD Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
             <Terminal size={18} style={{ color: '#3b82f6' }} />
             <h2 style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '0.05em', margin: 0, textTransform: 'uppercase' }}>Command Center • Support</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.7rem', fontWeight: 800 }}>
            <span style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px #22c55e' }}></span>
            LIVE FREQUENCY • BUTUAN HQ
          </div>
        </div>
        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
           <Zap size={14} style={{ color: '#3b82f6' }} />
           <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#3b82f6', letterSpacing: '0.1em' }}>TELEMETRY: {dbStatus}</span>
        </div>
      </div>

      
      {/* Sub-Nav Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', background: 'rgba(30, 41, 59, 0.5)', padding: '0.4rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', width: 'fit-content' }}>
        <button onClick={() => setActiveTab('chat')} style={{ padding: '0.6rem 1.5rem', borderRadius: '10px', border: 'none', background: activeTab === 'chat' ? '#3b82f6' : 'transparent', color: activeTab === 'chat' ? '#fff' : '#94a3b8', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          <MessageSquare size={16} />
          ACTIVE STREAMS
        </button>
        <button onClick={() => setActiveTab('users')} style={{ padding: '0.6rem 1.5rem', borderRadius: '10px', border: 'none', background: activeTab === 'users' ? '#3b82f6' : 'transparent', color: activeTab === 'users' ? '#fff' : '#94a3b8', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          IDENTITY REGISTRY
        </button>
      </div>

      {activeTab === 'chat' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem', height: 'calc(100vh - 320px)', minHeight: '600px' }}>
          {/* Enhanced Thread List */}
          <div style={{ background: '#1e293b', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {supportThreads.length === 0 ? (
               <div style={{ padding: '2rem', textAlign: 'center', color: '#475569' }}>No Active Feeds</div>
            ) : supportThreads.map(thread => {
              const u = users.find(u => u.id === thread.userId);
              const isSelected = selectedThread?.userId === thread.userId;
              return (
                <div 
                  key={thread.userId} 
                  onClick={() => setSelectedThread(thread)}
                  style={{ 
                    padding: '1.25rem', 
                    cursor: 'pointer', 
                    borderRadius: '1rem',
                    background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(15, 23, 42, 0.4)',
                    border: isSelected ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                     <span style={{ fontWeight: 800, fontSize: '0.95rem', color: isSelected ? '#3b82f6' : '#f1f5f9' }}>{u?.name || 'Fetch User'}</span>
                     <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '4px', fontWeight: 900 }}>{u?.role?.toUpperCase()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <CornerDownRight size={12} style={{ opacity: 0.3 }} />
                     <div style={{ fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {thread.lastMsg.text}
                     </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* High-Tech Chat Box */}
          <div style={{ background: '#1e293b', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {selectedThread ? (
              <>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.2)' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ width: '48px', height: '48px', background: '#3b82f6', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.2rem', boxShadow: '0 8px 16px rgba(59, 130, 246, 0.4)' }}>
                         {getUserName(selectedThread.userId).charAt(0)}
                      </div>
                      <div>
                         <div style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>{getUserName(selectedThread.userId)}</div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                            <div className="pulse-dot"></div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#22c55e', letterSpacing: '0.05em' }}>ASSISTANCE PROTOCOL ENGAGED</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#0f172a' }}>
                   {chatMessages.map((m: any) => {
                     const isAdmin = m.senderId === 'ADMIN_SYSTEM';
                     return (
                       <div key={m.id} style={{ 
                         alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                         maxWidth: '70%',
                       }}>
                         <div style={{ 
                           padding: '1rem 1.5rem',
                           borderRadius: isAdmin ? '1.25rem 1.25rem 4px 1.25rem' : '1.25rem 1.25rem 1.25rem 4px',
                           backgroundColor: isAdmin ? '#3b82f6' : '#334155',
                           color: '#fff',
                           fontSize: '0.95rem',
                           fontWeight: 500,
                           boxShadow: isAdmin ? '0 10px 20px rgba(59, 130, 246, 0.2)' : 'none',
                           border: isAdmin ? 'none' : '1px solid rgba(255,255,255,0.05)'
                         }}>
                           {m.text}
                         </div>
                         <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.5rem', fontWeight: 700, textAlign: isAdmin ? 'right' : 'left', display: 'flex', alignItems: 'center', justifyContent: isAdmin ? 'flex-end' : 'flex-start', gap: '0.4rem' }}>
                           <Clock size={10} />
                           {m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'PROTOCOL PENDING'}
                         </div>
                       </div>
                     );
                   })}
                   <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendReply} style={{ padding: '1.5rem', background: '#1e293b', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem' }}>
                   <input 
                    placeholder="ENTER RESPONSE SEQUENCE..." 
                    value={replyText} 
                    onChange={(e) => setReplyText(e.target.value)}
                    style={{ flex: 1, padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }} 
                   />
                   <button type="submit" style={{ height: '52px', width: '52px', border: 'none', borderRadius: '12px', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)' }}>
                      <Send size={22} />
                   </button>
                </form>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#475569' }}>
                <div style={{ background: '#334155', width: '80px', height: '80px', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <MessageSquare size={32} style={{ opacity: 0.2 }} />
                </div>
                <h3 style={{ color: '#94a3b8', fontWeight: 800, letterSpacing: '0.1em' }}>TERMINAL STANDBY</h3>
                <p style={{ fontSize: '0.85rem' }}>Select active stream to initialize brief.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ background: '#1e293b', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
           <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                 <tr style={{ textAlign: 'left', background: 'rgba(15, 23, 42, 0.4)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {['IDENTITY', 'ROLE', 'EMAIL', 'STATUS'].map(h => <th key={h} style={{ padding: '1.25rem', fontSize: '0.7rem', fontWeight: 900, color: '#64748b', letterSpacing: '0.1em' }}>{h}</th>)}
                 </tr>
              </thead>
              <tbody>
                 {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s ease' }}>
                       <td style={{ padding: '1.25rem', fontWeight: 700 }}>{u.name || 'ANONYMOUS'}</td>
                       <td style={{ padding: '1.25rem' }}>
                          <span style={{ fontSize: '0.65rem', padding: '4px 10px', background: u.role === 'admin' ? '#ef444420' : '#3b82f620', color: u.role === 'admin' ? '#ef4444' : '#3b82f6', borderRadius: '99px', fontWeight: 900 }}>{u.role?.toUpperCase()}</span>
                       </td>
                       <td style={{ padding: '1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>{u.email}</td>
                       <td style={{ padding: '1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22c55e', fontSize: '0.8rem', fontWeight: 800 }}>
                             <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%' }}></div>
                             SECURED
                          </div>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .pulse-dot {
          width: 8px; height: 8px; background: #22c55e; border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
      `}} />
    </div>
  );
}
