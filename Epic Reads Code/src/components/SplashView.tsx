import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, UserCheck, Shield } from 'lucide-react';

interface SplashViewProps {
  onGetStarted: () => void;
  onSignInClick: () => void;
  onAdminClick: () => void;
}

export const SplashView: React.FC<SplashViewProps> = ({ 
  onGetStarted, 
  onSignInClick, 
  onAdminClick 
}) => {
  // Use our generated gorgeous launcher illustration path
  const illustrationUrl = "/src/assets/images/launcher_illustration_1781561818136.jpg";
  const [logoTaps, setLogoTaps] = useState(0);

  const handleLogoClick = () => {
    setLogoTaps(p => {
      const next = p + 1;
      if (next >= 5) {
        onAdminClick();
        return 0;
      }
      return next;
    });
  };

  return (
    <div className="flex h-full min-h-[580px] flex-col justify-between bg-indigo-50/40 px-6 py-8 text-center select-none overflow-y-auto">
      {/* Top Header Logo */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center pt-2"
      >
        <button 
          onClick={handleLogoClick}
          className="flex items-center justify-center p-3 rounded-2xl bg-white text-indigo-600 mb-2 shadow-sm border border-indigo-100/80 cursor-default active:scale-95 transition-transform"
          title="Curated collection"
        >
          <BookOpen className="h-7 w-7" />
        </button>
        <h1 className="text-2xl font-black text-indigo-950 tracking-tight">
          Epic<span className="text-indigo-600 italic font-black">Reads</span>
        </h1>
        <p className="text-[9px] font-black uppercase tracking-widest text-[#93a2f8] bg-indigo-100/60 px-2 py-0.5 rounded-full mt-1">
          My Book Shop
        </p>
      </motion.div>

      {/* Main Illustration */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="my-5 flex justify-center items-center relative aspect-square w-full max-w-[270px] mx-auto overflow-hidden rounded-3xl"
      >
        <img 
          src={illustrationUrl} 
          alt="EpicReads Reader"
          referrerPolicy="no-referrer"
          className="object-cover h-full w-full shadow-md border-2 border-white"
          onError={(e) => {
            // Draw a stylish fallback vector in case local load delays
            e.currentTarget.style.display = 'none';
            const fallback = document.getElementById('splash-vector-fallback');
            if (fallback) fallback.classList.remove('hidden');
          }}
        />

        {/* CSS Fallback Illustration */}
        <div 
          id="splash-vector-fallback" 
          className="hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-tr from-indigo-950 via-indigo-900 to-indigo-700 text-white p-6"
        >
          <div className="relative mb-4">
            <BookOpen className="h-14 w-14 text-indigo-300 animate-pulse" />
          </div>
          <p className="font-sans text-sm font-bold italic text-indigo-100">"Welcome to my library! Let's find your next read."</p>
        </div>
      </motion.div>

      {/* Bottom copy and action blocks */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex flex-col gap-4 max-w-sm mx-auto w-full"
      >
        <div className="space-y-1.5">
          <h2 className="text-[22px] font-black text-indigo-950 tracking-tight leading-tight">
            Read My Books.<br />
            <span className="text-indigo-600">Enjoy Reading!</span>
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium">
            Find, reserve, or order hand-picked books directly from my Nairobi bookstore.
          </p>
        </div>

        <div className="mt-2 flex flex-col gap-3">
          {/* Get Started Button */}
          <button 
            onClick={onGetStarted}
            className="w-full flex items-center justify-center py-3 px-6 font-bold rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] shadow-md shadow-indigo-600/10 cursor-pointer transition-all text-xs"
          >
            Start Browsing
          </button>

          {/* SignIn Toggle link */}
          <button 
            onClick={onSignInClick}
            className="text-xs text-slate-500 hover:text-indigo-600 transition-colors py-1 cursor-pointer font-semibold"
          >
            Already have an account? <span className="font-extrabold text-indigo-600 underline underline-offset-2">Sign in</span>
          </button>
        </div>

        {/* Secret Gateway hints for James only */}
        <div className="pt-2 border-t border-indigo-100/60 flex items-center justify-between text-left">
          <span className="text-[9px] text-slate-400 flex items-center gap-1 font-semibold">
            <UserCheck className="h-3 w-3 text-indigo-500/80" /> Private Bookshop Catalogue
          </span>
          {/* Entirely hidden trigger for James, blends in as a tiny 1px accent dot on the screen */}
          <button
            onClick={() => onAdminClick()}
            className="w-1.5 h-1.5 bg-slate-300/30 rounded-full cursor-default hover:bg-indigo-300 ml-auto transition-colors"
            title="."
          />
        </div>
      </motion.div>
    </div>
  );
};
