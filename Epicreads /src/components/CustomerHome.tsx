import React, { useState } from 'react';
import { useEpicReadsStore } from '../store';
import { Book, OrderType, StockStatus, Order, Reservation, BookRequest } from '../types';
import { BookCard } from './BookCard';
import { SocialShare } from './SocialShare';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ShoppingBag, 
  BookMarked, 
  User, 
  BookOpen, 
  MapPin, 
  Phone, 
  Calendar, 
  Clipboard, 
  Bell, 
  Download, 
  LogOut, 
  PlusCircle, 
  ChevronRight, 
  Check, 
  AlertTriangle,
  Share2,
  MessageSquare
} from 'lucide-react';

interface CustomerHomeProps {
  store: ReturnType<typeof useEpicReadsStore>;
}

type TabType = 'explore' | 'request' | 'history' | 'profile';

export const CustomerHome: React.FC<CustomerHomeProps> = ({ store }) => {
  const {
    books,
    orders,
    reservations,
    bookRequests,
    notifications,
    currentUser,
    pdfBooksEnabled,
    logoutUser,
    placeOrder,
    submitReservation,
    submitBookRequest,
    markNotificationRead,
    isOffline
  } = store;

  // Navigation & filtering states
  const [activeTab, setActiveTab] = useState<TabType>('explore');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Global Remote Catalogue API search states
  const [searchGlobal, setSearchGlobal] = useState<boolean>(false);
  const [globalBooks, setGlobalBooks] = useState<Book[]>([]);
  const [globalLoading, setGlobalLoading] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!searchGlobal || searchQuery.trim().length <= 2) {
      setGlobalBooks([]);
      setGlobalError(null);
      return;
    }

    setGlobalLoading(true);
    setGlobalError(null);

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://openlibrary.org/search.json?title=${encodeURIComponent(searchQuery.trim())}&limit=6`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          throw new Error('Could not connect to the remote catalogue service.');
        }
        const data = await response.json();
        
        // Map OpenLibrary documents into compatible structures for catalog grids
        const mappedList = (data.docs || []).map((doc: any, index: number) => ({
          id: `global_${doc.key ? doc.key.split('/').pop() : index}`,
          title: doc.title,
          author: doc.author_name ? doc.author_name[0] : 'Unknown Author',
          category: doc.subject ? doc.subject[0] : 'General Catalog',
          description: doc.first_sentence ? doc.first_sentence[0] : `A published literature work retrieved from public registers. First printed in ${doc.first_publish_year || 'various periods'}. Sourced on demand if requested.`,
          imageUrl: doc.cover_i 
            ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` 
            : '/src/assets/images/placeholder.jpg',
          price: 1450, // Standard flat sourcing cost
          quantity: 0,
          stockStatus: 'Out of Stock' as const, // Books in global catalog are sourced on demand
          isbn: doc.isbn ? doc.isbn[0] : undefined
        }));

        setGlobalBooks(mappedList);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("OpenLibrary global catalog lookup failed:", err);
          setGlobalError("Failed fetching book catalogs from the Global Register.");
        }
      } finally {
        setGlobalLoading(false);
      }
    }, 600); // 600ms input debounce keying

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [searchQuery, searchGlobal]);

  // Form target action modal states
  const [showOrderModal, setShowOrderModal] = useState<boolean>(false);
  const [showReserveModal, setShowReserveModal] = useState<boolean>(false);
  const [showRequestModal, setShowRequestModal] = useState<boolean>(false);

  // Form Fields State
  const [formData, setFormData] = useState({
    name: currentUser?.fullName || '',
    phone: currentUser?.phoneNumber || '',
    quantity: 1,
    deliveryLocation: '',
    notes: '',
    orderType: 'Physical' as OrderType,
    // Reservation specific
    expectedPurchaseDate: '',
    // Request specific
    requestBookTitle: '',
    requestAuthor: ''
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Filter books list
  const categories = ['All', ...Array.from(new Set(books.map(b => b.category)))];
  const filteredBooks = books.filter(b => {
    const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate user-specific records
  const myOrders = orders.filter(o => o.userId === currentUser?.uid);
  const myReservations = reservations.filter(r => r.userId === currentUser?.uid);
  const myRequests = bookRequests.filter(r => r.userId === currentUser?.uid);
  const myNotifications = notifications.filter(n => n.userId === currentUser?.uid);

  // Form submit validators & loaders
  const handleOpenOrder = (book: Book, type: OrderType) => {
    setFormData({
      name: currentUser?.fullName || '',
      phone: currentUser?.phoneNumber || '',
      quantity: 1,
      deliveryLocation: type === 'PDF' ? (currentUser?.email || '') : '',
      notes: '',
      orderType: type,
      expectedPurchaseDate: '',
      requestBookTitle: '',
      requestAuthor: ''
    });
    setFormError(null);
    setFormSuccess(null);
    setShowOrderModal(true);
  };

  const handleOpenReserve = (book: Book) => {
    setFormData({
      name: currentUser?.fullName || '',
      phone: currentUser?.phoneNumber || '',
      quantity: 1,
      deliveryLocation: '',
      notes: '',
      orderType: 'Physical',
      expectedPurchaseDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // 3 days layout
      requestBookTitle: '',
      requestAuthor: ''
    });
    setFormError(null);
    setFormSuccess(null);
    setShowReserveModal(true);
  };

  const handleOpenRequest = () => {
    setFormData({
      name: currentUser?.fullName || '',
      phone: currentUser?.phoneNumber || '',
      quantity: 1,
      deliveryLocation: '',
      notes: '',
      orderType: 'Physical',
      expectedPurchaseDate: '',
      requestBookTitle: '',
      requestAuthor: ''
    });
    setFormError(null);
    setFormSuccess(null);
    setShowRequestModal(true);
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim() || !formData.phone.trim() || !formData.deliveryLocation.trim()) {
      setFormError('Please type your Name, Phone Number, and Address.');
      return;
    }

    if (formData.quantity < 1 || formData.quantity > 100) {
      setFormError('You can only order 1 to 100 books.');
      return;
    }

    if (!selectedBook) return;

    // Additional stock and validation checks for physical purchases
    if (formData.orderType === 'Physical') {
      if (selectedBook.stockStatus === 'Out of Stock') {
        setFormError('We do not have this book right now! You can ask us to get more, or buy the PDF read on your phone.');
        return;
      }
      if (selectedBook.quantity < formData.quantity) {
        setFormError(`We do not have that many! We only have ${selectedBook.quantity} books left.`);
        return;
      }
    }

    const price = formData.orderType === 'PDF' && selectedBook.pdfPrice ? selectedBook.pdfPrice : selectedBook.price;
    const totalPrice = price * formData.quantity;

    const opSuccess = await placeOrder({
      userId: currentUser?.uid,
      customerName: formData.name,
      phoneNumber: formData.phone,
      bookId: selectedBook.id,
      bookTitle: selectedBook.title,
      quantity: formData.quantity,
      deliveryLocation: formData.deliveryLocation,
      notes: formData.notes,
      totalPrice,
      orderType: formData.orderType
    });

    if (opSuccess) {
      setFormSuccess('Yay! Your order is ready!');
      setTimeout(() => {
        setShowOrderModal(false);
        setSelectedBook(null); // Return to list view
        setActiveTab('history'); // View purchases page
      }, 1500);
    } else {
      setFormError('Oh no! We could not make your order. Please check your internet.');
    }
  };

  const handleReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim() || !formData.phone.trim() || !formData.expectedPurchaseDate) {
      setFormError('Please fill in all the blank boxes.');
      return;
    }

    if (!selectedBook) return;

    const opSuccess = await submitReservation({
      userId: currentUser?.uid || 'guest-user',
      customerName: formData.name,
      phoneNumber: formData.phone,
      bookId: selectedBook.id,
      bookTitle: selectedBook.title,
      expectedPurchaseDate: formData.expectedPurchaseDate
    });

    if (opSuccess) {
      setFormSuccess('We saved this book for you!');
      setTimeout(() => {
        setShowReserveModal(false);
        setSelectedBook(null);
        setActiveTab('history');
      }, 1500);
    } else {
      setFormError('Oh no! We could not save this book. Please try again.');
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim() || !formData.phone.trim() || !formData.requestBookTitle.trim() || !formData.notes.trim()) {
      setFormError('Please tell us your Name, Phone Number, Book Title, and details about the book.');
      return;
    }

    const opSuccess = await submitBookRequest({
      userId: currentUser?.uid || 'guest-user',
      customerName: formData.name,
      phoneNumber: formData.phone,
      bookTitle: formData.requestBookTitle,
      author: formData.requestAuthor,
      notes: formData.notes
    });

    if (opSuccess) {
      setFormSuccess('We received your book request!');
      setFormData(prev => ({ ...prev, requestBookTitle: '', requestAuthor: '', notes: '' }));
      setTimeout(() => {
        setShowRequestModal(false);
        setActiveTab('history');
      }, 1500);
    } else {
      setFormError('Oh no! We could not write down your request. Please try again.');
    }
  };

  return (
    <div className="flex h-full flex-col bg-indigo-50/40 relative overflow-hidden text-left font-sans">
      {/* Top App Header bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between bg-white px-4 py-3 border-b border-indigo-100 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <img 
              src={store.jamesAvatar} 
              alt="James Avatar" 
              referrerPolicy="no-referrer"
              className="h-[34px] w-[34px] rounded-full object-cover border border-indigo-100 shadow-xs" 
              onError={(e) => {
                // If the avatar fails to render, show a fallback icon
                e.currentTarget.style.display = 'none';
                const fallback = document.getElementById('header-fallback-icon');
                if (fallback) fallback.classList.remove('hidden');
              }}
            />
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border-2 border-white"></span>
            
            <div id="header-fallback-icon" className="hidden p-2 rounded-xl bg-indigo-50 text-indigo-600 font-semibold shadow-xs border border-indigo-100">
              <BookOpen className="h-[18px] w-[18px]" />
            </div>
          </div>
          <div>
            <h1 className="text-sm font-black text-indigo-950 tracking-tight leading-none pt-0.5">EpicReads</h1>
            <p className="text-[10px] text-slate-505 font-bold mt-0.5">My Curated Bookshop</p>
          </div>
        </div>

        {/* User login overview & badge indicators */}
        <div className="flex items-center gap-3">
          {isOffline && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse"></span> Play Mode
            </span>
          )}

          {/* Quick notification bell overlay link */}
          <div className="relative">
            <button 
              onClick={() => setActiveTab('history')}
              className="p-1.5 rounded-full text-slate-500 hover:bg-slate-50 relative cursor-pointer"
            >
              <Bell className="h-4.5 w-4.5" />
              {myNotifications.some(n => !n.read) && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-rose-600"></span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600 line-clamp-1 max-w-[80px]">
              {currentUser?.fullName.split(' ')[0]}
            </span>
          </div>
        </div>
      </header>

      {/* Main active panels view ports */}
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        
        {/* TAB 1: EXPLORE CATALOG */}
        {activeTab === 'explore' && !selectedBook && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Search filter box bar */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder={searchGlobal ? "Type title to lookup global registry..." : "Search series, authors, genres..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-indigo-100/80 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-indigo-950 transition-all font-bold shadow-xs placeholder-slate-400"
                />
              </div>

              {/* Global search trigger checkbox */}
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-1.5 cursor-pointer text-[10.5px] font-bold text-slate-500 select-none">
                  <input 
                    type="checkbox" 
                    checked={searchGlobal} 
                    onChange={(e) => {
                      setSearchGlobal(e.target.checked);
                      setSearchQuery('');
                      setGlobalBooks([]);
                    }}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                  />
                  <span>Search Global Library (API catalog)</span>
                </label>
                {searchGlobal && (
                  <span className="text-[9.5px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse border border-emerald-100">Live API</span>
                )}
              </div>
            </div>

            {searchGlobal ? (
              /* GLOBAL REGISTER RESULTS CONTAINER */
              <div className="space-y-3 pt-1">
                <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100/40 text-left">
                  <h4 className="text-[10px] font-bold text-indigo-950 uppercase tracking-wider">Search results from external catalogue API</h4>
                  <p className="text-[9.5px] text-slate-400 mt-0.5">Found books are available to order on-demand. Click on a book, then press "Ask me to find this book" to source it!</p>
                </div>

                {globalLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center select-none">
                    <div className="h-7 w-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <h5 className="font-bold text-slate-700 text-xs">Querying Global Catalogues...</h5>
                    <p className="text-[10px] text-slate-400 mt-1">Connecting to Open Library rest metadata endpoints</p>
                  </div>
                ) : globalError ? (
                  <div className="bg-rose-50 text-rose-800 p-4 rounded-xl text-center border border-rose-100">
                    <p className="text-xs font-bold">{globalError}</p>
                    <p className="text-[10px] text-rose-500 mt-1">Please check your network and search again.</p>
                  </div>
                ) : searchQuery.trim().length <= 2 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center select-none">
                    <Search className="h-8 w-8 text-indigo-200 mb-2" />
                    <h5 className="font-bold text-slate-600 text-xs">Let's lookup any book!</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Type 3 or more letters of the book name to fetch registries</p>
                  </div>
                ) : globalBooks.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3.5">
                    {globalBooks.map((book) => (
                      <BookCard 
                        key={book.id} 
                        book={book} 
                        onSelect={(bk) => {
                          setSelectedBook(bk);
                        }} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl select-none">
                    <Search className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-bold">No global references discovered</p>
                    <p className="text-[10px] text-slate-400 mt-1">Try another sequence or modify spacing</p>
                  </div>
                )}
              </div>
            ) : (
              /* STANDARD LOCAL CATALOG CONTAINER */
              <>
                {/* Personal Curator greeting card */}
                <div className="bg-white rounded-3xl p-4 border border-indigo-100/60 shadow-xs flex items-center gap-3.5 bg-gradient-to-tr from-white to-indigo-50/20">
                  <div className="relative shrink-0">
                    <img 
                      src={store.jamesAvatar} 
                      alt="James Portrait" 
                      referrerPolicy="no-referrer"
                      className="h-12 w-12 rounded-full object-cover border-2 border-indigo-150 shadow-xs"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-xs font-black text-indigo-950">Hey, I'm James! 👋</h3>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5">
                      I've hand-picked these great reads for you. Feel free to browse, save books, or order hardcovers for quick Nairobi delivery! Let me know if you need any custom volume imports.
                    </p>
                  </div>
                </div>

                {/* Category horizontal scroller tags selection */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 -mx-4 px-4 select-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-2xl text-[11px] font-black whitespace-nowrap cursor-pointer transition-all ${
                        selectedCategory === cat 
                          ? 'bg-indigo-600 text-white shadow-xs border border-indigo-600' 
                          : 'bg-white hover:bg-indigo-50/30 text-indigo-950 border border-indigo-100/80 active:scale-95'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Books catalog grid listings content */}
                {filteredBooks.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3.5 pt-1">
                    {filteredBooks.map((book) => (
                      <BookCard 
                        key={book.id} 
                        book={book} 
                        onSelect={(bk) => {
                          setSelectedBook(bk);
                          // Log customer interaction history log in the logs list
                          if (currentUser) {
                            store.logActivity(currentUser.uid, currentUser.fullName, `viewed "${bk.title}" book`);
                          }
                        }} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Search className="h-10 w-10 text-slate-300 mb-2" />
                    <h4 className="font-semibold text-slate-700 text-sm">We do not have that book right now</h4>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      We cannot find that book! Try typing another name, or ask us to get it for you.
                    </p>
                    <button 
                      onClick={handleOpenRequest}
                      className="mt-4 px-4 py-2 font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer transition-colors shadow-sm"
                    >
                      Ask us to get it
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* TAB 1 DETAIL VIEW SHEET */}
        {activeTab === 'explore' && selectedBook && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Back to Explore button */}
            <button 
              onClick={() => setSelectedBook(null)}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer mb-2"
            >
              &larr; Go Back to All Books
            </button>

            {/* Detail Card panel */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-5">
              <div className="flex gap-4">
                <div className="w-1/3 aspect-[3/4] bg-slate-50 overflow-hidden rounded-xl border border-slate-100 self-start shadow-sm">
                  <img 
                    src={selectedBook.imageUrl} 
                    alt={selectedBook.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const sib = e.currentTarget.nextElementSibling as HTMLElement;
                      if (sib) sib.style.display = 'flex';
                    }}
                  />
                  <div className="hidden h-full w-full flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-indigo-800 to-purple-700 text-white leading-tight">
                    <BookOpen className="h-8 w-8 mb-1" />
                    <span className="text-[10px] font-bold line-clamp-2">{selectedBook.title}</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between py-1">
                  <div className="space-y-1">
                    <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
                      {selectedBook.category}
                    </span>
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-tight pt-1">
                      {selectedBook.title}
                    </h2>
                    <p className="text-xs font-medium text-slate-400">By {selectedBook.author}</p>
                  </div>

                  <div className="space-y-1 pt-2">
                    <span className="text-[10px] text-slate-400 font-medium tracking-wide block">Price (KES)</span>
                    <div className="flex flex-col">
                      <span className="text-xl font-black text-slate-900 leading-none">
                        KES {selectedBook.price.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-500 font-medium">Real Book</span>
                    </div>

                    {pdfBooksEnabled && selectedBook.pdfPrice && (
                      <div className="flex flex-col pt-1.5 border-t border-dashed border-slate-100 mt-1.5">
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 leading-none">
                          <Download className="h-3 w-3" /> KES {selectedBook.pdfPrice.toLocaleString()}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium font-bold">Read on Phone (PDF)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description summary */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">About this Book</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  {selectedBook.description}
                </p>
              </div>

              {/* Dynamic Status displays */}
              <div className="flex items-center gap-2 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div>
                <span className="text-[11px] text-slate-600 font-medium">
                  {selectedBook.stockStatus === 'Available' ? 'We can bring this real book to you right now!' : 
                   selectedBook.stockStatus === 'Low Stock' ? `Hurry! Only ${selectedBook.quantity} books left!` : 
                   'We do not have real books left. But you can get a phone copy instantly!'}
                </span>
              </div>

              {/* Action Buttons footer sheet */}
              <div className="flex flex-col gap-2.5 pt-2">
                {/* Buy physical book button */}
                <button
                  onClick={() => handleOpenOrder(selectedBook, 'Physical')}
                  disabled={selectedBook.stockStatus === 'Out of Stock'}
                  className={`w-full py-3 px-4 font-bold rounded-xl text-center cursor-pointer transition-all text-xs flex items-center justify-center gap-2 ${
                    selectedBook.stockStatus === 'Out of Stock'
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10'
                  }`}
                >
                  <ShoppingBag className="h-4 w-4" /> Order Real Book (KES {selectedBook.price.toLocaleString()})
                </button>

                {/* Buy soft book copy (optional) */}
                {pdfBooksEnabled && selectedBook.pdfPrice && (
                  <button
                    onClick={() => handleOpenOrder(selectedBook, 'PDF')}
                    className="w-full py-3 px-4 font-bold border border-emerald-600 text-emerald-600 hover:bg-emerald-50 rounded-xl text-center cursor-pointer transition-all text-xs flex items-center justify-center gap-2 bg-white shadow-sm"
                  >
                    <Download className="h-4 w-4" /> Buy Phone Copy PDF (KES {selectedBook.pdfPrice.toLocaleString()})
                  </button>
                )}

                {/* Reserve book copy option */}
                {selectedBook.stockStatus !== 'Out of Stock' && (
                  <button
                    onClick={() => handleOpenReserve(selectedBook)}
                    className="w-full py-2.5 px-4 font-semibold border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-center cursor-pointer transition-all text-xs flex items-center justify-center gap-2 bg-white shadow-sm"
                  >
                    <BookMarked className="h-4 w-4 text-indigo-500" /> Save for Pick-up
                  </button>
                )}

                {/* Sourcing request shortcut helper */}
                {selectedBook.stockStatus === 'Out of Stock' && (
                  <button
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        requestBookTitle: selectedBook.title,
                        requestAuthor: selectedBook.author
                      }));
                      handleOpenRequest();
                    }}
                    className="w-full py-2.5 px-4 font-semibold text-xs text-white bg-amber-500 hover:bg-amber-600 rounded-xl text-center cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <PlusCircle className="h-4 w-4" /> Ask me to find this book
                  </button>
                )}

                {/* WhatsApp Integrations */}
                <div className="grid grid-cols-2 gap-2 mt-1 select-none">
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `Hey, check out this book "${selectedBook.title}" by ${selectedBook.author} on Epic Reads! Price: KES ${selectedBook.price.toLocaleString()}. See details here: ${window.location.origin}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 font-bold border border-emerald-500 text-emerald-600 hover:bg-emerald-50 rounded-xl text-center cursor-pointer transition-all text-xs flex items-center justify-center gap-1.5 bg-white shadow-xs"
                  >
                    <Share2 className="h-3.5 w-3.5 text-emerald-500" /> Share on WA
                  </a>
                  <a
                    href={`https://wa.me/254700000000?text=${encodeURIComponent(
                      `Hello! I'm interested in buying/reserving "${selectedBook.title}" by ${selectedBook.author} from Epic Reads. Can we coordinate delivery?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-center cursor-pointer transition-all text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Order on WA
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: REQUEST SOURCING FORM SCREEN */}
        {activeTab === 'request' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="bg-gradient-to-tr from-indigo-900 to-indigo-800 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-2 translate-y-2">
                <BookOpen className="h-40 w-40" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">Need a Book We Don't Have?</h2>
              <p className="text-xs text-indigo-100 mt-1 leading-relaxed max-w-sm">
                Tell me what book you want. I will look everywhere to find the paperback or hardcover copy for you!
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">YOUR NAME *</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium outline-none focus:border-indigo-500"
                    placeholder="Type your name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">PHONE NUMBER *</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium outline-none focus:border-indigo-500"
                    placeholder="Type your phone number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">BOOK NAME *</label>
                  <input 
                    type="text" 
                    value={formData.requestBookTitle}
                    onChange={(e) => setFormData({ ...formData, requestBookTitle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium outline-none focus:border-indigo-500"
                    placeholder="What is the book called?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">WRITER (IF YOU KNOW IT)</label>
                  <input 
                    type="text" 
                    value={formData.requestAuthor}
                    onChange={(e) => setFormData({ ...formData, requestAuthor: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium outline-none focus:border-indigo-500"
                    placeholder="Who wrote it?"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">TELL US MORE ABOUT THE BOOK *</label>
                  <textarea 
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium outline-none focus:border-indigo-500"
                    placeholder="Write details here (like what cover do you want? what language?)"
                    required
                  />
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-550/10 text-rose-600 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" /> {formError}
                  </div>
                )}

                {formSuccess && (
                  <div className="p-3 rounded-xl bg-green-500/10 text-green-700 text-xs font-semibold flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0" /> {formSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 font-bold rounded-xl text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/10 text-center cursor-pointer transition-all"
                >
                  Send Book Request
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* TAB 3: CUSTOMER ORDER & RESERVATIONS STATUS SCREEN */}
        {activeTab === 'history' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Inner notification flags block */}
            {myNotifications.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Bell className="h-3.5 w-3.5 text-indigo-500 animate-bounce" /> Messages For You
                </h3>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {myNotifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-2.5 rounded-xl border transition-all text-[11px] flex items-start gap-2 cursor-pointer ${
                        n.read 
                          ? 'bg-slate-50 text-slate-500 border-slate-100/50' 
                          : 'bg-indigo-50/50 font-semibold text-slate-800 border-indigo-100'
                      }`}
                    >
                      <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0"></span>
                      <div className="flex-1">
                        <p>{n.message}</p>
                        <span className="text-[9px] text-slate-400 font-medium block mt-0.5">
                          {new Date(n.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* List Active Orders */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <ShoppingBag className="h-4 w-4" /> Books I Bought ({myOrders.length})
              </h3>
              
              {myOrders.length > 0 ? (
                <div className="space-y-2.5">
                  {myOrders.map(o => (
                    <div key={o.id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{o.bookTitle}</h4>
                          <span className="text-[10px] text-slate-400 font-medium">{o.orderType} copy &bull; Qty: {o.quantity}</span>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          o.status === 'Delivered' ? 'bg-green-50 text-green-700 ring-1 ring-green-600/10' :
                          o.status === 'Processing' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/10' :
                          o.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/10' :
                          'bg-amber-50 text-amber-800 ring-1 ring-amber-600/10'
                        }`}>
                          {o.status}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-100 gap-2">
                        <span>Total Paid: <strong className="text-slate-800 font-bold">KES {o.totalPrice.toLocaleString()}</strong></span>
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://wa.me/254700000000?text=${encodeURIComponent(
                              `Hello Epic Reads! I ordered "${o.bookTitle}" (Order ID: ${o.id.substring(0, 8)}, Type: ${o.orderType}, Qty: ${o.quantity}). Placed on ${new Date(o.createdAt).toLocaleDateString()}. I would like to coordinate M-Pesa payment and delivery.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-50 hover:bg-emerald-100 text-[10px] text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-100 flex items-center gap-1 transition-colors select-none font-bold"
                          >
                            <MessageSquare className="h-3 w-3 text-emerald-600" /> Inquire
                          </a>
                          <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-white rounded-xl text-center border border-slate-100">
                  <p className="text-xs text-slate-400">You have not bought any books yet.</p>
                </div>
              )}
            </div>

            {/* List Reservations */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <BookMarked className="h-4 w-4 text-indigo-500" /> Saved Books to Pick-up ({myReservations.length})
              </h3>
              
              {myReservations.length > 0 ? (
                <div className="space-y-2.5">
                  {myReservations.map(r => (
                    <div key={r.id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{r.bookTitle}</h4>
                          <span className="text-[10px] text-slate-400 font-medium">We will save it until: {r.expectedPurchaseDate}</span>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          r.status === 'Approved' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/10' :
                          r.status === 'Completed' ? 'bg-green-50 text-green-700 ring-1 ring-green-600/10' :
                          r.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/10' :
                          'bg-amber-50 text-amber-800 ring-1 ring-amber-600/10'
                        }`}>
                          {r.status}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-100">
                        <span>Save ID: #{r.id.substring(4, 8)}</span>
                        <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-white rounded-xl text-center border border-slate-100">
                  <p className="text-xs text-slate-400">You have no saved books right now.</p>
                </div>
              )}
            </div>

            {/* List Book requests */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <PlusCircle className="h-4 w-4 text-amber-500" /> Books asked for ({myRequests.length})
              </h3>
              
              {myRequests.length > 0 ? (
                <div className="space-y-2.5">
                  {myRequests.map(r => (
                    <div key={r.id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">"{r.bookTitle}"</h4>
                          {r.author && <span className="text-[10px] text-slate-400 font-medium">By {r.author}</span>}
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          r.status === 'Completed' ? 'bg-green-50 text-green-700 ring-1 ring-green-600/10' :
                          r.status === 'Available' ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-600/10' :
                          'bg-indigo-50 text-indigo-800 ring-1 ring-indigo-600/10 animate-pulse'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                      
                      <p className="text-[10px] bg-slate-50 p-2 rounded-lg text-slate-500 italic border border-slate-100">
                        " {r.notes} "
                      </p>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                        <span>Ref ID: #{r.id.substring(4, 8)}</span>
                        <span>Requested: {new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-white rounded-xl text-center border border-slate-100">
                  <p className="text-xs text-slate-400">You have not asked for any other books yet.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === 'profile' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center space-y-4">
              <div className="h-16 w-16 mx-auto rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">{currentUser?.fullName}</h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{currentUser?.phoneNumber}</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 text-left border border-slate-100 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/50 pb-1.5">ABOUT MY PROFILE</h4>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Day Joined:</span>
                  <span className="font-semibold">{currentUser ? new Date(currentUser.createdAt).toLocaleDateString() : ''}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>My Account:</span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Book Reader</span>
                </div>
              </div>

              <button 
                onClick={logoutUser}
                className="w-full flex items-center justify-center gap-2 py-2.5 font-semibold text-xs text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-xl cursor-pointer transition-all active:scale-[0.98]"
              >
                <LogOut className="h-4.5 w-4.5" /> Log Out / Bye Bye
              </button>
            </div>

            <SocialShare />
          </motion.div>
        )}

      </main>

      {/* MODAL 1: ORDER BOOK MODAL */}
      <AnimatePresence>
        {showOrderModal && selectedBook && (
          <div className="absolute inset-0 z-30 flex items-end justify-center bg-transparent backdrop-blur-xs select-none">
            {/* Backdrop click closer */}
            <div onClick={() => setShowOrderModal(false)} className="absolute inset-0 bg-slate-900/40"></div>
            
            {/* Form Drawer */}
            <motion.div 
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="relative w-full max-h-[90%] overflow-y-auto bg-white rounded-t-2xl shadow-xl z-40 border-t border-slate-100 px-6 py-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-indigo-600" /> Buy Your Book
                </h3>
                <button 
                  onClick={() => setShowOrderModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-100 font-bold text-sm cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="flex items-center gap-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/30">
                <div className="h-10 w-8 bg-slate-100 overflow-hidden rounded shadow-sm shrink-0">
                  <img src={selectedBook.imageUrl} alt="" className="h-full w-full object-cover" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{selectedBook.title}</h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Book Type: <strong className="text-indigo-600 font-bold">{formData.orderType} copy</strong>
                  </p>
                </div>
              </div>

              <form onSubmit={handleOrderSubmit} className="space-y-3.5 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">YOUR NAME *</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium outline-none"
                    placeholder="Type your name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">YOUR PHONE NUMBER *</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium outline-none"
                    placeholder="Type your phone number"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">HOW MANY COPIES? *</label>
                    <input 
                      type="number" 
                      min={1} 
                      max={10}
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">TYPE OF BOOK</label>
                    <input 
                      type="text"
                      value={formData.orderType}
                      disabled
                      className="w-full bg-slate-100 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 font-semibold outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    {formData.orderType === 'PDF' ? 'YOUR EMAIL *' : 'YOUR HOME ADDRESS FOR DELIVERY *'}
                  </label>
                  <input 
                    type="text" 
                    value={formData.deliveryLocation}
                    onChange={(e) => setFormData({ ...formData, deliveryLocation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium outline-none"
                    placeholder={formData.orderType === 'PDF' ? 'your@email.com' : 'Write your address here'}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">EXTRA NOTES (IF ANY)</label>
                  <input 
                    type="text" 
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium outline-none"
                    placeholder="e.g. Call my phone when you arrive"
                  />
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-center text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span>Total Price to Pay:</span>
                    <strong className="text-indigo-600 text-sm font-extrabold font-mono">
                      KES {((formData.orderType === 'PDF' && selectedBook?.pdfPrice ? selectedBook.pdfPrice : selectedBook?.price || 0) * formData.quantity).toLocaleString()}
                    </strong>
                  </div>
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" /> {formError}
                  </div>
                )}

                {formSuccess && (
                  <div className="p-3 rounded-xl bg-green-50 text-green-700 text-xs font-semibold flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0" /> {formSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 font-bold rounded-xl text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/15 text-center cursor-pointer transition-all active:scale-[0.98]"
                >
                  Buy book now!
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: RESERVE FOR PICKUP MODAL */}
      <AnimatePresence>
        {showReserveModal && selectedBook && (
          <div className="absolute inset-0 z-30 flex items-end justify-center bg-transparent backdrop-blur-xs select-none">
            <div onClick={() => setShowReserveModal(false)} className="absolute inset-0 bg-slate-900/40"></div>
            
            <motion.div 
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="relative w-full max-h-[90%] overflow-y-auto bg-white rounded-t-2xl shadow-xl z-40 border-t border-slate-100 px-6 py-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <BookMarked className="h-4 w-4 text-indigo-600" /> Save for Pick-up
                </h3>
                <button onClick={() => setShowReserveModal(false)} className="p-1 rounded-full text-slate-400 font-bold text-sm cursor-pointer">&times;</button>
              </div>

              <div className="bg-indigo-50/55 p-3 rounded-xl border border-indigo-100/40 text-left">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-600 block">HOW SAVING WORKS</span>
                <p className="text-[10px] text-slate-600 leading-normal mt-0.5">
                  We will save a real book for you at our shop under your name. You do not pay anything now! You pay when you pick it up.
                </p>
              </div>

              <form onSubmit={handleReserveSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">YOUR NAME *</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium outline-none"
                    placeholder="Type your name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">YOUR PHONE NUMBER *</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium outline-none"
                    placeholder="Type your phone number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">WHEN WILL YOU COME PICK IT UP? *</label>
                  <input 
                    type="date" 
                    value={formData.expectedPurchaseDate}
                    onChange={(e) => setFormData({ ...formData, expectedPurchaseDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold outline-none"
                    required
                  />
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" /> {formError}
                  </div>
                )}

                {formSuccess && (
                  <div className="p-3 rounded-xl bg-green-50 text-green-750 text-xs font-semibold flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0" /> {formSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 font-bold rounded-xl text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/15 text-center cursor-pointer transition-all"
                >
                  Save my book!
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: FLOATING REQUEST MODAL IN BOTTOM RAIL */}
      <AnimatePresence>
        {showRequestModal && (
          <div className="absolute inset-0 z-30 flex items-end justify-center bg-transparent backdrop-blur-xs select-none">
            <div onClick={() => setShowRequestModal(false)} className="absolute inset-0 bg-slate-900/40"></div>
            
            <motion.div 
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="relative w-full max-h-[90%] overflow-y-auto bg-white rounded-t-2xl shadow-xl z-40 border-t border-slate-100 px-6 py-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <PlusCircle className="h-4 w-4 text-indigo-600" /> Ask for a book
                </h3>
                <button onClick={() => setShowRequestModal(false)} className="p-1 rounded-full text-slate-400 font-bold text-sm cursor-pointer">&times;</button>
              </div>

              <form onSubmit={handleRequestSubmit} className="space-y-3.5 text-left">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">YOUR NAME *</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium outline-none"
                    placeholder="Type your name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">YOUR PHONE NUMBER *</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium outline-none"
                    placeholder="Type your phone number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">BOOK NAME *</label>
                  <input 
                    type="text" 
                    value={formData.requestBookTitle}
                    onChange={(e) => setFormData({ ...formData, requestBookTitle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium outline-none"
                    placeholder="What is the book called?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">WRITER (IF YOU KNOW IT)</label>
                  <input 
                    type="text" 
                    value={formData.requestAuthor}
                    onChange={(e) => setFormData({ ...formData, requestAuthor: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium outline-none"
                    placeholder="Who wrote it?"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">TELL US MORE ABOUT THIS BOOK *</label>
                  <textarea 
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2 text-xs text-slate-700 font-medium outline-none"
                    placeholder="Tell me what language or edition cover you prefer."
                    required
                  />
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" /> {formError}
                  </div>
                )}

                {formSuccess && (
                  <div className="p-3 rounded-xl bg-green-50 text-green-750 text-xs font-semibold flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0" /> {formSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 font-bold rounded-xl text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/15 text-center cursor-pointer transition-all"
                >
                  Send Book Request
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Global Navigation bar (iOS Styled TabBar) */}
      <nav className="absolute bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-t border-indigo-50 py-2.5 px-3 flex justify-around shadow-lg select-none">
        <button
          onClick={() => {
            setSelectedBook(null); // Clear any open book detail
            setActiveTab('explore');
          }}
          className={`flex flex-col items-center gap-1 p-1 text-[10px] font-black tracking-tight transition-all cursor-pointer ${
            activeTab === 'explore' ? 'text-indigo-600 scale-102' : 'text-slate-400 hover:text-indigo-600'
          }`}
        >
          <BookOpen className="h-[18px] w-[18px]" />
          Explore
        </button>

        <button
          onClick={() => setActiveTab('request')}
          className={`flex flex-col items-center gap-1 p-1 text-[10px] font-black tracking-tight transition-all cursor-pointer ${
            activeTab === 'request' ? 'text-indigo-600 scale-102' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <PlusCircle className="h-[18px] w-[18px]" />
          Request Book
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 p-1 text-[10px] font-black tracking-tight transition-all cursor-pointer ${
            activeTab === 'history' ? 'text-indigo-600 scale-102' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <ShoppingBag className="h-[18px] w-[18px]" />
            {myNotifications.some(n => !n.read) && (
              <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-rose-600"></span>
            )}
          </div>
          My Activity
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 p-1 text-[10px] font-black tracking-tight transition-all cursor-pointer ${
            activeTab === 'profile' ? 'text-indigo-600 scale-102' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <User className="h-[18px] w-[18px]" />
          Account
        </button>
      </nav>
    </div>
  );
};
