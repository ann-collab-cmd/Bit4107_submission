import React, { useState, useEffect } from 'react';
import { useEpicReadsStore } from './store';
import { SplashView } from './components/SplashView';
import { CustomerHome } from './components/CustomerHome';
import { AdminDashboard } from './components/AdminDashboard';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  User, 
  Lock, 
  Phone, 
  Mail, 
  ArrowLeft, 
  ShieldAlert, 
  Sparkles, 
  Smartphone, 
  Compass, 
  CheckCircle,
  Eye,
  EyeOff,
  Instagram,
  Facebook,
  Twitter
} from 'lucide-react';

type ScreenType = 'splash' | 'login' | 'register' | 'admin_login' | 'customer_home' | 'admin_home';

export default function App() {
  const store = useEpicReadsStore();
  const { currentUser, isAdminMode } = store;

  // Active screen routing controllers
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('splash');
  const [phoneFrameMode, setPhoneFrameMode] = useState<boolean>(true);

  // Authentication Fields states
  const [authForm, setAuthForm] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Automatically route if there's a cached active session
  useEffect(() => {
    if (isAdminMode) {
      setCurrentScreen('admin_home');
    } else if (currentUser) {
      setCurrentScreen('customer_home');
    } else {
      setCurrentScreen('splash');
    }
  }, [currentUser, isAdminMode]);

  // Handle customer account register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    // Enforce basic inputs validation
    if (!authForm.fullName.trim() || !authForm.phoneNumber.trim() || !authForm.password.trim()) {
      setAuthError('Please fill in all requested fields.');
      return;
    }

    if (authForm.password.length < 6) {
      setAuthError('Security Password must be at least 6 characters.');
      return;
    }

    if (authForm.password !== confirmPassword) {
      setAuthError('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    const cleanedPhone = authForm.phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (cleanedPhone.length < 8 || cleanedPhone.length > 20) {
      setAuthError('Please enter a valid phone number (between 8 and 20 digits).');
      return;
    }

    const regResult = await store.registerUser({
      uid: `cust-${Date.now()}`,
      fullName: authForm.fullName,
      phoneNumber: authForm.phoneNumber,
      email: '', // set synthetically in store
      createdAt: new Date().toISOString()
    }, authForm.password);

    if (regResult.success) {
      setAuthSuccess('Account created successfully! Logging you in...');
      setTimeout(() => {
        setAuthSuccess(null);
        setCurrentScreen('customer_home');
      }, 1500);
    } else {
      setAuthError(regResult.error || 'Registration failed. Try registering again.');
    }
  };

  // Handle customer phone-password login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!authForm.phoneNumber.trim() || !authForm.password.trim()) {
      setAuthError('Please enter your phone number and password.');
      return;
    }

    // Direct secret backdoor login for James from the reader sign-in form
    const inputVal = authForm.phoneNumber.trim().toLowerCase();
    if (
      (inputVal === 'james@epicreads.com' || inputVal === 'admin' || inputVal === 'mainaann844@gmail.com') &&
      (authForm.password === 'admin' || authForm.password === 'admin2026')
    ) {
      const loginOk = await store.loginAdmin('admin', authForm.password);
      if (loginOk) {
        setAuthSuccess('Welcome back James! Loading your workspace...');
        setTimeout(() => {
          setAuthSuccess(null);
          setCurrentScreen('admin_home');
        }, 1000);
        return;
      }
    }

    const res = await store.loginUser(authForm.phoneNumber, authForm.password);
    if (res.success) {
      setAuthSuccess('Logged in successfully!');
      setTimeout(() => {
        setAuthSuccess(null);
        setCurrentScreen('customer_home');
      }, 1000);
    } else {
      setAuthError(res.error || 'Invalid credentials. Registered user not found with this phone number.');
    }
  };

  // Handle store administrator authorization login
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!authForm.fullName.trim() || !authForm.password.trim()) {
      setAuthError('Please specify Admin Username and system passcode.');
      return;
    }

    // Passcode controls: checks "admin" or "admin2026"
    const loginOk = await store.loginAdmin(authForm.fullName, authForm.password);
    if (loginOk) {
      setAuthSuccess('Authorized Admin Session unlocked!');
      setTimeout(() => {
        setAuthSuccess(null);
        setCurrentScreen('admin_home');
      }, 1000);
    } else {
      setAuthError('Unauthorized. Check Username / Admin Passcode.');
    }
  };

  const handleBackToSplash = () => {
    setAuthError(null);
    setAuthSuccess(null);
    setConfirmPassword('');
    setAuthForm({ fullName: '', phoneNumber: '', email: '', password: '' });
    setCurrentScreen('splash');
  };

  const SocialLoginsBlock = () => {
    const [socialLoading, setSocialLoading] = useState<string | null>(null);

    const handleSocialIn = async (provName: 'google' | 'facebook' | 'x' | 'instagram') => {
      setSocialLoading(provName);
      setAuthError(null);
      setAuthSuccess(null);
      try {
        const res = await store.loginSocial(provName);
        if (res.success) {
          if (res.error) {
            setAuthError(res.error);
          } else {
            setAuthSuccess(`Logged in successfully with ${provName.toUpperCase()}!`);
          }
          setTimeout(() => {
            setAuthSuccess(null);
            setCurrentScreen('customer_home');
          }, 3500);
        } else {
          setAuthError(res.error || `Failed to authenticate via ${provName.toUpperCase()}.`);
        }
      } catch (err: any) {
        setAuthError(err?.message || `Social login session failed.`);
      } finally {
        setSocialLoading(null);
      }
    };

    return (
      <div className="space-y-4 pt-1 pb-2">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <span className="relative bg-white px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Or continue with
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          <button
            type="button"
            disabled={socialLoading !== null}
            onClick={() => handleSocialIn('google')}
            className="flex items-center justify-center py-3 bg-slate-50 hover:bg-slate-100/85 border border-slate-100 rounded-xl cursor-pointer hover:border-slate-200 transition-all active:scale-[0.98] disabled:opacity-50"
            title="Sign in with Google"
          >
            {socialLoading === 'google' ? (
              <span className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-indigo-600 animate-spin"></span>
            ) : (
              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.6 15.02 1 12 1 7.35 1 3.39 3.67 1.48 7.57l3.86 3c.9-2.7 3.42-4.53 6.66-4.53z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.44c-.28 1.5-.1.1-1.12 2.33l3.86 3c2.26-2.09 3.42-5.18 3.42-8.57z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.34 10.57A7.16 7.16 0 0 1 5 12c0 .5.06 1 .18 1.48l-3.86 3c-.5-1-.8-2.12-.8-3.48 0-1.36.3-2.48.8-3.48l3.86 3z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.86-3c-1.1.74-2.5 1.18-4.1 1.18-3.24 0-5.76-1.83-6.66-4.53L1.48 16.43C3.39 20.33 7.35 23 12 23z"
                />
              </svg>
            )}
          </button>

          <button
            type="button"
            disabled={socialLoading !== null}
            onClick={() => handleSocialIn('facebook')}
            className="flex items-center justify-center py-3 bg-slate-50 hover:bg-slate-100/85 border border-slate-100 rounded-xl cursor-pointer hover:border-slate-200 transition-all active:scale-[0.98] disabled:opacity-50 text-blue-600"
            title="Sign in with Facebook"
          >
            {socialLoading === 'facebook' ? (
              <span className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-indigo-600 animate-spin"></span>
            ) : (
              <Facebook className="h-4.5 w-4.5 fill-current" />
            )}
          </button>

          <button
            type="button"
            disabled={socialLoading !== null}
            onClick={() => handleSocialIn('x')}
            className="flex items-center justify-center py-3 bg-slate-50 hover:bg-slate-100/85 border border-slate-100 rounded-xl cursor-pointer hover:border-slate-200 transition-all active:scale-[0.98] disabled:opacity-50 text-slate-900"
            title="Sign in with X"
          >
            {socialLoading === 'x' ? (
              <span className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-indigo-600 animate-spin"></span>
            ) : (
              <span className="text-xs font-black tracking-tighter">X</span>
            )}
          </button>

          <button
            type="button"
            disabled={socialLoading !== null}
            onClick={() => handleSocialIn('instagram')}
            className="flex items-center justify-center py-3 bg-slate-50 hover:bg-slate-100/85 border border-slate-100 rounded-xl cursor-pointer hover:border-slate-200 transition-all active:scale-[0.98] disabled:opacity-50 text-pink-600"
            title="Sign in with Instagram"
          >
            {socialLoading === 'instagram' ? (
              <span className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-indigo-600 animate-spin"></span>
            ) : (
              <Instagram className="h-4.5 w-4.5" />
            )}
          </button>
        </div>
      </div>
    );
  };

  const getScreenContent = () => {
    switch (currentScreen) {
      case 'splash':
        return (
          <SplashView 
            onGetStarted={() => {
              setAuthError(null);
              // Route to customer registration
              setCurrentScreen('register');
            }}
            onSignInClick={() => {
              setAuthError(null);
              setCurrentScreen('login');
            }}
            onAdminClick={() => {
              setAuthError(null);
              // Set default display for admin user
              setAuthForm(prev => ({ ...prev, fullName: 'admin', password: '' }));
              setCurrentScreen('admin_login');
            }}
          />
        );

      case 'login':
        return (
          <div className="flex h-full flex-col justify-between bg-white px-6 py-6 text-left select-none overflow-y-auto">
            <div className="space-y-6 pt-2">
              <button 
                onClick={handleBackToSplash}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>

              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Log In</h2>
                <p className="text-xs text-slate-500">Log in to browse my hand-picked shelves, save books for later, or buy copies.</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">PHONE NUMBER</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={authForm.phoneNumber}
                        onChange={(e) => setAuthForm({ ...authForm, phoneNumber: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-705 outline-none font-medium focus:border-indigo-500"
                        placeholder="e.g. 0712345678"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">PASSWORD</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={authForm.password}
                        onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-10 py-3 text-xs text-slate-705 outline-none font-medium focus:border-indigo-500"
                        placeholder="••••••••"
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {authError && (
                  <div className="p-3 bg-red-50 text-red-650 rounded-xl text-xs font-semibold">
                    {authError}
                  </div>
                )}

                {authSuccess && (
                  <div className="p-3 bg-green-50 text-green-700 rounded-xl text-xs font-semibold">
                    {authSuccess}
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full py-3.5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/15 cursor-pointer text-center select-none"
                >
                  Log In
                </button>
              </form>

              <SocialLoginsBlock />
            </div>

            <div className="text-center pt-4">
              <button 
                onClick={() => {
                  setAuthError(null);
                  setCurrentScreen('register');
                }}
                className="text-xs text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                Don't have an account? <span className="font-bold text-indigo-600 underline underline-offset-2">Register here</span>
              </button>
            </div>
          </div>
        );

      case 'register':
        return (
          <div className="flex h-full flex-col justify-between bg-white px-6 py-6 text-left select-none overflow-y-auto">
            <div className="space-y-5 pt-2">
              <button 
                onClick={handleBackToSplash}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>

              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Make a New Account!</h2>
                <p className="text-xs text-slate-500">Create an account to browse my collection and order books directly from me.</p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-400 mb-1">YOUR FULL NAME</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={authForm.fullName}
                      onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-705 outline-none font-medium focus:border-indigo-500"
                      placeholder="e.g. John Kamau"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-400 mb-1">YOUR PHONE NUMBER</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={authForm.phoneNumber}
                      onChange={(e) => setAuthForm({ ...authForm, phoneNumber: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-750 outline-none font-medium focus:border-indigo-500"
                      placeholder="e.g. 0712345678"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-400 mb-1">CHOOSE A PASSWORD</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={authForm.password}
                      onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-10 py-3 text-xs text-slate-755 outline-none font-medium focus:border-indigo-500"
                      placeholder="•••••••• (Min 6 chars)"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-400 mb-1">CONFIRM YOUR PASSWORD</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-755 outline-none font-medium focus:border-indigo-500"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                {authError && (
                  <div className="p-2.5 bg-red-50 text-red-650 rounded-lg text-xs font-semibold">
                    {authError}
                  </div>
                )}

                {authSuccess && (
                  <div className="p-2.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold">
                    {authSuccess}
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full py-3.5 mt-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/15 cursor-pointer text-center"
                >
                  Make Account!
                </button>
              </form>

              <SocialLoginsBlock />
            </div>

            <div className="text-center pt-3">
              <button 
                onClick={() => {
                  setAuthError(null);
                  setCurrentScreen('login');
                }}
                className="text-xs text-slate-550 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                Already have an account? <span className="font-bold text-indigo-600 underline underline-offset-2">Log In</span>
              </button>
            </div>
          </div>
        );

      case 'admin_login':
        return (
          <div className="flex h-full flex-col justify-between bg-white px-6 py-6 text-left select-none overflow-y-auto">
            <div className="space-y-6 pt-2">
              <button 
                onClick={handleBackToSplash}
                className="flex items-center gap-1 text-xs font-semibold text-slate-550 hover:text-indigo-600 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" /> Cancel
              </button>

              <div className="space-y-2">
                <div className="flex items-center gap-2 p-1.5 rounded-lg bg-rose-50 text-rose-600 w-fit border border-rose-100">
                  <ShieldAlert className="h-4 w-4" />
                  <span className="text-[10px] uppercase font-black tracking-widest">My Workspace Security Gate</span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">James' Workspace</h2>
                <p className="text-xs text-slate-500">Provide password to access my bookstore management dashboard.</p>
              </div>

              <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">USER NAME</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={authForm.fullName}
                        onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-705 outline-none font-medium focus:border-rose-500"
                        placeholder="admin"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">SECRET PASSWORD</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="password" 
                        value={authForm.password}
                        onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-705 outline-none font-medium focus:border-rose-500"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                </div>

                {authError && (
                  <div className="p-3 bg-rose-50 text-rose-650 rounded-xl text-xs font-semibold">
                    {authError}
                  </div>
                )}

                {authSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold">
                    {authSuccess}
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full py-3.5 mt-2 bg-slate-900 hover:bg-rose-950 text-white font-bold rounded-xl text-xs cursor-pointer transition-all border border-slate-800"
                >
                  Unlock My Workspace
                </button>
              </form>
            </div>

            <div className="text-center p-3 text-[10px] text-slate-400 font-semibold bg-slate-50 rounded-xl border border-dashed border-slate-100 max-w-sm mx-auto">
              Only I (James) can access these tools to manage my shop. General user accounts are restricted.
            </div>
          </div>
        );

      case 'customer_home':
        return <CustomerHome store={store} />;

      case 'admin_home':
        return <AdminDashboard store={store} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0c0a21] text-slate-800 font-sans flex flex-col md:flex-row antialiased select-none">
      
      {/* LEFT COLUMN: DESKTOP ONLY WELCOME AND INFO PANEL */}
      <div className="hidden md:flex md:w-3/5 lg:w-4/5 flex-col justify-between p-12 text-white relative overflow-hidden shrink-0 self-stretch">
        {/* Abstract design elements */}
        <div className="absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute left-10 bottom-10 h-[300px] w-[300px] rounded-full bg-purple-500/10 blur-[100px] pointer-events-none"></div>

        {/* Top welcome */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2.5 rounded-2xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/20">
            <BookOpen className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight font-serif">EpicReads Portal</h1>
            <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Mobile-First BookStore &bull; Nairobi</p>
          </div>
        </div>

        {/* Informational pitch */}
        <div className="my-auto space-y-6 max-w-xl relative z-10">
          <div className="inline-flex items-center gap-1 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 rounded-full px-3.5 py-1 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> 2026 Production Ready Release
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight font-sans leading-none">
            Browse. Order.<br />
            Hold. <span className="text-indigo-400">Save Lives.</span>
          </h2>
          <p className="text-sm text-indigo-100/80 leading-relaxed font-medium">
            This digital bookstore portal lets my clients browse available books, order hardcovers for direct delivery in Nairobi, reserve paperbacks for prompt pick-up, or request specialty imported volumes safely.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 text-xs font-semibold text-indigo-200">
            <div className="space-y-1.5 p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-indigo-400 font-black tracking-widest text-[9.5px] block">CLIENT BENEFITS</span>
              <p className="font-medium text-white/90">Instantly browse physical items or buy digital soft PDF copies in KES.</p>
            </div>
            <div className="space-y-1.5 p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-rose-400 font-black tracking-widest text-[9.5px] block">ADMIN POWERS</span>
              <p className="font-medium text-white/90">Full inventory control, orders state tracking, logs lists, and PDF toggle parameters.</p>
            </div>
          </div>
        </div>

        {/* Simulator layout controls */}
        <div className="relative z-10 flex items-center justify-between pt-6 border-t border-white/10">
          <div>
            <p className="text-[11px] text-indigo-300 font-bold uppercase tracking-wider">Device Simulated Screen Setup</p>
            <p className="text-xs text-white/60">Toggle to view the response full page or inside an elegant iPhone preview.</p>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => setPhoneFrameMode(true)}
              className={`flex items-center gap-1.5 py-2 px-3 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                phoneFrameMode 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-white/5 text-indigo-200 hover:bg-white/10'
              }`}
            >
              <Smartphone className="h-4 w-4" /> iPhone Frame
            </button>
            <button
              onClick={() => setPhoneFrameMode(false)}
              className={`flex items-center gap-1.5 py-2 px-3 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                !phoneFrameMode 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-white/5 text-indigo-200 hover:bg-white/10'
              }`}
            >
              <Compass className="h-4 w-4" /> Fullscreen Web
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: THE MOCK IOS DEVICE CONTAINER / FULLSCREEN CORE APP */}
      <div className={`flex flex-col items-center justify-center flex-1 self-stretch relative ${
        phoneFrameMode ? 'p-4 md:p-8' : 'p-0'
      }`}>
        {phoneFrameMode ? (
          /* High Fidelity iPhone Frame */
          <div className="relative w-full max-w-[390px] h-[780px] rounded-[48px] border-[10px] border-[#2e2b40] bg-[#1e1a38] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden shrink-0 flex flex-col ring-8 ring-[#2e2b40]/10 ring-offset-2 ring-offset-[#1e1a38]">
            {/* Top Speaker Bezel */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-32 h-4.5 bg-black rounded-full z-40 flex items-center justify-center">
              {/* Camera Lens simulator */}
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 absolute right-4"></div>
              {/* Speaker mesh */}
              <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
            </div>

            {/* Simulated Time & Indicators bar */}
            <div className="h-6.5 bg-white text-slate-800 text-[10px] font-black tracking-tight px-6 pt-3 shrink-0 flex justify-between select-none z-30">
              <span className="font-bold">15:16</span>
              <div className="flex items-center gap-1 font-bold">
                <span>5G &bull;</span>
                <span>84%</span>
              </div>
            </div>

            {/* Frame Core Workspace */}
            <div className="flex-1 w-full bg-white text-slate-800 overflow-hidden relative">
              {getScreenContent()}
            </div>

            {/* Bottom Home Indicator Line */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-400 rounded-full z-40"></div>
          </div>
        ) : (
          /* Standard Fullscreen Web page style */
          <div className="w-full h-full min-h-screen bg-white">
            {getScreenContent()}
          </div>
        )}
      </div>

    </div>
  );
}
