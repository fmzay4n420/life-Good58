/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Phone, 
  Lock, 
  UserPlus, 
  LayoutDashboard, 
  Wallet, 
  Users, 
  LogOut, 
  Camera, 
  Copy, 
  CheckCircle, 
  Clock, 
  XCircle,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Menu,
  ChevronRight,
  Plus,
  Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type UserStatus = 'Pending' | 'Active';
type WithdrawStatus = 'Pending' | 'Paid' | 'Rejected';

interface UserData {
  id: number;
  name: string;
  phone: string;
  refer_code: string;
  referred_by: string | null;
  balance: number;
  status: UserStatus;
  profile_pic: string | null;
  referralsCount?: number;
}

interface Withdrawal {
  id: number;
  user_id: number;
  amount: number;
  method: string;
  number: string;
  status: WithdrawStatus;
  created_at: string;
  user_name?: string;
  user_phone?: string;
}

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, loading = false }: any) => {
  const baseStyles = "w-full h-11 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm";
  const variants: any = {
    primary: "bg-emerald-600 text-white active:scale-95 disabled:bg-emerald-300",
    secondary: "bg-white text-emerald-600 border border-emerald-600 active:scale-95",
    danger: "bg-rose-500 text-white active:scale-95",
    ghost: "bg-transparent text-gray-500 active:bg-gray-100"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : children}
    </button>
  );
};

const Input = ({ icon: Icon, label, ...props }: any) => (
  <div className="space-y-1.5 w-full">
    {label && <label className="text-[13px] font-medium text-gray-700 ml-1">{label}</label>}
    <div className="relative">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
      <input 
        {...props} 
        className={`w-full h-11 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${Icon ? 'pl-10' : 'px-4'}`}
      />
    </div>
  </div>
);

