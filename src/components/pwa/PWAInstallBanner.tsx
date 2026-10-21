import React, { useState, useEffect } from 'react';
import { X, Smartphone } from 'lucide-react';
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
  const [isReadyToShow, setIsReadyToShow] = useState(false);

  // Berikan jeda singkat (1.5 detik) setelah katalog selesai dimuat agar tidak mengagetkan pengunjung
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReadyToShow(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // 1. Sembunyikan ajakan jika aplikasi sudah dipasang atau sedang dibuka dalam mode aplikasi mandiri
  if (isInstalled) {
    return null;
  }

  // 2. Jika pengguna sudah memilih "Nanti Saja" dalam 5 hari, jangan tampilkan modal promosi
  if (isDismissed) {
    // Tetap render modal petunjuk manual jika pengunjung membuka lewat tombol header
    return (
      <PWAManualModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        isIOS={isIOS}
        isInAppBrowser={isInAppBrowser}
      />
    );
  }

  // 3. Jangan tampilkan sebelum jeda waktu selesai
  if (!isReadyToShow) {
    return null;
  }

  // 4. Tangani klik tombol utama "Pasang di Layar HP"
  const handleActionClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        // Jika dialog bawaan belum memicu, buka petunjuk manual yang ramah
        setShowManualModal(true);
      }
    } else {
      // Pada iPhone Safari, browser dalam aplikasi WhatsApp, atau jika dialog bawaan belum siap
      setShowManualModal(true);
    }
  };

  const handleDismiss = () => {
    dismiss(5); // Simpan pilihan selama 5 hari agar tidak muncul berulang-ulang
  };

  return (
    <>
      {/* Modal Promosi di Tengah Layar dengan Latar Belakang Gelap Transparan */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={handleDismiss}
      >
        <div 
          className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-orange-100 flex flex-col items-center text-center relative overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Garis Aksen Oranye Khas Warung Amma Ika di Bagian Atas */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />

          {/* Tombol Silang (X) di Pojok Kanan Atas */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Tutup ajakan"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo Asli Warung Amma Ika */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-orange-50 border-2 border-orange-200/90 p-2 shadow-md flex items-center justify-center mb-4 overflow-hidden shrink-0 mt-1">
            <img
              src="/amma_ika_logo_transparan.png"
              alt="Logo Warung Amma Ika"
              className="w-full h-full object-contain"
              loading="eager"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent && !parent.querySelector('.fallback-logo')) {
                  const fallback = document.createElement('span');
                  fallback.className = 'fallback-logo text-3xl select-none';
                  fallback.textContent = '🛍️';
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>

          {/* Judul Ajakan Sesuai Permintaan */}
          <h3 
            id="promo-modal-title"
            className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug"
          >
            🛍️ Belanja Jadi Lebih Gampang!
          </h3>

          {/* Keterangan Manfaat dengan Bahasa Sederhana */}
          <p className="text-stone-600 text-sm sm:text-base mt-2.5 leading-relaxed font-normal">
            Simpan Warung Amma Ika di layar utama HP kamu. Jadi, kalau mau belanja, tinggal tekan gambarnya saja. Nggak perlu repot mencari link lagi!
          </p>

          {/* Area Tombol */}
          <div className="w-full mt-6 space-y-2.5">
            {/* Tombol Utama */}
            <button
              type="button"
              onClick={handleActionClick}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-base rounded-2xl shadow-lg shadow-orange-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Smartphone className="w-5 h-5 shrink-0" />
              <span>Pasang di Layar HP</span>
            </button>

            {/* Tombol Kedua */}
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-2.5 px-4 text-stone-500 hover:text-stone-800 font-semibold text-sm rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Nanti Saja
            </button>
          </div>

          {/* Teks Kecil di Bagian Bawah */}
          <p className="text-[12px] text-stone-400 font-medium mt-2 select-none">
            Gratis dan mudah digunakan ❤️
          </p>
        </div>
      </div>

      {/* Modal Petunjuk Manual Jika Diperlukan */}
      <PWAManualModal
        isOpen={showManualModal}
        onClose={() => {
          setShowManualModal(false);
          dismiss(5); // Pastikan promo utama juga tertutup setelah melihat petunjuk
        }}
        isIOS={isIOS}
        isInAppBrowser={isInAppBrowser}
      />
    </>
  );
};
