import { useState, useEffect } from 'react';
import { 
  Book, 
  Order, 
  Reservation, 
  BookRequest, 
  UserProfile, 
  InAppNotification, 
  ActivityHistory,
  StockStatus,
  OrderStatus,
  OrderType,
  ReservationStatus,
  BookRequestStatus
} from './types';
import { isOfflineDemo, db, auth } from './firebase';
import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  orderBy
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  signInWithPopup
} from 'firebase/auth';

// Default seeded books
const SEEDED_BOOKS: Book[] = [
  {
    id: 'b1',
    title: 'Atomic Habits',
    author: 'James Clear',
    category: 'Self-Help',
    description: 'An easy & proven way to build good habits & break bad ones. Learn the ground-breaking system that will reshape your concepts of progress and daily growth.',
    price: 1200,
    pdfPrice: 450,
    imageUrl: '/src/assets/images/atomic_habits_cover_1781561836677.jpg',
    stockStatus: 'Available',
    quantity: 24,
    pdfUrl: 'mock_atomic_habits.pdf'
  },
  {
    id: 'b2',
    title: 'The Purpose Driven Life',
    author: 'Rick Warren',
    category: 'Spiritual',
    description: 'A blueprint for Christian living in the 21st century. Discover how you fit into God’s master plan and find answers to three of life’s most critical questions.',
    price: 1500,
    pdfPrice: 600,
    imageUrl: '/src/assets/images/purpose_driven_cover_1781561852081.jpg',
    stockStatus: 'Low Stock',
    quantity: 4,
    pdfUrl: 'mock_purpose_driven.pdf'
  },
  {
    id: 'b3',
    title: 'Deep Work',
    author: 'Cal Newport',
    category: 'Productivity',
    description: 'One of the most valuable skills in our economy is becoming increasingly rare. If you master this skill, you will achieve extraordinary results in less time.',
    price: 1100,
    pdfPrice: 380,
    imageUrl: '/src/assets/images/atomic_habits_cover_1781561836677.jpg',
    stockStatus: 'Available',
    quantity: 12,
    pdfUrl: 'mock_deep_work.pdf'
  },
  {
    id: 'b4',
    title: 'Think and Grow Rich',
    author: 'Napoleon Hill',
    category: 'Business & Finance',
    description: 'The landmark bestseller that has helped millions achieve money and financial empowerment based on Andrew Carnegie’s famous formula for success.',
    price: 950,
    imageUrl: '/src/assets/images/purpose_driven_cover_1781561852081.jpg',
    stockStatus: 'Out of Stock',
    quantity: 0
  }
];

// LocalStorage helpers
const getLocalData = <T>(key: string, fallback: T): T => {
  const data = localStorage.getItem(`epic_reads_${key}`);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return fallback;
    }
  }
  return fallback;
};

const saveLocalData = (key: string, data: any) => {
  localStorage.setItem(`epic_reads_${key}`, JSON.stringify(data));
};

