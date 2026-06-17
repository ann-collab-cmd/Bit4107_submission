import React, { useState } from 'react';
import { 
  Share2, 
  MessageCircle, 
  Facebook, 
  Instagram, 
  Twitter, 
  Music, 
  Copy, 
  Check,
  Send
} from 'lucide-react';

interface SocialShareProps {
  shareUrl?: string;
  shareTitle?: string;
  shareDescription?: string;
  compact?: boolean;
}

export const SocialShare: React.FC<SocialShareProps> = ({
  shareUrl = window.location.origin || 'https://epic-reads.app',
  shareTitle = 'Epic Reads Online Bookstore',
  shareDescription = 'Discover amazing hand-picked books, buy digital soft PDF copies, or reserve physical copies instantly!',
  compact = false
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null);

  const customMessage = `📖 *${shareTitle}*\n${shareDescription}\n\nBrowse here: ${shareUrl}`;
  const encodedMessage = encodeURIComponent(customMessage);
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(shareTitle);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyForPlatform = (platform: 'Instagram' | 'TikTok') => {
    navigator.clipboard.writeText(`${customMessage}`);
    setCopiedChannel(platform);
    setTimeout(() => setCopiedChannel(null), 3000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareDescription,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-xl p-1.5 self-center">
        {/* WhatsApp */}
        <a 
          href={`https://api.whatsapp.com/send?text=${encodedMessage}`}
          target="_blank"
          referrerPolicy="no-referrer"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
          title="Share on WhatsApp"
        >
          <MessageCircle className="h-4 w-4" />
        </a>

        {/* Facebook */}
        <a 
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          referrerPolicy="no-referrer"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
          title="Share on Facebook"
        >
          <Facebook className="h-4 w-4" />
        </a>

        {/* X */}
        <a 
          href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
          target="_blank"
          referrerPolicy="no-referrer"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg text-slate-800 hover:bg-slate-100 transition-colors"
          title="Share on X (Twitter)"
        >
          <Twitter className="h-4 w-4" />
        </a>

        {/* Copy Button */}
        <button
          onClick={handleCopyLink}
          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
          title="Copy Link"
        >
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div>
          <h4 className="text-xs font-black tracking-wider text-slate-700 uppercase">Spread the Word</h4>
          <p className="text-[10px] text-slate-400 font-medium">Share Epic Reads with friends across social media!</p>
        </div>
        <button 
          onClick={handleNativeShare}
          className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-bold"
        >
          <Share2 className="h-3.5 w-3.5" /> Share App
        </button>
      </div>

      <div className="grid grid-cols-5 gap-2.5">
        {/* WhatsApp */}
        <a 
          href={`https://api.whatsapp.com/send?text=${encodedMessage}`}
          target="_blank"
          referrerPolicy="no-referrer"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-3.5 bg-emerald-50/40 hover:bg-emerald-50 rounded-2xl border border-emerald-100/30 transition-all cursor-pointer group"
        >
          <MessageCircle className="h-6 w-6 text-emerald-600 group-hover:scale-105 transition-transform" />
          <span className="text-[9px] font-bold text-slate-500 mt-1.5">WhatsApp</span>
        </a>

        {/* Facebook */}
        <a 
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          referrerPolicy="no-referrer"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-3.5 bg-blue-50/40 hover:bg-blue-50 rounded-2xl border border-blue-100/30 transition-all cursor-pointer group"
        >
          <Facebook className="h-6 w-6 text-blue-600 group-hover:scale-105 transition-transform" />
          <span className="text-[9px] font-bold text-slate-500 mt-1.5">Facebook</span>
        </a>

        {/* X */}
        <a 
          href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
          target="_blank"
          referrerPolicy="no-referrer"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-3.5 bg-black/5 hover:bg-black/10 rounded-2xl border border-slate-200 transition-all cursor-pointer group"
        >
          <Twitter className="h-6 w-6 text-slate-900 group-hover:scale-105 transition-transform" />
          <span className="text-[9px] font-bold text-slate-500 mt-1.5">X (Twitter)</span>
        </a>

        {/* Instagram Instructions */}
        <button
          onClick={() => handleCopyForPlatform('Instagram')}
          className="flex flex-col items-center justify-center p-3.5 bg-pink-50/40 hover:bg-pink-50 rounded-2xl border border-pink-100/30 transition-all cursor-pointer group"
        >
          <Instagram className="h-6 w-6 text-pink-600 group-hover:scale-105 transition-transform" />
          <span className="text-[9px] font-bold text-slate-500 mt-1.5">Instagram</span>
        </button>

        {/* TikTok Instructions */}
        <button
          onClick={() => handleCopyForPlatform('TikTok')}
          className="flex flex-col items-center justify-center p-3.5 bg-cyan-50/40 hover:bg-cyan-50 rounded-2xl border border-cyan-100/30 transition-all cursor-pointer group"
        >
          <Music className="h-6 w-6 text-cyan-600 group-hover:scale-105 transition-transform" />
          <span className="text-[9px] font-bold text-slate-500 mt-1.5">TikTok</span>
        </button>
      </div>

      {(copiedChannel === 'Instagram' || copiedChannel === 'TikTok') && (
        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 text-xs text-center font-medium animate-fade-in">
          🎉 Link & Description Copied for <strong>{copiedChannel}</strong>! 
          <p className="text-[9px] text-indigo-500 mt-0.5">Paste this into your bio, stories, or post to share!</p>
        </div>
      )}

      {/* Copy link input box */}
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-2.5">
        <input 
          type="text" 
          value={shareUrl} 
          readOnly 
          className="flex-1 bg-transparent border-none text-[10.5px] text-slate-500 outline-none font-mono font-medium truncate shrink"
        />
        <button
          onClick={handleCopyLink}
          className="py-1.5 px-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-[10px] cursor-pointer flex items-center gap-1 shrink-0"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" /> Copied!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
};
