import { useState } from 'react';
import { Shield, Lock, Settings, AlertCircle, Save } from 'lucide-react';

export default function SecurityScreen() {
  const [appSettings, setAppSettings] = useState({
    maintenanceMode: false,
    baseDeliveryFee: 49,
    serviceCommission: 15,
    minOrderValue: 100
  });

  const handleSave = () => {
    alert("Settings saved successfully! Updating app config in Firebase...");
  };

  return (
    <div>
      <h2 className="screen-title">System & Security Context</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Protect user data, manage app-wide configurations, and monitor suspicious activities.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* App Settings */}
        <div className="table-container">
          <div className="table-header">
            <h2><Settings size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Global App Settings</h2>
          </div>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 600 }}>Maintenance Mode</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Disable all orders and show maintenance screen</p>
              </div>
              <input 
                type="checkbox" 
                checked={appSettings.maintenanceMode} 
                onChange={(e) => setAppSettings({...appSettings, maintenanceMode: e.target.checked})}
                style={{ width: 40, height: 20 }}
              />
            </div>

            <div>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>Base Delivery Fee (₱)</p>
              <input 
                className="btn btn-outline" 
                style={{ width: '100%', textAlign: 'left', padding: '0.75rem' }} 
                type="number" 
                value={appSettings.baseDeliveryFee}
                onChange={(e) => setAppSettings({...appSettings, baseDeliveryFee: parseInt(e.target.value)})}
              />
            </div>

            <div>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>Service Commission (%)</p>
              <input 
                className="btn btn-outline" 
                style={{ width: '100%', textAlign: 'left', padding: '0.75rem' }} 
                type="number" 
                value={appSettings.serviceCommission}
                onChange={(e) => setAppSettings({...appSettings, serviceCommission: parseInt(e.target.value)})}
              />
            </div>

            <button className="btn btn-primary" style={{ marginTop: '1rem', justifyContent: 'center' }} onClick={handleSave}>
              <Save size={18} /> Save Configurations
            </button>
          </div>
        </div>

        {/* Fraud Monitoring */}
        <div className="table-container">
          <div className="table-header">
            <h2><Shield size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Fraud Detection</h2>
          </div>
          <div style={{ padding: '1.5rem' }}>
             <div style={{ backgroundColor: '#fff7ed', border: '1px solid #ffedd5', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: 10, color: '#9a3412' }}>
                  <AlertCircle size={20} />
                  <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Suspicious activity detected from IP 112.198.XX.XX (3 failed login attempts)</p>
                </div>
             </div>

             <div className="stat-card" style={{ marginBottom: '1rem', padding: '1rem' }}>
                <Lock size={20} color="var(--danger)" />
                <div style={{ marginLeft: '1rem' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>Auto-Blocked Accounts</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>4</p>
                </div>
             </div>

             <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                Run Security Audit
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
