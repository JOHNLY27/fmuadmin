import { useState, useEffect } from 'react';
import { Settings, DollarSign, Zap, Shield, Save, RotateCcw } from 'lucide-react';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export default function SettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    pricing: {
      food_base_delivery: 35,
      ride_base_fare: 40,
      ride_per_km: 12,
      parcel_base_fare: 45,
      pabili_service_fee: 50,
      night_differential: 20
    },
    platform: {
      commission_rate: 15,
      min_payout_balance: 500,
      system_maintenance: false
    }
  });

  useEffect(() => {
    // Single source of truth for platform config
    const unsub = onSnapshot(doc(db, 'platform', 'config'), (snap) => {
      if (snap.exists()) {
        setConfig(snap.data() as any);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'platform', 'config'), config);
      alert("Platform settings synchronized successfully!");
    } catch (e) {
      alert("Failed to sync settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Platform Config...</div>;

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 className="screen-title">System & Pricing Control</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Global configuration for FetchMeUp services in Butuan City.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={() => window.location.reload()}>
            <RotateCcw size={16} /> Reset
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? 'Syncing...' : 'Save Global Config'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Pricing Column */}
        <section className="table-container" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
            <DollarSign size={20} />
            <h3 style={{ margin: 0 }}>Service Pricing (₱)</h3>
          </div>
          
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <div>
              <label style={labelStyle}>FETCHFOOD BASE DELIVERY</label>
              <input type="number" value={config.pricing.food_base_delivery} 
                onChange={e => setConfig({...config, pricing: {...config.pricing, food_base_delivery: Number(e.target.value)}})}
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>FETCHRIDE BASE FARE</label>
              <input type="number" value={config.pricing.ride_base_fare} 
                onChange={e => setConfig({...config, pricing: {...config.pricing, ride_base_fare: Number(e.target.value)}})}
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>FETCHRIDE PER KM RATE</label>
              <input type="number" value={config.pricing.ride_per_km} 
                onChange={e => setConfig({...config, pricing: {...config.pricing, ride_per_km: Number(e.target.value)}})}
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>FETCHPARCEL BASE RATE</label>
              <input type="number" value={config.pricing.parcel_base_fare} 
                onChange={e => setConfig({...config, pricing: {...config.pricing, parcel_base_fare: Number(e.target.value)}})}
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>FETCHPABILI SERVICE FEE</label>
              <input type="number" value={config.pricing.pabili_service_fee} 
                onChange={e => setConfig({...config, pricing: {...config.pricing, pabili_service_fee: Number(e.target.value)}})}
                style={inputStyle} />
            </div>
          </div>
        </section>

        {/* Platform Policy Column */}
        <section className="table-container" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--success)' }}>
            <Shield size={20} />
            <h3 style={{ margin: 0 }}>Platform Policies</h3>
          </div>

          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <div>
              <label style={labelStyle}>PLATFORM COMMISSION (%)</label>
              <input type="number" value={config.platform.commission_rate} 
                onChange={e => setConfig({...config, platform: {...config.platform, commission_rate: Number(e.target.value)}})}
                style={inputStyle} />
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Percentage logic applied to all completed missions.</p>
            </div>

            <div>
              <label style={labelStyle}>MINIMUM PAYOUT BALANCE (₱)</label>
              <input type="number" value={config.platform.min_payout_balance} 
                onChange={e => setConfig({...config, platform: {...config.platform, min_payout_balance: Number(e.target.value)}})}
                style={inputStyle} />
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem' }}>System Maintenance</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Force suspend all mobile operations</p>
                </div>
                <input type="checkbox" checked={config.platform.system_maintenance} 
                  onChange={e => setConfig({...config, platform: {...config.platform, system_maintenance: e.target.checked}})}
                  style={{ width: '20px', height: '20px' }} />
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '0.7rem',
  fontWeight: 900,
  letterSpacing: '1px',
  color: 'var(--text-secondary)',
  marginBottom: '0.5rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  fontSize: '1rem',
  fontWeight: 700,
  color: 'var(--theme-primary)',
  boxSizing: 'border-box' as const
};
