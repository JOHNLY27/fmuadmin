import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { auth } from './config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { LayoutDashboard, Store, Bike, Headset, Wallet, LogOut, Bell, Users, Settings, Star, Ticket } from 'lucide-react';



// Screens
import DashboardScreen from './screens/DashboardScreen';
import RidersScreen from './screens/RidersScreen';
import MerchantsScreen from './screens/MerchantsScreen';
import SupportScreen from './screens/SupportScreen';
import FinanceScreen from './screens/FinanceScreen';
import SettingsScreen from './screens/SettingsScreen';
import UsersScreen from './screens/UsersScreen';
import AdminLogin from './screens/AdminLogin';
import RatingsScreen from './screens/RatingsScreen';
import VoucherManagementScreen from './screens/VoucherManagementScreen';



function Sidebar({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const navItems = [
    { path: '/', label: 'Operations Dash', icon: <LayoutDashboard size={18} /> },
    { path: '/merchants', label: 'Merchant Hub', icon: <Store size={18} /> },
    { path: '/riders', label: 'Rider Fleet', icon: <Bike size={18} /> },
    { path: '/users', label: 'Customer Registry', icon: <Users size={18} /> },
    { path: '/finance', label: 'Financial Deck', icon: <Wallet size={18} /> },
    { path: '/marketing', label: 'Marketing & Promos', icon: <Ticket size={18} /> },
    { path: '/ratings', label: 'Ratings & Reviews', icon: <Star size={18} /> },
    { path: '/settings', label: 'System & Pricing', icon: <Settings size={18} /> },
    { path: '/support', label: 'Support Center', icon: <Headset size={18} /> },
  ];


  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="logo-text">Fetch Me Up HQ</h1>
      </div>
      <div className="nav-links">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>
      <div className="sidebar-footer">
        <button className="btn-logout" onClick={onLogout}>
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

function TopHeader({ userEmail }: { userEmail: string | null }) {
  return (
    <header className="header">
      <div className="header-title">Admin Command Center</div>
      <div className="user-profile">
        <button className="btn btn-outline" style={{ border: 'none', padding: '0.5rem' }}>
          <Bell size={20} color="var(--text-secondary)" />
        </button>
        <div className="avatar">{userEmail ? userEmail[0].toUpperCase() : 'A'}</div>
        <div style={{ marginLeft: '0.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Admin User</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{userEmail}</div>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
           <p style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>Initializing Command Center...</p>
           <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Synchronizing with regional cloud nodes</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin onLogin={(userData) => setUser(userData)} />;
  }

  return (
    <BrowserRouter>
      <div className="app-container" style={{ backgroundColor: '#fff', height: '100vh', width: '100vw' }}>
        <Sidebar onLogout={handleLogout} />
        <main className="main-content">
          <TopHeader userEmail={user?.email || 'Admin'} />
          <div className="content-body" style={{ paddingBottom: '4rem' }}>
            <Routes>
              <Route path="/" element={<DashboardScreen />} />
              <Route path="/merchants" element={<MerchantsScreen />} />
              <Route path="/riders" element={<RidersScreen />} />
              <Route path="/users" element={<UsersScreen />} />
              <Route path="/finance" element={<FinanceScreen />} />
              <Route path="/ratings" element={<RatingsScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
              <Route path="/support" element={<SupportScreen />} />
              <Route path="/marketing" element={<VoucherManagementScreen />} />


              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
