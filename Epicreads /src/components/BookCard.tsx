import React from 'react';
import { Book } from '../types';
import { BookOpen, AlertCircle, XCircle, CheckCircle } from 'lucide-react';

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onSelect }) => {
  // Stock badge styling utilities
  const getStockBadge = () => {
    switch (book.stockStatus) {
      case 'Available':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-100">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> We have it!
          </span>
        );
      case 'Low Stock':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-100">
            <AlertCircle className="h-3.5 w-3.5 text-amber-505" /> Only {book.quantity} left
          </span>
        );
      case 'Out of Stock':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 border border-rose-100">
            <XCircle className="h-3.5 w-3.5 text-rose-500" /> None left
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      onClick={() => onSelect(book)}
      className="group flex flex-col overflow-hidden rounded-3xl bg-white border border-indigo-100 shadow-xs transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer duration-300"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-50">
        <img 
          src={book.imageUrl} 
          alt={book.title}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            // Fallback UI if generated images or image paths have loading issue
            e.currentTarget.style.display = 'none';
            const sib = e.currentTarget.nextElementSibling as HTMLElement;
            if (sib) sib.style.display = 'flex';
          }}
        />
        {/* Fallback open book wrapper */}
        <div className="absolute inset-0 hidden flex-col items-center justify-center p-4 bg-gradient-to-tr from-indigo-900 to-indigo-700 text-white text-center">
          <BookOpen className="h-10 w-10 mb-2 opacity-85" />
          <span className="text-sm font-bold line-clamp-2 px-2">{book.title}</span>
          <span className="text-xs text-indigo-200 mt-1">{book.author}</span>
        </div>

        {/* Floating Category tag */}
        <span className="absolute top-3 left-3 rounded-full bg-indigo-50/90 px-2.5 py-0.5 text-[9px] font-bold text-indigo-700 border border-indigo-100/50 backdrop-blur-xs">
          {book.category}
        </span>
      </div>

      {/* Book details container */}
      <div className="flex flex-1 flex-col p-4 bg-white">
        <div className="flex-1">
          <h4 className="font-bold text-indigo-950 line-clamp-1 group-hover:text-indigo-650 transition-colors leading-tight">
            {book.title}
          </h4>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">{book.author}</p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Price</span>
            <span className="text-base font-black text-indigo-950 font-mono">
              KES {book.price.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col items-end shrink-0">
            {getStockBadge()}
          </div>
        </div>
      </div>
    </div>
  );
};
