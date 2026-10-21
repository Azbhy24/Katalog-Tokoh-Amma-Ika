import React, { useState } from 'react';
import { Download, X, HelpCircle } from 'lucide-react';
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

  // 1. Sembunyikan ajakan jika sudah dipasang atau sedang dibuka dalam mode standalone
  if (isInstalled) {
    return null;
  }

  // 2. Jika pengunjung memilih "Nanti saja", sembunyikan ajakan dan jangan muncul berulang
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

  // 3. Tangani klik tombol utama "Pasang di HP"
  const handleActionClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        // Jika batal atau event browser belum siap, buka petunjuk manual
        setShowManualModal(true);
      }
    } else {
      // Jika event belum tersedia (misal di iOS, in-app browser, atau browser tanpa beforeinstallprompt),
      // tampilkan petunjuk manual yang ramah
      setShowManualModal(true);
    }
  };

  return (
    <>
      {/* Ajakan ramah mengambang di atas navigasi bawah, tidak menutupi seluruh katalog */}
      <aside 
        role="region"
        aria-label="Ajakan pasang aplikasi Warung Amma Ika"
        className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:w-100 z-40 bg-white/98 backdrop-blur-md border border-orange-200/90 rounded-2xl p-4 shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-5"
      >
        <div className="flex items-start gap-3.5">
          {/* Logo Asli Warung Amma Ika */}
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center shrink-0 shadow-xs overflow-hidden p-1">
            <img
              src="/amma_ika_logo_transparan.png"
              alt="Logo Warung Amma Ika"
              className="w-full h-full object-contain"
              loading="eager"
              onError={(e) => {
                // Fallback aman jika foto dalam proses transfer
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent && !parent.querySelector('.fallback-logo-text')) {
                  const fallback = document.createElement('span');
                  fallback.className = 'fallback-logo-text text-xl select-none';
                  fallback.textContent = '🏪';
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>

          {/* Isi Pesan Ajakan */}
          <div className="flex-1 min-w-0 pr-1">
            <h4 className="font-bold text-stone-900 text-sm sm:text-base tracking-tight leading-snug">
              Biar Belanja Makin Mudah! 🛍️
            </h4>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Pasang Warung Amma Ika di layar utama HP agar katalog lebih mudah dibuka kapan saja, tanpa perlu mencari link lagi.
            </p>

            {/* Tombol Aksi */}
            <div className="flex items-center gap-2.5 mt-3">
              <button
                type="button"
                onClick={handleActionClick}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                {isInstallable ? (
                  <Download className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>Pasang di HP</span>
              </button>

              <button
                type="button"
                onClick={() => dismiss(5)}
                className="px-3 py-2 text-stone-500 hover:text-stone-800 font-semibold text-xs rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Nanti saja
              </button>
            </div>
          </div>

          {/* Tombol Silang (X) untuk Menutup */}
          <button
            type="button"
            onClick={() => dismiss(5)}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-full hover:bg-stone-100 transition-colors shrink-0 -mr-1 -mt-1 cursor-pointer"
            aria-label="Tutup ajakan pasang aplikasi"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Modal Petunjuk Manual Sesuai Browser / Perangkat */}
      <PWAManualModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        isIOS={isIOS}
        isInAppBrowser={isInAppBrowser}
      />
    </>
  );
};
