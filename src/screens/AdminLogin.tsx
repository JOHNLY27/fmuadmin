import { useState } from 'react';
import { auth, db } from '../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Shield, Lock, Mail, ArrowRight, Terminal, UserPlus } from 'lucide-react';

export default function AdminLogin({ onLogin }: { onLogin: (user: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const user = userCredential.user;
      
      // Check if user is an admin in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      if (userData?.role === 'admin') {
        onLogin({ ...userData, email: user.email });
      } else {
        setError('Access denied. This account does not have admin privileges.');
        await auth.signOut();
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('Wrong email or password. Please try again.');
      } else {
        setError(err.message || 'Login failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      // Step 1: Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const uid = userCredential.user.uid;
      
      // Step 2: Create Firestore document with role: admin
      // Using only simple string fields - NO undefined values possible
      await setDoc(doc(db, 'users', uid), {
        uid: uid,
        name: 'Admin',
        email: cleanEmail,
        role: 'admin',
      });

      setSuccess('Admin account created! You can now sign in.');
      setMode('login');
      await auth.signOut(); // Sign out so they can login properly
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try logging in instead, or delete it from Firebase Auth first.');
      } else {
        setError(err.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBypass = () => {
    onLogin({ email: 'developer@fetchmeup.com', role: 'admin' });
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f1f5f9'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '420px', 
        backgroundColor: '#fff', 
        padding: '2.5rem', 
        borderRadius: 'var(--radius-lg)', 
        boxShadow: 'var(--shadow-lg)' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            backgroundColor: '#fee2e2', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 1rem',
            color: 'var(--primary)'
          }}>
            <Shield size={32} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', fontStyle: 'italic' }}>Fetch Me Up</h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Command Center</p>
        </div>

        {/* Mode Switcher */}
        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: 'var(--radius-full)', padding: '4px', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            style={{ 
              flex: 1, padding: '0.6rem', border: 'none', borderRadius: 'var(--radius-full)', cursor: 'pointer',
              backgroundColor: mode === 'login' ? '#fff' : 'transparent',
              fontWeight: mode === 'login' ? 700 : 500,
              color: mode === 'login' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: mode === 'login' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Sign In
          </button>
          <button 
            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
            style={{ 
              flex: 1, padding: '0.6rem', border: 'none', borderRadius: 'var(--radius-full)', cursor: 'pointer',
              backgroundColor: mode === 'register' ? '#fff' : 'transparent',
              fontWeight: mode === 'register' ? 700 : 500,
              color: mode === 'register' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: mode === 'register' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <UserPlus size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Register
          </button>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              {mode === 'login' ? 'Admin Email' : 'New Admin Email'}
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fmu.com"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem', 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--border-color)',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Password {mode === 'register' && '(min 6 characters)'}
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem', 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--border-color)',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {error && (
            <div style={{ 
              padding: '0.75rem', 
              backgroundColor: '#fee2e2', 
              color: '#991b1b', 
              borderRadius: 'var(--radius-md)', 
              fontSize: '0.85rem',
              fontWeight: 600
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ 
              padding: '0.75rem', 
              backgroundColor: '#dcfce7', 
              color: '#166534', 
              borderRadius: 'var(--radius-md)', 
              fontSize: '0.85rem',
              fontWeight: 600
            }}>
              {success}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary" 
            style={{ padding: '1rem', justifyContent: 'center', fontSize: '1rem' }}
          >
            {loading 
              ? (mode === 'login' ? 'Signing In...' : 'Creating Account...') 
              : (mode === 'login' ? 'Sign In to Dashboard' : 'Create Admin Account')
            } 
            <ArrowRight size={20} style={{ marginLeft: 8 }} />
          </button>

          <button 
            type="button"
            onClick={handleBypass}
            className="btn btn-outline" 
            style={{ padding: '0.8rem', justifyContent: 'center', borderStyle: 'dashed', borderColor: 'var(--primary)', color: 'var(--primary)' }}
          >
            <Terminal size={18} style={{ marginRight: 8 }} /> Skip to Dashboard (Dev Mode)
          </button>
        </form>

        <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Authorized access only. All activities are logged.
        </p>
      </div>
    </div>
  );
}