const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 ${className}`}>
    {children}
  </div>
);

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'splash' | 'login' | 'register' | 'dashboard' | 'profile' | 'withdraw' | 'admin-login' | 'admin-dashboard' | 'admin-users' | 'admin-withdrawals'>('splash');
  const [user, setUser] = useState<UserData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Form States
  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', phone: '', password: '', refer_by: '' });
  const [adminLoginForm, setAdminLoginForm] = useState({ username: '', password: '' });
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', method: 'Bkash', number: '' });

  // Data States
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminWithdrawals, setAdminWithdrawals] = useState<any[]>([]);
  const [withdrawHistory, setWithdrawHistory] = useState<Withdrawal[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        fetchUserProfile(parsed.id);
      } else {
        setView('login');
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUserProfile = async (id: number) => {
    try {
      const res = await fetch(`/api/user/${id}`);
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        setView('dashboard');
      } else {
        localStorage.removeItem('user');
        setView('login');
      }
    } catch (err) {
      setView('login');
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        setView('dashboard');
        showToast('Login Successful');
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast('Connection Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Registration Successful! Please Login.');
        setView('login');
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast('Connection Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminLoginForm)
      });
      const data = await res.json();
      if (data.success) {
        setIsAdmin(true);
        fetchAdminData();
        setView('admin-dashboard');
        showToast('Admin Access Granted');
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast('Connection Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    const [statsRes, usersRes, withdrawRes] = await Promise.all([
      fetch('/api/admin/stats'),
      fetch('/api/admin/users'),
      fetch('/api/admin/withdrawals')
    ]);
    setAdminStats(await statsRes.json());
    setAdminUsers(await usersRes.json());
    setAdminWithdrawals(await withdrawRes.json());
  };

  const handleWithdraw = async () => {
    if (!user) return;
    if (Number(withdrawForm.amount) < 100) return showToast('Minimum withdraw 100 BDT', 'error');
    
    setLoading(true);
    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...withdrawForm, userId: user.id })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Withdraw Request Sent');
        fetchUserProfile(user.id);
        fetchWithdrawHistory();
        setView('dashboard');
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast('Error sending request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawHistory = async () => {
    if (!user) return;
    const res = await fetch(`/api/withdrawals/${user.id}`);
    setWithdrawHistory(await res.json());
  };

  const updateAdminUserStatus = async (userId: number, status: string) => {
    const res = await fetch('/api/admin/user/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, status })
    });
    if (res.ok) {
      showToast(`User ${status}`);
      fetchAdminData();
    }
  };

  const updateAdminWithdrawStatus = async (withdrawId: number, status: string) => {
    const res = await fetch('/api/admin/withdraw/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ withdrawId, status })
    });
    if (res.ok) {
      showToast(`Withdrawal ${status}`);
      fetchAdminData();
    }
  };

  const handleProfileUpdate = async (name: string, pic: string | null) => {
    if (!user) return;
    const res = await fetch('/api/user/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, name, profile_pic: pic })
    });
    if (res.ok) {
      showToast('Profile Updated');
      fetchUserProfile(user.id);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsAdmin(false);
    setView('login');
  };

  const copyReferCode = () => {
    if (user?.refer_code) {
      navigator.clipboard.writeText(user.refer_code);
      showToast('Refer code copied!');
    }
  };

  // --- Render Functions ---

  const renderSplashView = () => (
    <div className="h-screen flex flex-col items-center justify-center bg-emerald-600 text-white p-6">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl"
      >
        <TrendingUp className="w-10 h-10 text-emerald-600" />
      </motion.div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Life Good</h1>
      <p className="text-emerald-100 text-sm text-center">Your Digital Earning Partner</p>
      <div className="absolute bottom-12">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    </div>
  );

  const renderLoginView = () => (
    <div className="min-h-screen bg-white p-6 flex flex-col">
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-500 text-sm">Login to your Life Good account</p>
        </div>
        
        <div className="space-y-4">
          <Input 
            icon={Phone} 
            label="Mobile Number" 
            placeholder="01XXXXXXXXX" 
            value={loginForm.phone}
            onChange={(e: any) => setLoginForm({ ...loginForm, phone: e.target.value })}
          />
          <Input 
            icon={Lock} 
            label="Password" 
            type="password" 
            placeholder="••••••••" 
            value={loginForm.password}
            onChange={(e: any) => setLoginForm({ ...loginForm, password: e.target.value })}
          />
          <Button onClick={handleLogin} loading={loading}>Login</Button>
          
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400">Or</span></div>
          </div>
          
          <Button variant="secondary" onClick={() => setView('register')}>Create New Account</Button>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <button onClick={() => setView('admin-login')} className="text-xs text-gray-400 hover:text-emerald-600 transition-colors">Admin Login</button>
      </div>
    </div>
  );

  const renderRegisterView = () => (
    <div className="min-h-screen bg-white p-6 flex flex-col">
      <div className="mb-8">
        <button onClick={() => setView('login')} className="p-2 -ml-2 text-gray-400"><ArrowRight className="w-5 h-5 rotate-180" /></button>
        <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-2">Join Us</h2>
        <p className="text-gray-500 text-sm">Start your earning journey today</p>
      </div>
      
      <div className="space-y-4 flex-1">
        <Input 
          icon={User} 
          label="Full Name" 
          placeholder="John Doe" 
          value={registerForm.name}
          onChange={(e: any) => setRegisterForm({ ...registerForm, name: e.target.value })}
        />
        <Input 
          icon={Phone} 
          label="Mobile Number" 
          placeholder="01XXXXXXXXX" 
          value={registerForm.phone}
          onChange={(e: any) => setRegisterForm({ ...registerForm, phone: e.target.value })}
        />
        <Input 
          icon={Lock} 
          label="Password" 
          type="password" 
          placeholder="••••••••" 
          value={registerForm.password}
          onChange={(e: any) => setRegisterForm({ ...registerForm, password: e.target.value })}
        />
        <Input 
          icon={UserPlus} 
          label="Refer Code (Optional)" 
          placeholder="6-Digit Code" 
          value={registerForm.refer_by}
          onChange={(e: any) => setRegisterForm({ ...registerForm, refer_by: e.target.value })}
        />
        <Button onClick={handleRegister} loading={loading}>Register</Button>
      </div>
      
      <p className="text-center text-[13px] text-gray-500 mt-6">
        Already have an account? <button onClick={() => setView('login')} className="text-emerald-600 font-semibold">Login</button>
      </p>
    </div>
  );

  const renderDashboardView = () => (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-emerald-600 text-white p-6 rounded-b-[32px] shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 overflow-hidden flex items-center justify-center">
              {user?.profile_pic ? (
                <img src={user.profile_pic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <p className="text-[11px] text-emerald-100 uppercase tracking-wider font-semibold">Welcome back,</p>
              <h3 className="font-bold text-sm">{user?.name}</h3>
            </div>
          </div>
          <button onClick={() => setView('profile')} className="p-2 bg-white/10 rounded-xl border border-white/20"><Menu className="w-5 h-5" /></button>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[11px] text-emerald-100 uppercase font-bold mb-1">Total Balance</p>
              <h2 className="text-2xl font-bold">৳ {user?.balance.toFixed(2)}</h2>
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${user?.status === 'Active' ? 'bg-emerald-400 text-emerald-900' : 'bg-amber-400 text-amber-900'}`}>
              {user?.status}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-6 -mt-4 grid grid-cols-2 gap-4">
        <Card className="flex flex-col items-center justify-center py-5">
          <div className="p-2.5 bg-emerald-50 rounded-xl mb-2"><Users className="w-5 h-5 text-emerald-600" /></div>
          <p className="text-[11px] text-gray-500 font-bold uppercase">Referrals</p>
          <h4 className="text-lg font-bold text-gray-900">{user?.referralsCount || 0}</h4>
        </Card>
        <Card className="flex flex-col items-center justify-center py-5">
          <div className="p-2.5 bg-blue-50 rounded-xl mb-2"><Wallet className="w-5 h-5 text-blue-600" /></div>
          <p className="text-[11px] text-gray-500 font-bold uppercase">Income</p>
          <h4 className="text-lg font-bold text-gray-900">৳ {(user?.referralsCount || 0) * 100}</h4>
        </Card>
      </div>

      {/* Refer Section */}
      <div className="p-6 space-y-4">
        <Card className="bg-emerald-900 text-white border-none">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm">Your Refer Code</h4>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/10 rounded-xl h-11 flex items-center px-4 font-mono font-bold tracking-widest text-emerald-400 border border-white/10">
              {user?.refer_code}
            </div>
            <button onClick={copyReferCode} className="h-11 w-11 bg-emerald-600 rounded-xl flex items-center justify-center active:scale-90 transition-transform">
              <Copy className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-emerald-300/80 mt-3 leading-relaxed">
            Share this code with your friends. Get ৳100 for every successful active ID referral.
          </p>
        </Card>

        {user?.status === 'Pending' && (
          <Card className="bg-amber-50 border-amber-100">
            <div className="flex gap-3">
              <div className="p-2 bg-amber-100 rounded-lg h-fit"><Clock className="w-5 h-5 text-amber-600" /></div>
              <div>
                <h4 className="text-sm font-bold text-amber-900 mb-1">ID Activation Required</h4>
                <p className="text-[12px] text-amber-800/80 leading-relaxed mb-3">
                  To start earning, please pay ৳260 to: <br/>
                  <span className="font-bold">01308042526 (Bkash/Nagad)</span>
                </p>
                <p className="text-[11px] text-amber-600 font-medium italic">Admin will activate your ID within 24 hours.</p>
              </div>
            </div>
          </Card>
        )}

        <div className="flex items-center justify-between pt-2">
          <h4 className="text-sm font-bold text-gray-900">Quick Actions</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setView('withdraw')} className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm active:bg-gray-50 transition-colors">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center"><Wallet className="w-5 h-5 text-emerald-600" /></div>
            <span className="text-xs font-bold text-gray-700">Withdraw</span>
          </button>
          <button onClick={() => setView('profile')} className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm active:bg-gray-50 transition-colors">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-blue-600" /></div>
            <span className="text-xs font-bold text-gray-700">Profile</span>
          </button>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-8 py-3 flex justify-between items-center z-50">
        <button onClick={() => setView('dashboard')} className="flex flex-col items-center gap-1 text-emerald-600">
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Home</span>
        </button>
        <button onClick={() => setView('withdraw')} className="flex flex-col items-center gap-1 text-gray-400">
          <Wallet className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Wallet</span>
        </button>
        <button onClick={() => setView('profile')} className="flex flex-col items-center gap-1 text-gray-400">
          <User className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">User</span>
        </button>
      </div>
    </div>
  );

  const renderProfileView = () => {
    const [name, setName] = useState(user?.name || '');
    const [pic, setPic] = useState<string | null>(user?.profile_pic || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPic(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white p-6 border-b border-gray-100 flex items-center gap-4">
          <button onClick={() => setView('dashboard')} className="p-2 -ml-2 text-gray-400"><ArrowRight className="w-5 h-5 rotate-180" /></button>
          <h2 className="text-lg font-bold text-gray-900">Edit Profile</h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                {pic ? (
                  <img src={pic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-gray-300" />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full shadow-lg border-2 border-white"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
          </div>

          <div className="space-y-4">
            <Input label="Full Name" value={name} onChange={(e: any) => setName(e.target.value)} />
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-gray-700 ml-1">Mobile Number</label>
              <div className="w-full h-11 bg-gray-100 border border-gray-200 rounded-xl text-sm px-4 flex items-center text-gray-500">
                {user?.phone}
              </div>
            </div>
            <Button onClick={() => handleProfileUpdate(name, pic)}>Save Changes</Button>
            <Button variant="ghost" onClick={logout} className="text-rose-500 hover:bg-rose-50">
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderWithdrawView = () => {
    useEffect(() => {
      fetchWithdrawHistory();
    }, []);

    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white p-6 border-b border-gray-100 flex items-center gap-4">
          <button onClick={() => setView('dashboard')} className="p-2 -ml-2 text-gray-400"><ArrowRight className="w-5 h-5 rotate-180" /></button>
          <h2 className="text-lg font-bold text-gray-900">Withdraw Funds</h2>
        </div>

        <div className="p-6 space-y-6">
          <Card className="bg-emerald-600 text-white border-none">
            <p className="text-[11px] text-emerald-100 uppercase font-bold mb-1">Available Balance</p>
            <h2 className="text-2xl font-bold">৳ {user?.balance.toFixed(2)}</h2>
          </Card>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-gray-700 ml-1">Method</label>
              <div className="grid grid-cols-2 gap-3">
                {['Bkash', 'Nagad'].map(m => (
                  <button 
                    key={m}
                    onClick={() => setWithdrawForm({ ...withdrawForm, method: m })}
                    className={`h-11 rounded-xl border-2 font-bold text-xs transition-all ${withdrawForm.method === m ? 'border-emerald-600 bg-emerald-50 text-emerald-600' : 'border-gray-100 bg-white text-gray-400'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <Input 
              label="Amount (Min 100)" 
              type="number" 
              placeholder="0.00" 
              value={withdrawForm.amount}
              onChange={(e: any) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
            />
            <Input 
              label="Receiver Number" 
              placeholder="01XXXXXXXXX" 
              value={withdrawForm.number}
              onChange={(e: any) => setWithdrawForm({ ...withdrawForm, number: e.target.value })}
            />
            <Button onClick={handleWithdraw} loading={loading}>Request Withdrawal</Button>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-900">Withdrawal History</h4>
            {withdrawHistory.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No history found</p>
            ) : (
              <div className="space-y-3">
                {withdrawHistory.map((w) => (
                  <Card key={w.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${w.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : w.status === 'Rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                        {w.status === 'Paid' ? <CheckCircle className="w-4 h-4" /> : w.status === 'Rejected' ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">৳ {w.amount}</p>
                        <p className="text-[10px] text-gray-500">{w.method} • {new Date(w.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${w.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : w.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {w.status}
                    </span>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- Admin Views ---

  const renderAdminLoginView = () => (
    <div className="min-h-screen bg-gray-900 p-6 flex flex-col justify-center">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white">Admin Portal</h2>
        <p className="text-gray-400 text-xs mt-1">Authorized access only</p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Username</label>
          <input 
            className="w-full h-11 bg-gray-800 border border-gray-700 rounded-xl text-sm px-4 text-white focus:outline-none focus:border-emerald-500"
            value={adminLoginForm.username}
            onChange={(e: any) => setAdminLoginForm({ ...adminLoginForm, username: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Password</label>
          <input 
            type="password"
            className="w-full h-11 bg-gray-800 border border-gray-700 rounded-xl text-sm px-4 text-white focus:outline-none focus:border-emerald-500"
            value={adminLoginForm.password}
            onChange={(e: any) => setAdminLoginForm({ ...adminLoginForm, password: e.target.value })}
          />
        </div>
        <Button onClick={handleAdminLogin} loading={loading} className="bg-emerald-500 hover:bg-emerald-600">Enter Dashboard</Button>
        <button onClick={() => setView('login')} className="w-full text-xs text-gray-500 mt-4">Back to User Login</button>
      </div>
    </div>
  );

  const renderAdminDashboardView = () => (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gray-900 text-white p-6 rounded-b-[32px]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Admin Panel</h2>
          <button onClick={logout} className="p-2 bg-white/10 rounded-lg"><LogOut className="w-5 h-5" /></button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Total Users</p>
            <h3 className="text-xl font-bold">{adminStats?.totalUsers || 0}</h3>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Active IDs</p>
            <h3 className="text-xl font-bold">{adminStats?.activeUsers || 0}</h3>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Referrals</p>
            <h3 className="text-xl font-bold">{adminStats?.totalReferrals || 0}</h3>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Pending W/D</p>
            <h3 className="text-xl font-bold text-amber-400">{adminStats?.pendingWithdrawals || 0}</h3>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <h4 className="text-sm font-bold text-gray-900">Management</h4>
        <div className="grid grid-cols-1 gap-3">
          <button onClick={() => setView('admin-users')} className="w-full p-4 bg-white rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm active:bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg"><Users className="w-5 h-5 text-blue-600" /></div>
              <span className="text-sm font-bold text-gray-700">User Management</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>
          <button onClick={() => setView('admin-withdrawals')} className="w-full p-4 bg-white rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm active:bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg"><Wallet className="w-5 h-5 text-emerald-600" /></div>
              <span className="text-sm font-bold text-gray-700">Withdraw Requests</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderAdminUsersView = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredUsers = adminUsers.filter(u => u.phone.includes(searchTerm) || u.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white p-6 border-b border-gray-100 flex items-center gap-4 sticky top-0 z-10">
          <button onClick={() => setView('admin-dashboard')} className="p-2 -ml-2 text-gray-400"><ArrowRight className="w-5 h-5 rotate-180" /></button>
          <h2 className="text-lg font-bold text-gray-900">Users ({adminUsers.length})</h2>
        </div>

        <div className="p-4">
          <Input 
            placeholder="Search by name or phone..." 
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            className="mb-4"
          />

          <div className="space-y-3">
            {filteredUsers.map((u) => (
              <Card key={u.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                      {u.profile_pic ? <img src={u.profile_pic} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-gray-400" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{u.name}</h4>
                      <p className="text-[11px] text-gray-500">{u.phone} • {u.refer_code}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${u.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {u.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-3 border-y border-gray-50">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Balance</p>
                    <p className="text-sm font-bold text-gray-900">৳ {u.balance}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Referrals</p>
                    <p className="text-sm font-bold text-gray-900">{u.referral_count}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {u.status === 'Pending' ? (
                    <Button onClick={() => updateAdminUserStatus(u.id, 'Active')} className="h-9 text-xs">Activate ID</Button>
                  ) : (
                    <Button variant="danger" onClick={() => updateAdminUserStatus(u.id, 'Pending')} className="h-9 text-xs">Deactivate</Button>
                  )}
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        const amt = prompt('Amount to add:');
                        if (amt) fetch('/api/admin/user/balance', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId: u.id, amount: Number(amt), type: 'add' })
                        }).then(() => fetchAdminData());
                      }}
                      className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center active:scale-90"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        const amt = prompt('Amount to deduct:');
                        if (amt) fetch('/api/admin/user/balance', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId: u.id, amount: Number(amt), type: 'deduct' })
                        }).then(() => fetchAdminData());
                      }}
                      className="w-9 h-9 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center active:scale-90"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderAdminWithdrawalsView = () => (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white p-6 border-b border-gray-100 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => setView('admin-dashboard')} className="p-2 -ml-2 text-gray-400"><ArrowRight className="w-5 h-5 rotate-180" /></button>
        <h2 className="text-lg font-bold text-gray-900">Withdraw Requests</h2>
      </div>

      <div className="p-4 space-y-3">
        {adminWithdrawals.map((w) => (
          <Card key={w.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-900">{w.user_name}</h4>
                <p className="text-[11px] text-gray-500">{w.user_phone}</p>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${w.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : w.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                {w.status}
              </span>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl flex justify-between items-center">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Amount</p>
                <p className="text-lg font-bold text-emerald-600">৳ {w.amount}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-bold uppercase">{w.method}</p>
                <p className="text-sm font-bold text-gray-900">{w.number}</p>
              </div>
            </div>

            {w.status === 'Pending' && (
              <div className="flex gap-2">
                <Button onClick={() => updateAdminWithdrawStatus(w.id, 'Paid')} className="h-9 text-xs">Mark as Paid</Button>
                <Button variant="danger" onClick={() => updateAdminWithdrawStatus(w.id, 'Rejected')} className="h-9 text-xs">Reject</Button>
              </div>
            )}
          </Card>
        ))}
        {adminWithdrawals.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-12">No requests found</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-[420px] mx-auto min-h-screen bg-white relative shadow-2xl overflow-x-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {view === 'splash' && renderSplashView()}
          {view === 'login' && renderLoginView()}
          {view === 'register' && renderRegisterView()}
          {view === 'dashboard' && renderDashboardView()}
          {view === 'profile' && renderProfileView()}
          {view === 'withdraw' && renderWithdrawView()}
          {view === 'admin-login' && renderAdminLoginView()}
          {view === 'admin-dashboard' && renderAdminDashboardView()}
          {view === 'admin-users' && renderAdminUsersView()}
          {view === 'admin-withdrawals' && renderAdminWithdrawalsView()}
        </motion.div>
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl shadow-lg z-[100] flex items-center gap-2 whitespace-nowrap ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}
          >
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span className="text-xs font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
