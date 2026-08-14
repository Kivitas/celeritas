import React, { useState, useEffect } from 'react';
import { Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has already accepted or dismissed the cookie banner
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Small delay to not overwhelm the user immediately on load
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('cookie-consent', 'dismissed');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-auto md:max-w-md z-50"
        >
          <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-white">We value your privacy</h3>
              </div>
              <button 
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-slate-300 leading-relaxed">
              We use local storage to save your simulation parameters and preferences. We do not use tracking cookies or sell your personal data. 
              By continuing to use our application, you agree to our <a href="/privacy-policy" className="text-blue-400 hover:underline">Privacy Policy</a> and <a href="/terms-of-service" className="text-blue-400 hover:underline">Terms of Service</a>.
            </p>
            
            <div className="flex items-center gap-3 mt-1">
              <button 
                onClick={handleAccept}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                Accept & Continue
              </button>
              <button 
                onClick={handleDismiss}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 px-4 rounded-lg transition-colors text-sm border border-slate-700"
              >
                Decline
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;
