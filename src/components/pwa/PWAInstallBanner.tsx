import React, { useState } from 'react';
import { Download, X, HelpCircle, Store } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAManualModal } from './PWAManualModal';

export const PWAInstallBanner: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isInAppBrowser,
    isDismissed,
    install,
    dismiss,
  } = usePWAInstall();

  const [showManualModal, setShowManualModal] = useState(false);

  // Jika sudah terpasang sebagai aplikasi standalone, tidak perlu tampilkan banner
  if (isInstalled) {
    return null;
  }

  // Jika pengguna sudah menutup banner dalam kurun waktu dismiss (misal 5 hari), jangan ganggu lagi
  if (isDismissed) {
    return (
      <PWAManualModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        isIOS={isIOS}
        isInAppBrowser={isInAppBrowser}
      />
    );
  }

  const handleActionClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        // Jika gagal atau dibatalkan, buka petunjuk manual
        setShowManualModal(true);
      }
    } else {
      setShowManualModal(true);
    }
  };

  return (
    <>
      <div 
        role="region"
        aria-label="Ajakan instalasi aplikasi"
        className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-40 bg-white/95 backdrop-blur-md border border-orange-200/80 rounded-2xl p-3.5 shadow-xl transition-all duration-300 animate-in slide-in-from-bottom-4"
      >
        <div className="flex items-start gap-3">
          {/* App Icon */}
          <div className="w-11 h-11 rounded-xl bg-orange-50/90 flex items-center justify-center shrink-0 shadow-sm border border-orange-200 overflow-hidden relative">
            <img
              src="/amma_ika_logo_transparan.png"
              alt="Logo Warung Amma Ika"
              className="w-full h-full object-contain p-0.5"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="hidden absolute inset-0 items-center justify-center bg-gradient-to-br from-orange-400 to-amber-600 text-white">
              <Store className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Text Information */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-stone-900 text-xs sm:text-sm tracking-tight truncate">
                Warung Amma Ika
              </h4>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-orange-100 text-orange-800 rounded-md">
                Aplikasi
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-600 line-clamp-1 mt-0.5">
              Pasang di layar utama HP untuk belanja sembako lebih cepat
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-2.5">
              <button
                onClick={handleActionClick}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold text-xs rounded-xl shadow-xs active:scale-95 transition-transform cursor-pointer"
              >
                {isInstallable ? (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Pasang Sekarang</span>
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Cara Pasang</span>
                  </>
                )}
              </button>

              <button
                onClick={() => dismiss(5)}
                className="px-2.5 py-1.5 text-stone-500 hover:text-stone-800 font-medium text-xs rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Nanti saja
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => dismiss(5)}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-full hover:bg-stone-100 transition-colors shrink-0 -mr-1 -mt-1 cursor-pointer"
            aria-label="Tutup ajakan pasang aplikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <PWAManualModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        isIOS={isIOS}
        isInAppBrowser={isInAppBrowser}
      />
    </>
  );
};