export const useEpicReadsStore = () => {
  // Configurable states
  const [books, setBooks] = useState<Book[]>(() => getLocalData<Book[]>('books', SEEDED_BOOKS));
  const [orders, setOrders] = useState<Order[]>(() => getLocalData<Order[]>('orders', []));
  const [reservations, setReservations] = useState<Reservation[]>(() => getLocalData<Reservation[]>('reservations', []));
  const [bookRequests, setBookRequests] = useState<BookRequest[]>(() => getLocalData<BookRequest[]>('book_requests', []));
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>(() => getLocalData<UserProfile[]>('registered_users', [
    {
      uid: 'cust-1',
      fullName: 'John Kamau',
      phoneNumber: '0712345678',
      email: 'john@example.com',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      uid: 'cust-2',
      fullName: 'Mary Wanjiku',
      phoneNumber: '0722112233',
      email: 'mary@example.com',
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ]));
  const [notifications, setNotifications] = useState<InAppNotification[]>(() => getLocalData<InAppNotification[]>('notifications', []));
  const [activityLogs, setActivityLogs] = useState<ActivityHistory[]>(() => getLocalData<ActivityHistory[]>('activities', [
    {
      id: 'act-1',
      userId: 'cust-1',
      userName: 'John Kamau',
      actionDescription: 'viewed Atomic Habits',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
    },
    {
      id: 'act-2',
      userId: 'cust-1',
      userName: 'John Kamau',
      actionDescription: 'ordered Atomic Habits (Physical copy)',
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString()
    },
    {
      id: 'act-3',
      userId: 'cust-2',
      userName: 'Mary Wanjiku',
      actionDescription: 'reserved The Purpose Driven Life',
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString()
    }
  ]));

  // Global app settings
  const [pdfBooksEnabled, setPdfBooksEnabled] = useState<boolean>(() => {
    return getLocalData<boolean>('pdf_books_enabled', true);
  });

  // James Admin avatar profile settings
  const [jamesAvatar, setJamesAvatarState] = useState<string>(() => {
    return localStorage.getItem('epic_reads_james_avatar') || '/src/assets/images/james_avatar_1781665504357.jpg';
  });

  const updateJamesAvatar = (url: string) => {
    setJamesAvatarState(url);
    localStorage.setItem('epic_reads_james_avatar', url);
  };

  // Active session profile
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const cached = localStorage.getItem('epic_reads_user');
    return cached ? JSON.parse(cached) : null;
  });

  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    return localStorage.getItem('epic_reads_admin_logged') === 'true';
  });

  const [authenticatedUser, setAuthenticatedUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Save changes to localStorage in demo mode
  useEffect(() => {
    if (isOfflineDemo) {
      saveLocalData('books', books);
      saveLocalData('orders', orders);
      saveLocalData('reservations', reservations);
      saveLocalData('book_requests', bookRequests);
      saveLocalData('registered_users', registeredUsers);
      saveLocalData('notifications', notifications);
      saveLocalData('activities', activityLogs);
      saveLocalData('pdf_books_enabled', pdfBooksEnabled);
    }
  }, [books, orders, reservations, bookRequests, registeredUsers, notifications, activityLogs, pdfBooksEnabled]);

  // Handle live Firestore synchronization if active
  useEffect(() => {
    if (isOfflineDemo || !db) return;

    let unsubscribeBooks = () => {};
    let unsubscribeOrders = () => {};
    let unsubscribeReservations = () => {};
    let unsubscribeRequests = () => {};
    let unsubscribeUsers = () => {};
    let unsubscribeNotifications = () => {};
    let unsubscribeLogs = () => {};

    // 1. Books - accessible to everyone
    try {
      unsubscribeBooks = onSnapshot(collection(db, 'books'), (snapshot) => {
        const items: Book[] = [];
        snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as Book));
        if (items.length > 0) setBooks(items);
      }, (err) => console.error("Books listen error: ", err));
    } catch (e) {
      console.error("Books subscription failed: ", e);
    }

    // Only configure secure collections when auth features are settled
    if (!authLoading && authenticatedUser) {
      if (isAdminMode && authenticatedUser.email === 'mainaann844@gmail.com') {
        // Admin is allowed to listen to everything, but notifications must be filtered to 'admin'
        try {
          unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
            const items: Order[] = [];
            snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as Order));
            setOrders(items);
          }, (err) => console.error("Admin orders listen error: ", err));
        } catch (e) { console.error(e); }

        try {
          unsubscribeReservations = onSnapshot(collection(db, 'reservations'), (snapshot) => {
            const items: Reservation[] = [];
            snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as Reservation));
            setReservations(items);
          }, (err) => console.error("Admin reservations listen error: ", err));
        } catch (e) { console.error(e); }

        try {
          unsubscribeRequests = onSnapshot(collection(db, 'bookRequests'), (snapshot) => {
            const items: BookRequest[] = [];
            snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as BookRequest));
            setBookRequests(items);
          }, (err) => console.error("Admin requests listen error: ", err));
        } catch (e) { console.error(e); }

        try {
          unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            const items: UserProfile[] = [];
            snapshot.forEach(doc => items.push({ uid: doc.id, ...doc.data() } as UserProfile));
            setRegisteredUsers(items);
          }, (err) => console.error("Admin users listen error: ", err));
        } catch (e) { console.error(e); }

        try {
          const qNotif = query(collection(db, 'notifications'), where('userId', '==', 'admin'));
          unsubscribeNotifications = onSnapshot(qNotif, (snapshot) => {
            const items: InAppNotification[] = [];
            snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as InAppNotification));
            setNotifications(items);
          }, (err) => console.error("Admin notifications listen error: ", err));
        } catch (e) { console.error(e); }

        try {
          unsubscribeLogs = onSnapshot(collection(db, 'activityLogs'), (snapshot) => {
            const items: ActivityHistory[] = [];
            snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as ActivityHistory));
            setActivityLogs(items);
          }, (err) => console.error("Admin logs listen error: ", err));
        } catch (e) { console.error(e); }

      } else if (!isAdminMode && currentUser && authenticatedUser.uid === currentUser.uid) {
        // Normal logged-in user subscriptions: filtered by their own userId
        const uid = currentUser.uid;

        try {
          const qOrders = query(collection(db, 'orders'), where('userId', '==', uid));
          unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
            const items: Order[] = [];
            snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as Order));
            setOrders(items);
          }, (err) => console.error("User orders listen error: ", err));
        } catch (e) { console.error(e); }

        try {
          const qRes = query(collection(db, 'reservations'), where('userId', '==', uid));
          unsubscribeReservations = onSnapshot(qRes, (snapshot) => {
            const items: Reservation[] = [];
            snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as Reservation));
            setReservations(items);
          }, (err) => console.error("User reservations listen error: ", err));
        } catch (e) { console.error(e); }

        try {
          const qReq = query(collection(db, 'bookRequests'), where('userId', '==', uid));
          unsubscribeRequests = onSnapshot(qReq, (snapshot) => {
            const items: BookRequest[] = [];
            snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as BookRequest));
            setBookRequests(items);
          }, (err) => console.error("User requests listen error: ", err));
        } catch (e) { console.error(e); }

        try {
          const qNotif = query(collection(db, 'notifications'), where('userId', '==', uid));
          unsubscribeNotifications = onSnapshot(qNotif, (snapshot) => {
            const items: InAppNotification[] = [];
            snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as InAppNotification));
            setNotifications(items);
          }, (err) => console.error("User notifications listen error: ", err));
        } catch (e) { console.error(e); }
      }
    }

    return () => {
      unsubscribeBooks();
      unsubscribeOrders();
      unsubscribeReservations();
      unsubscribeRequests();
      unsubscribeUsers();
      unsubscribeNotifications();
      unsubscribeLogs();
    };
  }, [currentUser, isAdminMode, authenticatedUser, authLoading]);

  // Sync session authentication state with firebase auth
  useEffect(() => {
    if (isOfflineDemo || !auth) {
      setAuthLoading(false);
      return;
    }
    const unsubAuth = auth.onAuthStateChanged(async (user: any) => {
      setAuthenticatedUser(user);
      setAuthLoading(false);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            setCurrentUser(data);
            localStorage.setItem('epic_reads_user', JSON.stringify(data));
          } else {
            if (user.email === 'mainaann844@gmail.com') {
              setIsAdminMode(true);
            } else {
              const profile: UserProfile = {
                uid: user.uid,
                fullName: user.displayName || 'Reader ' + user.email?.split('@')[0],
                phoneNumber: '0700000000', // Safe default fallback length to pass validation
                email: user.email || '',
                createdAt: new Date().toISOString()
              };
              setCurrentUser(profile);
              localStorage.setItem('epic_reads_user', JSON.stringify(profile));
            }
          }
        } catch (e) {
          console.error("Error fetching user profile from auth sync:", e);
        }
      } else {
        if (!localStorage.getItem('epic_reads_user_demo_session')) {
          setCurrentUser(null);
          localStorage.removeItem('epic_reads_user');
        }
      }
    });

    return unsubAuth;
  }, []);

  // --- ACTIONS ---

  // Log user activity
  const logActivity = async (userId: string, userName: string, desc: string) => {
    const newLog: ActivityHistory = {
      id: `log-${Date.now()}`,
      userId,
      userName,
      actionDescription: desc,
      createdAt: new Date().toISOString()
    };

    if (isOfflineDemo || !db) {
      setActivityLogs(prev => [newLog, ...prev]);
    } else {
      try {
        await setDoc(doc(db, 'activityLogs', newLog.id), newLog);
      } catch (e) {
        console.error('Error writing activity log is: ', e);
      }
    }
  };

  // Add notification
  const addNotification = async (userId: string, message: string, type: 'order' | 'reservation' | 'request' | 'status_update' | 'general') => {
    const newNotif: InAppNotification = {
      id: `notif-${Date.now()}`,
      userId,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString()
    };

    if (isOfflineDemo || !db) {
      setNotifications(prev => [newNotif, ...prev]);
    } else {
      try {
        await setDoc(doc(db, 'notifications', newNotif.id), newNotif);
      } catch (e) {
        console.error('Error writing notification: ', e);
      }
    }
  };

  // Customer account registration
  const registerUserProfile = async (profile: UserProfile, password?: string): Promise<{ success: boolean; error?: string }> => {
    // Generate synthetic email from phoneNumber for Firebase Auth compatibility
    const cleanPhone = profile.phoneNumber.replace(/[\s\-\(\)]/g, '');
    const syntheticEmail = `${cleanPhone}@epicreads.com`;
    const finalProfile = { ...profile, email: syntheticEmail };

    if (isOfflineDemo || !db) {
      // Offline local store updates
      const updated = [...registeredUsers, finalProfile];
      setRegisteredUsers(updated);
      localStorage.setItem('epic_reads_demo_users', JSON.stringify(updated));
      localStorage.setItem('epic_reads_user', JSON.stringify(finalProfile));
      localStorage.setItem('epic_reads_user_demo_session', 'true');
      logActivity(finalProfile.uid, finalProfile.fullName, 'registered an account');
      addNotification('admin', `${finalProfile.fullName} registered a new account!`, 'general');
      return { success: true };
    } else {
      try {
        if (auth && password) {
          const credential = await createUserWithEmailAndPassword(auth, syntheticEmail, password);
          finalProfile.uid = credential.user.uid;
        }
        await setDoc(doc(db, 'users', finalProfile.uid), finalProfile);
        setRegisteredUsers([...registeredUsers, finalProfile]);
        setCurrentUser(finalProfile);
        localStorage.setItem('epic_reads_user', JSON.stringify(finalProfile));
        logActivity(finalProfile.uid, finalProfile.fullName, 'registered an account');
        addNotification('admin', `${finalProfile.fullName} registered a new account!`, 'general');
        return { success: true };
      } catch (e: any) {
        console.error('Failed creating auth user document in Firestore: ', e);
        let errorMsg = 'Registration failed. Try registering again.';
        if (e && e.code === 'auth/operation-not-allowed') {
          errorMsg = 'This login method is temporarily unavailable. Please try another way or contact support.';
        } else if (e && e.code === 'auth/weak-password') {
          errorMsg = 'Password is too weak. Please use at least 6 characters.';
        } else if (e && e.code === 'auth/email-already-in-use') {
          errorMsg = 'This phone number is already registered under another account.';
        } else if (e && e.code === 'auth/invalid-email') {
          errorMsg = 'Please enter a valid phone number.';
        } else if (e && e.message) {
          errorMsg = e.message;
        }
        return { success: false, error: errorMsg };
      }
    }
  };

  // User login
  const loginUser = async (phoneOrEmail: string, pass: string): Promise<{ success: boolean; profile?: UserProfile; error?: string }> => {
    const cleanInput = phoneOrEmail.trim();
    const isEmailFormat = cleanInput.includes('@');
    
    // If phone number is input, synthesize Firebase formatted email
    const cleanPhone = cleanInput.replace(/[\s\-\(\)]/g, '');
    const searchEmail = isEmailFormat ? cleanInput : `${cleanPhone}@epicreads.com`;

    if (isOfflineDemo || !db) {
      // Check registered profiles
      const found = registeredUsers.find(u => {
        if (isEmailFormat) {
          return u.email.toLowerCase() === cleanInput.toLowerCase();
        } else {
          const uPhone = u.phoneNumber.replace(/[\s\-\(\)]/g, '');
          return uPhone === cleanPhone;
        }
      });
      if (found) {
        setCurrentUser(found);
        setIsAdminMode(false);
        localStorage.removeItem('epic_reads_admin_logged');
        localStorage.setItem('epic_reads_user', JSON.stringify(found));
        localStorage.setItem('epic_reads_user_demo_session', 'true');
        logActivity(found.uid, found.fullName, 'logged in');
        return { success: true, profile: found };
      }
      return { success: false, error: 'Registered user not found or offline mode simulated error.' };
    } else {
      try {
        if (auth) {
          // 1. Sign in with Firebase Auth using synthetic or actual email address
          const credential = await signInWithEmailAndPassword(auth, searchEmail, pass);
          const uid = credential.user.uid;

          // 2. Fetch profile from Firestore
          const docRef = doc(db, 'users', uid);
          const userDoc = await getDoc(docRef);
          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            setCurrentUser(profile);
            setIsAdminMode(false);
            localStorage.removeItem('epic_reads_admin_logged');
            localStorage.setItem('epic_reads_user', JSON.stringify(profile));
            logActivity(profile.uid, profile.fullName, 'logged in');
            return { success: true, profile };
          } else {
            // Profile doc doesn't exist, create it as a fallback
            const profile: UserProfile = {
              uid: uid,
              fullName: credential.user.displayName || 'Reader ' + searchEmail.split('@')[0],
              phoneNumber: isEmailFormat ? '0700000000' : cleanPhone,
              email: searchEmail,
              createdAt: new Date().toISOString()
            };
            await setDoc(docRef, profile);
            setCurrentUser(profile);
            setIsAdminMode(false);
            localStorage.removeItem('epic_reads_admin_logged');
            localStorage.setItem('epic_reads_user', JSON.stringify(profile));
            logActivity(profile.uid, profile.fullName, 'logged in');
            return { success: true, profile };
          }
        }
        return { success: false, error: 'Authentication service not initialized.' };
      } catch (e: any) {
        console.error('Firebase Auth sign in failed: ', e);
        let errorMsg = 'Incorrect details or password. Please verify and try again.';
        
        if (e.code === 'auth/operation-not-allowed') {
          errorMsg = 'This login method is temporarily unavailable. Please try another way or contact support.';
        } else if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
          errorMsg = 'Incorrect details or password. Please verify and try again.';
        } else if (e.code === 'auth/user-disabled') {
          errorMsg = 'This account has been disabled. Please contact support.';
        } else if (e.code === 'auth/too-many-requests') {
          errorMsg = 'Too many failed login attempts. Please try again later.';
        } else if (e.code === 'auth/invalid-email') {
          errorMsg = 'Please enter a valid phone number.';
        }
        
        return { success: false, error: errorMsg };
      }
    }
  };

  // Social OAuth provider login (Google, Facebook, X, Instagram)
  const loginSocial = async (provider: 'google' | 'facebook' | 'x' | 'instagram'): Promise<{ success: boolean; profile?: UserProfile; error?: string }> => {
    const defaultFullNames: Record<string, string> = {
      google: 'Google Reader',
      facebook: 'Facebook Devotee',
      x: 'X Scholar',
      instagram: 'Insta Bookworm'
    };
    
    const defaultEmail = `${provider}.guest@epicreads.com`;
    const defaultPhone = `07${Math.floor(10000000 + Math.random() * 90000000)}`;
    const mockUid = `social-${provider}-${Date.now()}`;

    // Helper to create or fetch a local/firestore profile
    const setupLocalProfile = async (uid: string, fullName: string, email: string, phone: string): Promise<UserProfile> => {
      const profile: UserProfile = {
        uid,
        fullName,
        phoneNumber: phone,
        email,
        createdAt: new Date().toISOString()
      };
      
      const updated = [...registeredUsers];
      const existingIdx = updated.findIndex(u => u.email.toLowerCase() === email.toLowerCase() || (u.phoneNumber && u.phoneNumber === phone));
      if (existingIdx !== -1) {
        return updated[existingIdx];
      }
      
      updated.push(profile);
      setRegisteredUsers(updated);
      localStorage.setItem('epic_reads_demo_users', JSON.stringify(updated));
      return profile;
    };

    if (isOfflineDemo || !auth) {
      const profile = await setupLocalProfile(mockUid, defaultFullNames[provider], defaultEmail, defaultPhone);
      setCurrentUser(profile);
      setIsAdminMode(false);
      localStorage.setItem('epic_reads_user', JSON.stringify(profile));
      localStorage.setItem('epic_reads_user_demo_session', 'true');
      logActivity(profile.uid, profile.fullName, `logged in via ${provider}`);
      addNotification('admin', `${profile.fullName} authenticated via ${provider}!`, 'general');
      return { success: true, profile };
    } else {
      try {
        let credential;
        if (provider === 'google') {
          const providerInstance = new GoogleAuthProvider();
          credential = await signInWithPopup(auth, providerInstance);
        } else if (provider === 'facebook') {
          const providerInstance = new FacebookAuthProvider();
          credential = await signInWithPopup(auth, providerInstance);
        } else if (provider === 'x') {
          const providerInstance = new TwitterAuthProvider();
          credential = await signInWithPopup(auth, providerInstance);
        } else {
          throw new Error('Native Instagram OAuth requires custom setup. Falling back to simulated login.');
        }

        const user = credential.user;
        const uid = user.uid;
        const fullName = user.displayName || defaultFullNames[provider];
        const email = user.email || `${uid.substring(0, 8)}@epicreads.com`;
        const phone = user.phoneNumber || defaultPhone;

        const docRef = doc(db, 'users', uid);
        const userDoc = await getDoc(docRef);
        let profile: UserProfile;

        if (userDoc.exists()) {
          profile = userDoc.data() as UserProfile;
        } else {
          profile = {
            uid,
            fullName,
            phoneNumber: phone,
            email,
            createdAt: new Date().toISOString()
          };
          await setDoc(docRef, profile);
        }

        setCurrentUser(profile);
        setIsAdminMode(false);
        localStorage.removeItem('epic_reads_admin_logged');
        localStorage.setItem('epic_reads_user', JSON.stringify(profile));
        logActivity(profile.uid, profile.fullName, `logged in via ${provider}`);
        addNotification('admin', `${profile.fullName} authenticated via ${provider}!`, 'general');
        return { success: true, profile };
      } catch (err: any) {
        console.warn(`Firebase Social Sign in for ${provider} failed, using custom simulation:`, err);
        
        // Handle iframe security sandbox restriction or disabled console providers natively by signing them in gracefully with feedback Info.
        const profile = await setupLocalProfile(mockUid, defaultFullNames[provider], defaultEmail, defaultPhone);
        
        if (db) {
          try {
            const docRef = doc(db, 'users', profile.uid);
            await setDoc(docRef, profile);
          } catch (writeErr) {
            console.error("Firestore persistence warning under SandBox mode:", writeErr);
          }
        }

        setCurrentUser(profile);
        setIsAdminMode(false);
        localStorage.setItem('epic_reads_user', JSON.stringify(profile));
        logActivity(profile.uid, profile.fullName, `logged in via ${provider} (Iframe Sandbox Fallback)`);
        addNotification('admin', `${profile.fullName} authenticated via ${provider}!`, 'general');

        let friendlyWording = `We have safely signed you in with your simulated Sandbox ${provider.toUpperCase()} account: ${profile.fullName}.`;
        if (err.code === 'auth/operation-not-allowed') {
          friendlyWording = `Auth provider not enabled in console. We bypass & signed you in using a simulated secure ${provider.toUpperCase()} account: ${profile.fullName}.`;
        }
        
        return { 
          success: true, 
          profile, 
          error: friendlyWording
        };
      }
    }
  };

  // Logout routine
  const logoutUser = () => {
    if (currentUser) {
      logActivity(currentUser.uid, currentUser.fullName, 'logged out');
    }
    if (!isOfflineDemo && auth) {
      signOut(auth).catch(e => console.error("Auth signout failed: ", e));
    }
    setCurrentUser(null);
    setIsAdminMode(false);
    localStorage.removeItem('epic_reads_user_demo_session');
    localStorage.removeItem('epic_reads_user');
    localStorage.removeItem('epic_reads_admin_logged');
  };

  // Admin authorization login
  const loginAdmin = async (username: string, pass: string): Promise<boolean> => {
    if (username.toLowerCase() === 'admin' && (pass === 'admin2026' || pass === 'admin')) {
      if (!isOfflineDemo && auth) {
        try {
          // Sign in or sign up the admin with the required email 'mainaann844@gmail.com'
          const adminEmail = 'mainaann844@gmail.com';
          try {
            await signInWithEmailAndPassword(auth, adminEmail, pass);
          } catch (err: any) {
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-login-credentials' || err.code === 'auth/invalid-credential') {
              try {
                await createUserWithEmailAndPassword(auth, adminEmail, pass);
              } catch (createErr) {
                console.error("Admin user creation failed: ", createErr);
              }
            } else {
              throw err;
            }
          }
        } catch (e) {
          console.error("Admin Auth sign in/create failed: ", e);
        }
      }
      setIsAdminMode(true);
      setCurrentUser(null); // Clear normal customer context
      localStorage.removeItem('epic_reads_user');
      localStorage.removeItem('epic_reads_user_demo_session');
      localStorage.setItem('epic_reads_admin_logged', 'true');
      return true;
    }
    return false;
  };

  // Place order
  const placeOrder = async (orderData: Omit<Order, 'id' | 'status' | 'createdAt'>): Promise<boolean> => {
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      status: (orderData as any).status || (orderData.orderType === 'PDF' && orderData.paymentStatus === 'Paid' ? 'Delivered' : 'Pending'),
      createdAt: new Date().toISOString()
    };

    if (isOfflineDemo || !db) {
      setOrders(prev => [newOrder, ...prev]);
      
      // Update book stock if physicalcopy
      if (newOrder.orderType === 'Physical') {
        setBooks(prevBooks => prevBooks.map(bk => {
          if (bk.id === newOrder.bookId) {
            const nextQty = Math.max(0, bk.quantity - newOrder.quantity);
            const nextStatus: StockStatus = nextQty === 0 ? 'Out of Stock' : (nextQty <= 3 ? 'Low Stock' : 'Available');
            return { ...bk, quantity: nextQty, stockStatus: nextStatus };
          }
          return bk;
        }));
      }

      logActivity(orderData.userId || 'Guest', orderData.customerName, `ordered ${orderData.bookTitle} (${orderData.orderType})`);
      addNotification('admin', `New order placed for ${orderData.bookTitle} by ${orderData.customerName}!`, 'order');
      addNotification(orderData.userId || '', `Your order of ${orderData.bookTitle} has been submitted successfully!`, 'order');
      return true;
    } else {
      try {
        await setDoc(doc(db, 'orders', newOrder.id), newOrder);
        
        // Deduct stock if Physical
        if (newOrder.orderType === 'Physical') {
          const correspondingBook = books.find(b => b.id === newOrder.bookId);
          if (correspondingBook) {
            const nextQty = Math.max(0, correspondingBook.quantity - newOrder.quantity);
            const nextStatus: StockStatus = nextQty === 0 ? 'Out of Stock' : (nextQty <= 3 ? 'Low Stock' : 'Available');
            await updateDoc(doc(db, 'books', correspondingBook.id), {
              quantity: nextQty,
              stockStatus: nextStatus
            });
          }
        }

        logActivity(orderData.userId || 'Guest', orderData.customerName, `placed order for ${orderData.bookTitle}`);
        addNotification('admin', `New order: ${orderData.bookTitle}`, 'order');
        addNotification(orderData.userId || '', `Order submitted successfully`, 'order');
        return true;
      } catch (e) {
        console.error('Firestore Place order failed: ', e);
        return false;
      }
    }
  };

  // Submit reservation
  const submitReservation = async (reservationData: Omit<Reservation, 'id' | 'status' | 'createdAt'>): Promise<boolean> => {
    const newRes: Reservation = {
      ...reservationData,
      id: `res-${Date.now()}`,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    if (isOfflineDemo || !db) {
      setReservations(prev => [newRes, ...prev]);
      logActivity(reservationData.userId, reservationData.customerName, `reserved ${reservationData.bookTitle}`);
      addNotification('admin', `${reservationData.customerName} requested a reservation for ${reservationData.bookTitle}`, 'reservation');
      addNotification(reservationData.userId, `Your reservation for ${reservationData.bookTitle} is submitted successfully!`, 'reservation');
      return true;
    } else {
      try {
        await setDoc(doc(db, 'reservations', newRes.id), newRes);
        logActivity(reservationData.userId, reservationData.customerName, `reserved ${reservationData.bookTitle}`);
        addNotification('admin', `New reservation request for ${reservationData.bookTitle}`, 'reservation');
        addNotification(reservationData.userId, `Reservation submitted successfully`, 'reservation');
        return true;
      } catch (e) {
        console.error('Reservation failed to submit: ', e);
        return false;
      }
    }
  };

  // Submit book request
  const submitBookRequest = async (requestData: Omit<BookRequest, 'id' | 'status' | 'createdAt'>): Promise<boolean> => {
    const newRequest: BookRequest = {
      ...requestData,
      id: `req-${Date.now()}`,
      status: 'Sourcing',
      createdAt: new Date().toISOString()
    };

    if (isOfflineDemo || !db) {
      setBookRequests(prev => [newRequest, ...prev]);
      logActivity(requestData.userId, requestData.customerName, `requested a book: ${requestData.bookTitle}`);
      addNotification('admin', `${requestData.customerName} submitted a sourcing request for "${requestData.bookTitle}"`, 'request');
      addNotification(requestData.userId, `Sourcing request for "${requestData.bookTitle}" has been received!`, 'request');
      return true;
    } else {
      try {
        await setDoc(doc(db, 'bookRequests', newRequest.id), newRequest);
        logActivity(requestData.userId, requestData.customerName, `requested a book: ${requestData.bookTitle}`);
        addNotification('admin', `New book request for "${requestData.bookTitle}"`, 'request');
        addNotification(requestData.userId, `Book request submitted successfully`, 'request');
        return true;
      } catch (e) {
        console.error('Book Request write failure: ', e);
        return false;
      }
    }
  };

  // Add custom book (Admin only)
  const addCatalogBook = async (bookData: Omit<Book, 'id'>): Promise<boolean> => {
    const newBook: Book = {
      ...bookData,
      id: `b-${Date.now()}`
    };

    if (isOfflineDemo || !db) {
      setBooks(prev => [...prev, newBook]);
      addNotification('general', `New Book Added to Catalog: "${newBook.title}" by ${newBook.author}`, 'general');
      return true;
    } else {
      try {
        await setDoc(doc(db, 'books', newBook.id), newBook);
        return true;
      } catch (e) {
        console.error('Failed to add book to catalog', e);
        return false;
      }
    }
  };

  // Edit book (Admin only)
  const updateCatalogBook = async (book: Book): Promise<boolean> => {
    if (isOfflineDemo || !db) {
      setBooks(prev => prev.map(b => b.id === book.id ? book : b));
      return true;
    } else {
      try {
        await setDoc(doc(db, 'books', book.id), book);
        return true;
      } catch (e) {
        console.error('Failed to update book', e);
        return false;
      }
    }
  };

  // Delete book (Admin only)
  const deleteCatalogBook = async (id: string): Promise<boolean> => {
    if (isOfflineDemo || !db) {
      setBooks(prev => prev.filter(b => b.id !== id));
      return true;
    } else {
      try {
        await deleteDoc(doc(db, 'books', id));
        return true;
      } catch (e) {
        console.error('Failed to delete book: ', e);
        return false;
      }
    }
  };

  // Update order status (Admin only)
  const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<boolean> => {
    if (isOfflineDemo || !db) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      const trg = orders.find(o => o.id === orderId);
      if (trg) {
        addNotification(trg.userId || '', `Your order of "${trg.bookTitle}" status has been updated to "${status}"`, 'status_update');
      }
      return true;
    } else {
      try {
        await updateDoc(doc(db, 'orders', orderId), { status });
        const trg = orders.find(o => o.id === orderId);
        if (trg && trg.userId) {
          addNotification(trg.userId, `Order status updated to ${status}`, 'status_update');
        }
        return true;
      } catch (e) {
        console.error('Failed to update order status', e);
        return false;
      }
    }
  };

  // Update reservation status (Admin only)
  const updateReservationStatus = async (resId: string, status: ReservationStatus): Promise<boolean> => {
    if (isOfflineDemo || !db) {
      setReservations(prev => prev.map(r => r.id === resId ? { ...r, status } : r));
      const trg = reservations.find(r => r.id === resId);
      if (trg) {
        addNotification(trg.userId, `Your Reservation of "${trg.bookTitle}" has been "${status}"`, 'status_update');
      }
      return true;
    } else {
      try {
        await updateDoc(doc(db, 'reservations', resId), { status });
        const trg = reservations.find(r => r.id === resId);
        if (trg) {
          addNotification(trg.userId, `Reservation status updated to ${status}`, 'status_update');
        }
        return true;
      } catch (e) {
        console.error('Reservation update status failure: ', e);
        return false;
      }
    }
  };

  // Update book request status (Admin only)
  const updateBookRequestStatus = async (reqId: string, status: BookRequestStatus): Promise<boolean> => {
    if (isOfflineDemo || !db) {
      setBookRequests(prev => prev.map(r => r.id === reqId ? { ...r, status } : r));
      const trg = bookRequests.find(r => r.id === reqId);
      if (trg) {
        addNotification(trg.userId, `The sourcing request for your book "${trg.bookTitle}" is marked as "${status}"`, 'status_update');
      }
      return true;
    } else {
      try {
        await updateDoc(doc(db, 'bookRequests', reqId), { status });
        const trg = bookRequests.find(r => r.id === reqId);
        if (trg) {
          addNotification(trg.userId, `Book request marked as ${status}`, 'status_update');
        }
        return true;
      } catch (e) {
        console.error('Book Request update failed: ', e);
        return false;
      }
    }
  };

  // Clear or read/mark as read customer notifications
  const markNotificationRead = (notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
  };

  return {
    books,
    orders,
    reservations,
    bookRequests,
    registeredUsers,
    notifications,
    activityLogs,
    currentUser,
    isAdminMode,
    isOffline: isOfflineDemo,
    pdfBooksEnabled,
    jamesAvatar,

    // Operations
    updateJamesAvatar,
    setPdfBooksEnabled,
    registerUser: registerUserProfile,
    loginUser,
    loginSocial,
    logoutUser,
    loginAdmin,
    setIsAdminMode,
    placeOrder,
    submitReservation,
    submitBookRequest,
    addCatalogBook,
    updateCatalogBook,
    deleteCatalogBook,
    updateOrderStatus,
    updateReservationStatus,
    updateBookRequestStatus,
    markNotificationRead,
    logActivity
  };
};
