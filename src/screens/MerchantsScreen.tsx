import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Store, Power, Search, MapPin, Plus, X, Trash2, Tag, Image as ImageIcon } from 'lucide-react';
import { 
  subscribeToMerchants, 
  updateMerchantStatus, 
  addMerchant, 
  deleteMerchant,
  updateMerchant,
  archiveMerchant,
  restoreMerchant
} from '../services/merchantService';
import type { Merchant } from '../services/merchantService';
import CategoryManager from '../components/CategoryManager';

export default function MerchantsScreen() {
  const [stores, setStores] = useState<Merchant[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [showModal, setShowModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingStore, setEditingStore] = useState<Merchant | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<{id: string, name: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    address: '',
    barangay: '',
    openHours: '08:00 AM - 09:00 PM',
    deliveryFee: 35,
    image: ''
  });

  useEffect(() => {
    const unsubMerchants = subscribeToMerchants((data) => {
      setStores(data);
      setLoading(false);
    });
    
    // Live subscribe to categories
    const unsubCats = onSnapshot(collection(db, 'categories'), (snap) => {
      const cats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(cats);
    });

    return () => {
      unsubMerchants();
      unsubCats();
    };
  }, []);

  const handleOpenModal = (store?: Merchant) => {
    if (store) {
      setEditingStore(store);
      setFormData({
        name: store.name,
        category: store.category,
        address: store.address || '',
        barangay: store.barangay || '',
        openHours: store.openHours || '08:00 AM - 09:00 PM',
        deliveryFee: store.deliveryFee || 35,
        image: store.image || ''
      });
    } else {
      setEditingStore(null);
      setFormData({
        name: '',
        category: categories.length > 0 ? categories[0].label : '',
        address: '',
        barangay: '',
        openHours: '08:00 AM - 09:00 PM',
        deliveryFee: 35,
        image: ''
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStore) {
        await updateMerchant(editingStore.id, formData);
      } else {
        await addMerchant(formData as any);
      }
      setShowModal(false);
    } catch (e) {
      alert("Failed to save merchant profile");
    }
  };

  const confirmDelete = (id: string, name: string) => {
    setStoreToDelete({ id, name });
    setShowConfirmModal(true);
  };

  const handleDelete = async () => {
    if (!storeToDelete) return;
    
    setIsDeleting(true);
    console.log(`--- SYSTEM: INIT PURGE FOR [${storeToDelete.name}] (ID: ${storeToDelete.id}) ---`);
    
    try {
      await deleteMerchant(storeToDelete.id);
      setShowConfirmModal(false);
      setStoreToDelete(null);
      // Toast or notification would go here
    } catch (e) {
      console.error("--- ALERT: PURGE FAILED ---", e);
      alert("CRITICAL: Failed to delete merchant. Check console for cloud error.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = stores.filter(s => {
    const matchSearch = (s.name || '').toLowerCase().includes(search.toLowerCase()) || (s.barangay || '').toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'All' || s.category === categoryFilter;
    const matchTab = activeTab === 'active' ? !s.isArchived : s.isArchived;
    return matchSearch && matchCategory && matchTab;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 className="screen-title">Merchant Management</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Deploy and manage partner stores across Butuan City.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={() => setShowCatModal(true)}>
            <Tag size={18} /> Manage Categories
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Add New Store
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        <div className={`tab ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>Active Stores</div>
        <div className={`tab ${activeTab === 'archived' ? 'active' : ''}`} onClick={() => setActiveTab('archived')}>Archives</div>
      </div>

      {/* Category Row */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <button 
          className={`btn ${categoryFilter === 'All' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setCategoryFilter('All')}
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
        >
          🏪 All Stores
        </button>
        {categories.map((cat) => (
          <button 
            key={cat.id}
            className={`btn ${categoryFilter === cat.label ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setCategoryFilter(cat.label)}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            {cat.emoji || '📦'} {cat.label}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input placeholder="Search by name or barangay..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem', boxSizing: 'border-box' }} />
      </div>

      <div className="table-container">
        <div className="table-header">
           <h2 style={{ fontSize: '1.1rem' }}>{activeTab === 'active' ? 'Operational Partners' : 'Archived Records'} ({filtered.length})</h2>
           <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
             <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: activeTab === 'active' ? 'var(--success)' : 'var(--text-muted)' }}></div>
             <span style={{ fontSize: '0.75rem', fontWeight: 600, color: activeTab === 'active' ? 'var(--success)' : 'var(--text-muted)' }}>
               {activeTab === 'active' ? 'LIVE CONTROL' : 'STORAGE'}
             </span>
           </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>STORE NAME</th>
              <th>CATEGORY</th>
              <th>LOCATION</th>
              <th>PRICE/FEE</th>
              <th>VERIFIED</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Fetching cloud data...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No matches found in {activeTab}.</td></tr>
            ) : (
              filtered.map((store) => (
                <tr key={store.id}>
                  <td style={{ fontWeight: 800 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                       <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: 'var(--bg-main)', overflow: 'hidden', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         {store.image ? <img src={store.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <Store size={20} color="var(--text-dim)" />}
                       </div>
                       {store.name}
                    </div>
                  </td>
                  <td><span className="badge" style={{ backgroundColor: '#f1f5f9', color: 'var(--text-primary)' }}>{store.category}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                      <MapPin size={14} color="var(--text-muted)" /> {store.barangay || 'Local'}
                    </div>
                  </td>
                  <td><strong style={{ color: 'var(--primary)' }}>₱{store.deliveryFee}</strong></td>
                  <td>{store.isVerified ? <span className="badge badge-success">✓ Verified</span> : <span className="badge badge-warning">Pending</span>}</td>
                  <td><span className={`badge ${store.isOpen ? 'badge-success' : 'badge-danger'}`}>{store.isOpen ? 'ONLINE' : 'OFFLINE'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                       <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={() => handleOpenModal(store)}>Edit</button>
                       
                        {activeTab === 'active' ? (
                         <>
                           <button className="btn btn-outline" style={{ padding: '0.5rem', color: 'var(--warning)', borderColor: 'var(--warning)', backgroundColor: 'transparent' }} onClick={() => archiveMerchant(store.id)}>
                             <Trash2 size={16} />
                           </button>
                           <button className={`btn ${store.isOpen ? 'btn-logout' : 'btn-primary'}`} style={{ padding: '0.5rem', minWidth: '70px', fontSize: '0.7rem' }} onClick={() => updateMerchantStatus(store.id, !store.isOpen)}>
                             <Power size={14} /> {store.isOpen ? 'OFF' : 'ON'}
                           </button>
                         </>
                       ) : (
                         <>
                           <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderColor: 'var(--success)', color: 'var(--success)' }} onClick={() => restoreMerchant(store.id)}>Restore</button>
                           <button className="btn" style={{ padding: '0.4rem', color: 'white', backgroundColor: 'var(--danger)' }} onClick={() => confirmDelete(store.id, store.name)}>
                             <Trash2 size={16} />
                           </button>
                         </>
                       )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCatModal && <CategoryManager onClose={() => setShowCatModal(false)} />}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900 }}>{editingStore ? 'Edit Merchant Profile' : 'Register New Partner'}</h2>
              <button className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: '50%' }} onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={formGroup}><label style={labelStyle}>STORE NAME</label><input required style={inputStyle} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Butuan BBQ House" /></div>
                <div style={formGroup}><label style={labelStyle}>CATEGORY</label>
                  <select style={inputStyle} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {categories.map(c => <option key={c.id} value={c.label}>{c.label}</option>)}
                  </select>
                </div>
                <div style={formGroup}><label style={labelStyle}>BARANGAY</label><input style={inputStyle} value={formData.barangay} onChange={e => setFormData({...formData, barangay: e.target.value})} placeholder="e.g. Libertad" /></div>
                <div style={formGroup}><label style={labelStyle}>DELIVERY FEE (₱)</label><input type="number" style={inputStyle} value={formData.deliveryFee} onChange={e => setFormData({...formData, deliveryFee: Number(e.target.value)})} /></div>
              </div>
              <div style={{ ...formGroup, marginTop: '1rem' }}><label style={labelStyle}>IMAGE URL (FOR BRANDING)</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input placeholder="https://..." style={{ ...inputStyle, flex: 1 }} value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
                  <div style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: '#f1f5f9', overflow: 'hidden', border: '2px solid var(--border)' }}>
                    {formData.image ? <img src={formData.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={20} style={{ margin: 20 }} color="#cbd5e1" />}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Discard</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingStore ? 'Save Changes' : 'Confirm Registration'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ padding: '2.5rem 2rem' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Trash2 size={32} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--secondary)', marginBottom: '0.75rem' }}>Confirm Destruction?</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2rem' }}>
                You are about to permanently purge <strong style={{ color: 'var(--text-main)' }}>{storeToDelete?.name}</strong> from the regional cloud. This action is irreversible.
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowConfirmModal(false)} disabled={isDeleting}>Cancel</button>
                <button className="btn btn-logout" style={{ flex: 1 }} onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Purging...' : 'Yes, Purge It'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const formGroup = { marginBottom: '0.8rem' };
const labelStyle = { display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.4rem' };
const inputStyle = { width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem', boxSizing: 'border-box' as const };

