import React, { useState } from 'react';
import { useEpicReadsStore } from '../store';
import { Book, Order, Reservation, BookRequest, StockStatus, OrderStatus, ReservationStatus, BookRequestStatus } from '../types';
import { motion } from 'motion/react';
import { 
  BarChart, 
  BookOpen, 
  ShoppingBag, 
  BookMarked, 
  HelpCircle, 
  Users, 
  LogOut, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  ToggleLeft, 
  ToggleRight, 
  FileText, 
  Activity, 
  TrendingUp, 
  DollarSign, 
  ChevronRight, 
  Clock 
} from 'lucide-react';

interface AdminDashboardProps {
  store: ReturnType<typeof useEpicReadsStore>;
}

type AdminTab = 'stats' | 'books' | 'orders' | 'requests' | 'customers' | 'profile';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ store }) => {
  const {
    books,
    orders,
    reservations,
    bookRequests,
    registeredUsers,
    activityLogs,
    pdfBooksEnabled,
    logoutUser,
    addCatalogBook,
    updateCatalogBook,
    deleteCatalogBook,
    updateOrderStatus,
    updateReservationStatus,
    updateBookRequestStatus,
    setPdfBooksEnabled
  } = store;

  // Selected subtab selection
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');

  // Book Editing Modal context
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [showAddBook, setShowAddBook] = useState<boolean>(false);

  // Camera & File upload helper states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [useUrlInstead, setUseUrlInstead] = useState<boolean>(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.error("Video play failed:", e));
      }
    } catch (err: any) {
      console.error("Camera access error: ", err);
      setCameraError(err.message || 'Could not access device camera');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 645;
      canvas.height = video.videoHeight || 485;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Img = canvas.toDataURL('image/jpeg', 0.8);
        setBookForm(prev => ({ ...prev, imageUrl: base64Img }));
      }
      stopCamera();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setBookForm(prev => ({ ...prev, imageUrl: event.target.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCloseModal = () => {
    stopCamera();
    setShowAddBook(false);
    setEditingBook(null);
  };

  // Form entries for Adding/Editing books
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    category: '',
    description: '',
    price: 0,
    pdfPrice: '' as string | number,
    imageUrl: '',
    quantity: 0
  });

  const handleOpenAdd = () => {
    setBookForm({
      title: '',
      author: '',
      category: 'Self-Help',
      description: '',
      price: 1000,
      pdfPrice: 350,
      imageUrl: '/src/assets/images/atomic_habits_cover_1781561836677.jpg',
      quantity: 10
    });
    setShowAddBook(true);
    setEditingBook(null);
  };

  const handleOpenEdit = (bk: Book) => {
    setEditingBook(bk);
    setBookForm({
      title: bk.title,
      author: bk.author,
      category: bk.category,
      description: bk.description,
      price: bk.price,
      pdfPrice: bk.pdfPrice || '',
      imageUrl: bk.imageUrl,
      quantity: bk.quantity
    });
    setShowAddBook(true);
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const bookPayload = {
      title: bookForm.title,
      author: bookForm.author,
      category: bookForm.category,
      description: bookForm.description,
      price: Number(bookForm.price),
      pdfPrice: bookForm.pdfPrice ? Number(bookForm.pdfPrice) : undefined,
      imageUrl: bookForm.imageUrl || '/src/assets/images/atomic_habits_cover_1781561836677.jpg',
      quantity: Number(bookForm.quantity),
      stockStatus: (Number(bookForm.quantity) === 0 ? 'Out of Stock' : (Number(bookForm.quantity) <= 3 ? 'Low Stock' : 'Available')) as StockStatus
    };

    if (editingBook) {
      // Update catalog
      await updateCatalogBook({
        ...bookPayload,
        id: editingBook.id,
        pdfUrl: editingBook.pdfUrl
      });
      store.logActivity('admin', 'James (Admin)', `updated title details for "${bookPayload.title}"`);
    } else {
      // Add new book
      await addCatalogBook(bookPayload);
      store.logActivity('admin', 'James (Admin)', `added new book "${bookPayload.title}" to catalog`);
    }

    handleCloseModal();
  };

  const handleDeleteBook = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove "${name}" from the bookstore catalog?`)) {
      await deleteCatalogBook(id);
      store.logActivity('admin', 'James (Admin)', `deleted book "${name}"`);
    }
  };

  // Status updaters triggers
  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    await updateOrderStatus(orderId, status);
    store.logActivity('admin', 'James (Admin)', `updated order #${orderId.substring(4, 8)} status to ${status}`);
  };

  const handleResStatusUpdate = async (resId: string, status: ReservationStatus) => {
    await updateReservationStatus(resId, status);
    store.logActivity('admin', 'James (Admin)', `marked reservation #${resId.substring(4, 8)} as ${status}`);
  };

  const handleReqStatusUpdate = async (reqId: string, status: BookRequestStatus) => {
    await updateBookRequestStatus(reqId, status);
    store.logActivity('admin', 'James (Admin)', `updated sourcing request #${reqId.substring(4, 8)} state to ${status}`);
  };

  // PDF file upload simulators
  const handleUploadPDFFile = (bk: Book) => {
    const virtualFileName = `${bk.title.toLowerCase().replace(/ /g, '_')}_final.pdf`;
    updateCatalogBook({
      ...bk,
      pdfUrl: virtualFileName,
      pdfPrice: bk.pdfPrice || 150 // Seed standard fallback
    });
    alert(`File "${virtualFileName}" uploaded successfully into active storage and soft-copy delivery is live!`);
    store.logActivity('admin', 'James (Admin)', `uploaded soft-copy PDF asset for "${bk.title}"`);
  };

  const handleDeletePDFFile = (bk: Book) => {
    updateCatalogBook({
      ...bk,
      pdfUrl: undefined
    });
    alert(`Soft-copy PDF removed for "${bk.title}".`);
    store.logActivity('admin', 'James (Admin)', `removed soft-copy PDF asset for "${bk.title}"`);
  };

  return (
    <div className="flex h-full flex-col bg-indigo-50/70 overflow-hidden relative text-left">
      {/* Top Header bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between bg-white border-b border-indigo-100 px-4 py-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <img 
              src={store.jamesAvatar} 
              alt="James Portrait" 
              className="w-9 h-9 rounded-full object-cover border border-indigo-100 shadow-xs select-none" 
            />
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-indigo-505 border-2 border-white animate-pulse"></span>
          </div>
          <div>
            <h1 className="text-sm font-black text-indigo-950 tracking-tight leading-none pt-0.5">EpicReads <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Admin</span></h1>
            <p className="text-[10px] text-indigo-600/80 font-black mt-0.5">My Workspace & Desk</p>
          </div>
        </div>

        <button 
          onClick={logoutUser}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-[#eaeefc] font-bold text-xs text-indigo-700 cursor-pointer transition-all border border-indigo-100"
        >
          <LogOut className="h-3.5 w-3.5 text-indigo-600" /> Logout
        </button>
      </header>

      {/* Admin Tab rails selectors */}
      <nav className="flex bg-white px-3 py-2 gap-1.5 text-xs font-bold border-b border-indigo-50 overflow-x-auto select-none no-scrollbar">
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl transition-all font-bold shrink-0 cursor-pointer ${
            activeTab === 'stats' ? 'text-indigo-900 bg-indigo-50 border border-indigo-100/60' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/30'
          }`}
        >
          <BarChart className="h-4 w-4 text-indigo-600" /> How we are doing
        </button>
        <button
          onClick={() => setActiveTab('books')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl transition-all font-bold shrink-0 cursor-pointer ${
            activeTab === 'books' ? 'text-indigo-900 bg-indigo-50 border border-indigo-100/60' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/30'
          }`}
        >
          <BookOpen className="h-4 w-4 text-indigo-600" /> Books on Shelves
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl transition-all font-bold shrink-0 cursor-pointer ${
            activeTab === 'orders' ? 'text-indigo-900 bg-indigo-50 border border-indigo-100/60' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/30'
          }`}
        >
          <ShoppingBag className="h-4 w-4 text-indigo-600" /> Deliveries & Saves
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl transition-all font-bold shrink-0 cursor-pointer ${
            activeTab === 'requests' ? 'text-indigo-905 bg-indigo-50 border border-indigo-100/60' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/30'
          }`}
        >
          <HelpCircle className="h-4 w-4 text-indigo-600" /> Special Requests
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl transition-all font-bold shrink-0 cursor-pointer ${
            activeTab === 'customers' ? 'text-indigo-900 bg-indigo-50 border border-indigo-100/60' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/30'
          }`}
        >
          <Users className="h-4 w-4 text-indigo-600" /> People list
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl transition-all font-bold shrink-0 cursor-pointer ${
            activeTab === 'profile' ? 'text-indigo-900 bg-indigo-50 border border-indigo-100/60' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/30'
          }`}
        >
          <img 
            src={store.jamesAvatar} 
            alt="My Profile" 
            className="w-4 h-4 rounded-full object-cover border border-indigo-200"
          />
          My Profile
        </button>
      </nav>

      {/* Main Content Pane */}
      <main className="flex-1 overflow-y-auto p-4 pb-12">
        
        {/* TAB 1: REPORTS & LOGS STATS */}
        {activeTab === 'stats' && (
          <div className="space-y-4 pt-1">
            {/* Quick Metrics grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl shadow-xs border border-indigo-100 flex flex-col justify-between min-h-[110px]">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Books we have</span>
                  <span className="text-emerald-500 text-[9px] font-bold bg-emerald-50 border border-emerald-100 px-2.3 py-0.5 rounded-full">+12 new</span>
                </div>
                <div className="flex items-end justify-between mt-3">
                  <h2 className="text-2xl font-black text-indigo-950 font-sans tracking-tight">{books.length} Books</h2>
                  <BookOpen className="h-5 w-5 text-indigo-500/80" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl shadow-xs border border-indigo-100 flex flex-col justify-between min-h-[110px]">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Orders to deliver</span>
                  <span className="text-indigo-500 text-[9px] font-bold bg-indigo-50 border border-indigo-100 px-2.3 py-0.5 rounded-full">Processing</span>
                </div>
                <div className="flex items-end justify-between mt-3">
                  <h2 className="text-2xl font-black text-indigo-950 font-sans tracking-tight">{orders.length} Holds</h2>
                  <ShoppingBag className="h-5 w-5 text-indigo-500/80" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl shadow-xs border border-indigo-100 flex flex-col justify-between min-h-[110px]">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Saved books</span>
                  <span className="text-amber-500 text-[9px] font-bold bg-amber-50 border border-amber-100 px-2.3 py-0.5 rounded-full">Holds</span>
                </div>
                <div className="flex items-end justify-between mt-3">
                  <h2 className="text-2xl font-black text-indigo-950 font-sans tracking-tight">{reservations.length} items</h2>
                  <BookMarked className="h-5 w-5 text-indigo-500/80" />
                </div>
              </div>

              <div className="bg-indigo-600 p-5 rounded-3xl shadow-md text-white flex flex-col justify-between min-h-[110px] text-left">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-indigo-100 font-black uppercase tracking-wider block">Special requests</span>
                  <span className="text-white text-[9px] font-black bg-white/20 px-2.3 py-0.5 rounded-full">Active</span>
                </div>
                <div className="flex items-end justify-between mt-3">
                  <h2 className="text-2xl font-black font-sans leading-none">{bookRequests.length} logs</h2>
                  <HelpCircle className="h-5 w-5 text-indigo-100" />
                </div>
              </div>
            </div>

            {/* Total platform users card detail */}
            <div className="bg-white rounded-3xl p-5 border border-indigo-100 shadow-xs flex justify-between items-center bg-gradient-to-tr from-indigo-50/20 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100/50"><Users className="h-5 w-5" /></div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-950">People who read with us</h4>
                  <p className="text-[10px] text-slate-400 font-semibold">{registeredUsers.length} readers are online in KES marketplace</p>
                </div>
              </div>
              <span className="text-2xl font-black text-indigo-950 font-mono">{registeredUsers.length}</span>
            </div>

            {/* PDF Soft copy feature manager settings toggle */}
            <div className="bg-white rounded-3xl p-5 border border-indigo-100 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-indigo-950">Read on Phone (PDF copies)</h4>
                  <p className="text-[10px] text-slate-400 font-semibold">Let readers buy a copy to read on their phone.</p>
                </div>
                <button 
                  onClick={() => {
                    setPdfBooksEnabled(!pdfBooksEnabled);
                    store.logActivity('admin', 'James (Admin)', `${!pdfBooksEnabled ? 'Enabled' : 'Disabled'} digital PDF books globally`);
                  }}
                  className="rounded-full text-indigo-600 cursor-pointer shrink-0"
                >
                  {pdfBooksEnabled ? (
                    <ToggleRight className="h-9 w-9 text-indigo-600" />
                  ) : (
                    <ToggleLeft className="h-9 w-9 text-slate-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Activity history logs stream */}
            <div className="bg-indigo-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden border border-indigo-950 space-y-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-800 rounded-bl-full opacity-50"></div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-100 flex items-center gap-1.5 relative z-10 font-mono">
                <Activity className="h-4 w-4 text-emerald-400 animate-pulse" /> Everything that happened
              </h4>
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 relative z-10 scrollbar-none">
                {activityLogs.map((log) => (
                  <div key={log.id} className="text-xs flex items-start gap-2.5 p-3.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-emerald-450 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-indigo-100">
                        {log.userName} <span className="font-normal text-indigo-300">{log.actionDescription}</span>
                      </p>
                      <p className="text-[10px] uppercase tracking-tighter text-indigo-400 mt-1">{new Date(log.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MANAGE CATALOG BOOKS */}
        {activeTab === 'books' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">All Active Books</h3>
              <button 
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 py-2 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs cursor-pointer transition-all shadow-sm"
              >
                <Plus className="h-4 w-4" /> Put new book on shelf
              </button>
            </div>

            <div className="space-y-4">
              {books.map((bk) => (
                <div key={bk.id} className="bg-white rounded-3xl p-5 border border-indigo-100 shadow-xs flex gap-5 hover:border-indigo-200/80 transition-colors">
                  <div className="w-16 aspect-[3/4] bg-indigo-50 overflow-hidden rounded-2xl border border-indigo-100 shrink-0 shadow-sm">
                    <img src={bk.imageUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-sm font-black text-indigo-950 line-clamp-1">{bk.title}</h4>
                        <div className="flex gap-1.5 self-start shrink-0">
                          <button 
                            onClick={() => handleOpenEdit(bk)}
                            className="p-1.5 rounded-xl text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteBook(bk.id, bk.title)}
                            className="p-1.5 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">By {bk.author} &bull; <span className="bg-indigo-50 px-2 py-0.5 rounded-full text-[9px] uppercase font-bold text-indigo-700 border border-indigo-100/40">{bk.category}</span></p>
                    </div>

                    <div className="flex justify-between items-end border-t border-indigo-50 pt-3 mt-3 gap-2">
                      <div className="text-[11px] text-slate-500 leading-tight space-y-1">
                        <span className="block font-semibold">Real Book: <strong className="text-indigo-950 font-bold">KES {bk.price}</strong> ({bk.quantity} on shelf)</span>
                        {pdfBooksEnabled && (
                          <span className="block font-semibold">
                            PDF Version: {bk.pdfPrice ? <strong className="text-emerald-700 font-bold">KES {bk.pdfPrice}</strong> : <span className="text-rose-500 font-bold uppercase text-[9px]">Inactive</span>}
                          </span>
                        )}
                      </div>

                      {/* PDF direct quick files management */}
                      {pdfBooksEnabled && (
                        <div className="flex gap-1 shrink-0">
                          {bk.pdfUrl ? (
                            <button 
                              onClick={() => handleDeletePDFFile(bk)}
                              title="Delete PDF soft copy"
                              className="px-2.5 py-1 bg-rose-5/50 text-rose-600 hover:bg-rose-100 border border-rose-100 rounded-xl text-[9px] font-black shrink-0 cursor-pointer transition-colors"
                            >
                              No PDF
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleUploadPDFFile(bk)}
                              title="Upload PDF Soft copy"
                              className="px-2.5 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 rounded-xl text-[9px] font-black shrink-0 cursor-pointer transition-colors"
                            >
                              Yes PDF
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ORDERS & RESERVED HOLDS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            
            {/* Orders list block */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">Orders to deliver</h3>
              
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((o) => (
                    <div key={o.id} className="bg-white rounded-3xl p-5 border border-indigo-100 shadow-xs space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[9px] font-black text-indigo-400 block tracking-wider uppercase font-mono">ORDER ID: #{o.id.substring(4, 9)}</span>
                          <h4 className="text-sm font-black text-indigo-950 mt-1 leading-tight">{o.bookTitle}</h4>
                          <p className="text-xs text-slate-400 font-semibold mt-0.5">{o.orderType} copy &bull; Price: KES {o.totalPrice}</p>
                        </div>

                        {/* Order status picker */}
                        <select 
                          value={o.status}
                          onChange={(e) => handleStatusUpdate(o.id, e.target.value as OrderStatus)}
                          className="text-[11px] font-extrabold border border-indigo-200 bg-indigo-50/50 rounded-xl px-2.5 py-1 text-indigo-950 outline-none cursor-pointer"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div className="bg-indigo-50/40 p-3.5 rounded-2xl border border-indigo-100/50 space-y-1.5 text-xs text-slate-600">
                        <p className="font-extrabold text-[9px] tracking-wider text-indigo-400 uppercase leading-none pb-1 border-b border-indigo-100/50">DELIVERY DETAILS</p>
                        <p className="font-bold text-indigo-950 mt-1.5">{o.customerName} ({o.phoneNumber})</p>
                        <p className="mt-0.5 truncate text-slate-500"><strong className="text-indigo-900/80 font-bold">Location:</strong> {o.deliveryLocation}</p>
                        {o.notes && <p className="mt-1 text-slate-400 italic">" {o.notes} "</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-white rounded-3xl text-center border border-indigo-100 shadow-xs">
                  <p className="text-xs text-slate-400 font-medium">Nobody has ordered books yet!</p>
                </div>
              )}
            </div>

            {/* Reservations holds list */}
            <div className="space-y-3 pt-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">Saved books list</h3>
              
              {reservations.length > 0 ? (
                <div className="space-y-4">
                  {reservations.map((r) => (
                    <div key={r.id} className="bg-white rounded-3xl p-5 border border-indigo-100 shadow-xs space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[9px] font-black text-indigo-400 block tracking-wider uppercase font-mono">HOLD ID: #{r.id.substring(4, 10)}</span>
                          <h4 className="text-sm font-black text-indigo-950 mt-1 leading-tight">{r.bookTitle}</h4>
                          <span className="text-[11px] block text-slate-400 mt-1 font-semibold">When they will come pick it up: <strong className="text-emerald-700 font-bold">{r.expectedPurchaseDate}</strong></span>
                        </div>

                        {/* Status selector holding */}
                        <select 
                          value={r.status}
                          onChange={(e) => handleResStatusUpdate(r.id, e.target.value as ReservationStatus)}
                          className="text-[11px] font-extrabold border border-indigo-200 bg-indigo-50/50 rounded-xl px-2.5 py-1 text-indigo-950 outline-none cursor-pointer"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div className="flex justify-between text-xs text-slate-600 bg-indigo-50/30 p-3.5 rounded-2xl border border-indigo-100/50">
                        <span>Saved by: <strong className="text-indigo-950 font-bold">{r.customerName}</strong> ({r.phoneNumber})</span>
                        <span className="font-semibold text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-white rounded-3xl text-center border border-indigo-100 shadow-xs">
                  <p className="text-xs text-slate-400 font-semibold">Nobody is saving a book right now.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SOURCING REQUESTS */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">Books that readers asked for</h3>
            
            {bookRequests.length > 0 ? (
              <div className="space-y-4">
                {bookRequests.map((req) => (
                  <div key={req.id} className="bg-white rounded-3xl p-5 border border-indigo-100 shadow-xs space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[9px] font-black text-indigo-400 block tracking-wider uppercase font-mono">REQUEST ID: #{req.id.substring(4, 8)}</span>
                        <h4 className="text-sm font-black text-indigo-950 mt-1">"{req.bookTitle}"</h4>
                        {req.author && <p className="text-xs text-slate-400 mt-1 font-semibold">By {req.author}</p>}
                      </div>

                      {/* Status select list */}
                      <select 
                        value={req.status}
                        onChange={(e) => handleReqStatusUpdate(req.id, e.target.value as BookRequestStatus)}
                        className="text-[11px] font-extrabold border border-indigo-200 bg-indigo-50/50 rounded-xl px-2.5 py-1 text-indigo-950 outline-none cursor-pointer"
                      >
                        <option value="Sourcing">Sourcing</option>
                        <option value="Available">Available</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>

                    <div className="bg-indigo-50/40 p-3.5 rounded-2xl border border-indigo-100/50 text-xs text-slate-500 space-y-1.5">
                      <p className="font-bold text-indigo-950"><span className="text-slate-400 font-semibold">Asked by:</span> {req.customerName} ({req.phoneNumber})</p>
                      <p className="mt-1 italic text-slate-500">" {req.notes} "</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-white rounded-3xl text-center border border-indigo-100 shadow-xs">
                <p className="text-xs text-slate-400 font-semibold">No custom sourcing book requests posted yet.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PATRONS CUSTOMER LEDGER DATABASE */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">All Our Awesome Readers</h3>
            <div className="bg-white rounded-3xl border border-indigo-100 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-indigo-50/70 border-b border-indigo-100 text-indigo-900/80 font-black text-[10px] tracking-wide uppercase">
                      <th className="py-3 px-4">READER DETAIL</th>
                      <th className="py-3 px-4">PHONE / EMAIL</th>
                      <th className="py-3 px-4 text-right">DAY THEY JOINED</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-50">
                    {registeredUsers.map((user) => (
                      <tr key={user.uid} className="hover:bg-indigo-50/20 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-black text-indigo-950">{user.fullName}</p>
                          {user.email && !user.email.endsWith('@epicreads.com') && (
                            <span className="text-[10px] text-slate-400 font-semibold block">{user.email}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono font-bold text-[11px]">{user.phoneNumber || 'Not provided'}</td>
                        <td className="py-3 px-4 text-right text-slate-400 font-bold">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: ADMIN PROFILE MANAGER */}
        {activeTab === 'profile' && (
          <div className="space-y-6 pt-1">
            <div className="bg-white rounded-3xl p-6 border border-indigo-100/60 shadow-xs">
              <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-indigo-50">
                <div className="relative shrink-0">
                  <img 
                    src={store.jamesAvatar} 
                    alt="James Current Avatar" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100 shadow-md"
                  />
                  <span className="absolute bottom-1 right-1 h-[14px] w-[14px] rounded-full bg-emerald-500 border-2 border-white animate-pulse"></span>
                </div>
                <div className="text-center md:text-left space-y-1">
                  <h3 className="text-lg font-black text-indigo-950">James Kirimi</h3>
                  <p className="text-xs text-indigo-600 font-bold font-serif italic">Primary Curator & Shop Admin &bull; Nairobi</p>
                  <p className="text-[11px] text-slate-400 font-medium">Manage how you appear to readers on the book gallery shelves.</p>
                </div>
              </div>

              {/* PROFILE IMAGE SELECTION ENGINE */}
              <div className="pt-6 space-y-4 text-left">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500">Pick or Upload a Profile Image</h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { name: 'Classic Suit Portrait', url: '/src/assets/images/james_avatar_1781665504357.jpg' },
                    { name: 'Casual Studio Portrait', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
                    { name: 'Warm Outdoors Smile', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80' },
                    { name: 'Tech Curator Glass', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80' }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => store.updateJamesAvatar(preset.url)}
                      className={`p-2 rounded-2xl border transition-all text-left flex items-center gap-2.5 cursor-pointer bg-slate-50/50 hover:bg-indigo-50/50 ${
                        store.jamesAvatar === preset.url ? 'border-indigo-600 ring-2 ring-indigo-600/10 bg-indigo-50/30' : 'border-slate-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-8 h-8 rounded-full object-cover border border-white shrink-0 shadow-xs" />
                      <div className="truncate">
                        <p className="text-[10px] font-bold text-slate-700 truncate">{preset.name}</p>
                        <span className="text-[8px] text-slate-400 font-semibold block">Preset {idx + 1}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-[10.5px] font-bold text-slate-700">Custom Avatar Upload or Direct Address</h5>
                      <p className="text-[9px] text-slate-400 font-medium">Select a local photo file or copy-paste any visual web URL directly.</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all shrink-0">
                      <span>Choose File...</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                store.updateJamesAvatar(event.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>

                    <div className="flex-1 flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Paste image web URL link here..."
                        value={store.jamesAvatar.startsWith('data:') ? '' : store.jamesAvatar}
                        onChange={(e) => {
                          if (e.target.value.trim()) {
                            store.updateJamesAvatar(e.target.value.trim());
                          }
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none text-xs text-slate-700 font-medium focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Profile Identity statistics info cards */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-4.5 bg-indigo-50/25 border border-indigo-100/30 rounded-2xl text-left">
                    <span className="text-[9px] font-black tracking-widest text-indigo-500 uppercase block mb-1">YOUR DISPLAY ROLE</span>
                    <p className="font-extrabold text-xs text-indigo-950">EpicReads Owner & Founder</p>
                    <p className="text-[9.5px] text-slate-500 font-medium mt-1">Allows unlimited full metadata changes, inventory deletions, status toggles, and PDF capabilities.</p>
                  </div>
                  <div className="p-4.5 bg-indigo-50/25 border border-indigo-100/30 rounded-2xl text-left">
                    <span className="text-[9px] font-black tracking-widest text-indigo-500 uppercase block mb-1">SYSTEM PASSWORD STATUS</span>
                    <p className="font-extrabold text-xs text-indigo-950">Active Session Passcode</p>
                    <p className="text-[9.5px] text-slate-500 font-medium mt-1">James' authenticated session holds. Password is blank to readers to maintain premium security.</p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </main>

      {/* DETAILED BOOK CREATIVE CRUD MODAL EDITOR */}
      {showAddBook && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-transparent backdrop-blur-xs select-none p-4">
          <div onClick={handleCloseModal} className="absolute inset-0 bg-slate-900/40"></div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-white rounded-2xl shadow-xl z-40 border border-slate-100 overflow-hidden"
          >
            <div className="bg-indigo-950 text-white p-4 flex justify-between items-center">
              <h4 className="font-bold text-xs uppercase tracking-wider">{editingBook ? 'Change Book Details' : 'Add New Book'}</h4>
              <button onClick={handleCloseModal} className="p-1 font-bold rounded text-indigo-200 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleBookSubmit} className="p-4 space-y-3.5 max-h-[460px] overflow-y-auto text-xs text-left">
              {/* BOOK COVER IMAGE MANAGEMENT PANEL */}
              <div className="space-y-2">
                <label className="block text-[10.5px] font-black text-slate-500 uppercase tracking-wider">Book Cover Image</label>
                
                {/* Visual Viewport frame representing active cover */}
                <div className="relative aspect-[3/2] w-full bg-slate-150 border border-dashed border-indigo-100 rounded-2xl overflow-hidden flex flex-col items-center justify-center bg-slate-50">
                  {isCameraActive ? (
                    // Live camera viewport view
                    <div className="absolute inset-0 bg-black flex flex-col justify-between">
                      <video 
                        ref={videoRef} 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-3 px-3">
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="px-3 py-1.5 bg-emerald-605 bg-emerald-600 font-bold text-[10px] text-white rounded-lg shadow-md cursor-pointer hover:bg-emerald-700 transition"
                        >
                          Snap Photo
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="px-3 py-1.5 bg-rose-600 font-bold text-[10px] text-white rounded-lg shadow-md cursor-pointer hover:bg-rose-700 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : bookForm.imageUrl ? (
                    // Image thumbnail preview frame
                    <div className="absolute inset-0 flex flex-col justify-end">
                      <img src={bookForm.imageUrl} alt="Book cover" className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setBookForm(prev => ({ ...prev, imageUrl: '' }))}
                          className="w-4 h-4 bg-black/60 rounded-full text-white font-bold opacity-80 hover:opacity-100 hover:bg-rose-600 transition flex items-center justify-center"
                          title="Remove Image"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Placeholder for when no image is selected
                    <div className="flex flex-col items-center p-4 text-center text-slate-400">
                      <BookOpen className="h-8 w-8 mb-1.5 text-indigo-200" />
                      <p className="text-[10px] font-semibold">Snap a photo of the book cover or upload a file</p>
                    </div>
                  )}
                </div>

                {cameraError && (
                  <p className="text-[11px] text-rose-500 font-bold">{cameraError}</p>
                )}

                {/* Cover Capture trigger actions */}
                <div className="flex gap-2 text-center">
                  <label className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[10px] rounded-xl border border-indigo-100 cursor-pointer flex items-center justify-center gap-1 transition-all select-none">
                    Select File
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </label>
                  <button
                    type="button"
                    onClick={startCamera}
                    disabled={isCameraActive}
                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-xl flex items-center justify-center gap-1 transition-all shadow-sm cursor-pointer disabled:opacity-40"
                  >
                    Use Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseUrlInstead(prev => !prev)}
                    className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-[10.5px] transition-all cursor-pointer"
                  >
                    {useUrlInstead ? 'Hide Link' : 'Use Link'}
                  </button>
                </div>

                {useUrlInstead && (
                  <div className="pt-1 select-text">
                    <label className="block text-[9.5px] font-black text-slate-450 mb-1">IMAGE URL LINK ADDRESS</label>
                    <input 
                      type="text" 
                      value={bookForm.imageUrl}
                      onChange={(e) => setBookForm({ ...bookForm, imageUrl: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-150 rounded-lg px-3 py-2 outline-none font-medium text-slate-600 text-[10.5px]"
                      placeholder="Or paste image URL here"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 mb-1">BOOK NAME *</label>
                  <input 
                    type="text" 
                    value={bookForm.title}
                    onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 outline-none font-bold"
                    placeholder="Book name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 mb-1">WRITER *</label>
                  <input 
                    type="text" 
                    value={bookForm.author}
                    onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 outline-none"
                    placeholder="James Clear"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 mb-1">WHICH SHELF? *</label>
                  <select
                    value={bookForm.category}
                    onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 outline-none"
                  >
                    <option value="Self-Help">Self-Help</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Business & Finance">Business & Finance</option>
                    <option value="Spiritual">Spiritual</option>
                    <option value="Fiction">Fiction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 mb-1">HOW MANY BOOKS? *</label>
                  <input 
                    type="number" 
                    value={bookForm.quantity}
                    onChange={(e) => setBookForm({ ...bookForm, quantity: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 outline-none font-semibold text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 mb-1">PRICE (KES) *</label>
                  <input 
                    type="number" 
                    value={bookForm.price}
                    onChange={(e) => setBookForm({ ...bookForm, price: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 outline-none font-bold text-indigo-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 mb-1">PRICE ON PHONE (PDF) *</label>
                  <input 
                    type="number" 
                    value={bookForm.pdfPrice}
                    onChange={(e) => setBookForm({ ...bookForm, pdfPrice: e.target.value ? Number(e.target.value) : '' })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 outline-none"
                    placeholder="e.g. 150"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-500 mb-1">ABOUT THIS BOOK *</label>
                <textarea 
                  value={bookForm.description}
                  onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 outline-none leading-relaxed"
                  placeholder="Explain what this book is about..."
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer text-center select-none shadow"
              >
                {editingBook ? 'Save changes' : 'Put this book on shelf!'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};
