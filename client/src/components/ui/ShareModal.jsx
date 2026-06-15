import { X, Copy, Twitter, Facebook, MessageCircle } from 'lucide-react';
import { useState } from 'react';

export const ShareModal = ({ isOpen, onClose, url, title }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + url)}`
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-warm-lg relative slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-muted hover:text-ink transition-colors"
        >
          <X size={20} />
        </button>

        <h3 className="font-display text-xl font-bold text-ink mb-6 text-center">
          Share this recipe
        </h3>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <a
            href={shareLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 text-ink-muted hover:text-ink transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-[#1DA1F2]/10 flex items-center justify-center text-[#1DA1F2]">
              <Twitter size={24} />
            </div>
            <span className="text-xs font-medium">Twitter</span>
          </a>

          <a
            href={shareLinks.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 text-ink-muted hover:text-ink transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-[#1877F2]/10 flex items-center justify-center text-[#1877F2]">
              <Facebook size={24} />
            </div>
            <span className="text-xs font-medium">Facebook</span>
          </a>

          <a
            href={shareLinks.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 text-ink-muted hover:text-ink transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366]">
              <MessageCircle size={24} />
            </div>
            <span className="text-xs font-medium">WhatsApp</span>
          </a>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-xl border border-ink/10 bg-parchment-100">
          <input
            type="text"
            readOnly
            value={url}
            className="flex-1 bg-transparent text-sm text-ink-muted outline-none px-2 truncate"
          />
          <button
            onClick={handleCopy}
            className="btn-secondary py-1.5 px-3 text-sm flex items-center gap-1 min-w-[80px] justify-center"
          >
            {copied ? (
              <span className="text-terracotta font-medium">Copied!</span>
            ) : (
              <>
                <Copy size={14} /> Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
