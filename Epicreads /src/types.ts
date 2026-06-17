export interface UserProfile {
  uid: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  createdAt: string;
  isAdmin?: boolean;
}

export type StockStatus = 'Available' | 'Low Stock' | 'Out of Stock';

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  price: number; // In KES
  pdfPrice?: number; // In KES (optional soft copy price)
  pdfUrl?: string; // Optional PDF file path or link
  stockStatus: StockStatus;
  imageUrl: string;
  quantity: number;
}

export type OrderStatus = 'Pending' | 'Processing' | 'Delivered' | 'Cancelled';
export type OrderType = 'Physical' | 'PDF';

export interface Order {
  id: string;
  userId?: string;
  customerName: string;
  phoneNumber: string;
  bookId: string;
  bookTitle: string;
  quantity: number;
  deliveryLocation: string;
  notes?: string;
  totalPrice: number; // In KES
  orderType: OrderType;
  status: OrderStatus;
  createdAt: string;
  paymentMethod?: 'Cash' | 'M-Pesa';
  paymentStatus?: 'Unpaid' | 'Paid';
  mpesaReceipt?: string;
}

export type ReservationStatus = 'Pending' | 'Approved' | 'Completed' | 'Cancelled';

export interface Reservation {
  id: string;
  userId: string;
  customerName: string;
  phoneNumber: string;
  bookId: string;
  bookTitle: string;
  expectedPurchaseDate: string;
  status: ReservationStatus;
  createdAt: string;
}

export type BookRequestStatus = 'Sourcing' | 'Available' | 'Completed';

export interface BookRequest {
  id: string;
  userId: string;
  customerName: string;
  phoneNumber: string;
  bookTitle: string;
  author?: string;
  notes: string;
  status: BookRequestStatus;
  createdAt: string;
}

export interface InAppNotification {
  id: string;
  userId: string; // 'admin' or customer userId
  message: string;
  type: 'order' | 'reservation' | 'request' | 'status_update' | 'general';
  read: boolean;
  createdAt: string;
}

export interface ActivityHistory {
  id: string;
  userId: string;
  userName: string;
  actionDescription: string;
  createdAt: string;
}
