import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { Plus, Trash2, Tag, X } from 'lucide-react';

export default function CategoryManager({ onClose }: { onClose: () => void }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCat, setNewCat] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAdd = async () => {
    if (!newCat.trim()) return;
    try {
      await addDoc(collection(db, 'categories'), { label: newCat.trim(), emoji: '📦' });
      setNewCat('');
    } catch (e) {
      alert("Failed to add category");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this category? Stores using it will stay but won't be filtered correctly.")) {
      try {
        await deleteDoc(doc(db, 'categories', id));
      } catch (e) {
        alert("Delete failed");
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Tag size={20} color="var(--primary)" />
            <h2 style={{ margin: 0 }}>Category Management</h2>
          </div>
          <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input 
              placeholder="e.g. Pet Care, Hardware..." 
              style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleAdd}><Plus size={18} /> Add</button>
          </div>

          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {loading ? <p>Loading categories...</p> : categories.map(cat => (
              <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>{cat.label}</span>
                <button className="btn" style={{ padding: '0.4rem', color: 'var(--danger)' }} onClick={() => handleDelete(cat.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
