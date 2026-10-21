import React from 'react';
import { X, Share2, MoreVertical, PlusSquare, ExternalLink, Smartphone } from 'lucide-react';

interface PWAManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  isInAppBrowser: boolean;
}

export const PWAManualModal: React.FC<PWAManualModalProps> = ({
  isOpen,
  onClose,
  isIOS,
  isInAppBrowser,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-stone-200 p-5 sm:p-6 flex flex-col gap-4 max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="pwa-modal-title"
      >
        {/* Header dengan Logo Asli */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center p-1 overflow-hidden shrink-0">
              <img
                src="/amma_ika_logo_transparan.png"
                alt="Logo Warung Amma Ika"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent && !parent.querySelector('.fallback-modal-icon')) {
                    const icon = document.createElement('span');
                    icon.className = 'fallback-modal-icon text-lg';
                    icon.textContent = '🛍️';
                    parent.appendChild(icon);
                  }
                }}
              />
            </div>
            <div>
              <h3 id="pwa-modal-title" className="font-bold text-stone-900 text-base">
                Pasang di Layar Utama
              </h3>
              <p className="text-xs text-stone-500">Katalog Warung Amma Ika</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Tutup petunjuk pemasangan"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Petunjuk Berdasarkan Jenis Browser / Perangkat */}
        {isInAppBrowser ? (
          /* Kasus 1: Dibuka dari dalam aplikasi (WhatsApp, Instagram, Facebook, dll.) */
          <div className="space-y-3.5 text-stone-700 text-sm">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
              <ExternalLink className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                Anda sedang membuka web melalui aplikasi pesan (seperti WhatsApp). Agar dapat dipasang di layar utama HP, buka tautan ini melalui browser <strong>Google Chrome</strong> (Android) atau <strong>Safari</strong> (iPhone).
              </div>
            </div>

            <p className="text-xs font-semibold text-stone-800">
              Langkah membuka di browser utama:
            </p>

            <ol className="space-y-3 text-xs sm:text-sm">
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 text-xs">1</span>
                <div className="leading-snug">
                  Ketuk ikon <strong>titik tiga (⋮)</strong> di pojok kanan atas layar WhatsApp.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 text-xs">2</span>
                <div className="leading-snug">
                  Pilih opsi <strong>"Buka di Chrome"</strong> atau <strong>"Buka di Browser Eksternal"</strong>.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 text-xs">3</span>
                <div className="leading-snug">
                  Setelah terbuka di Chrome/Safari, ketuk tombol <strong>Pasang di HP</strong> di layar untuk memasangnya ke menu utama HP.
                </div>
              </li>
            </ol>
          </div>
        ) : isIOS ? (
          /* Kasus 2: iPhone / iPad (Safari) */
          <div className="space-y-3.5 text-stone-700 text-sm">
            <p className="text-xs text-stone-600 leading-relaxed">
              Ikuti 3 langkah mudah berikut untuk memasang di iPhone / iPad melalui browser Safari:
            </p>
            <ol className="space-y-3.5 text-xs sm:text-sm">
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 text-xs">1</span>
                <div className="leading-snug">
                  Ketuk tombol <strong>Bagikan (Share)</strong>{' '}
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 font-medium">
                    <Share2 className="w-3.5 h-3.5 mr-1 text-blue-600 inline" /> Bagikan
                  </span>{' '}
                  pada bilah navigasi bawah Safari.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 text-xs">2</span>
                <div className="leading-snug">
                  Gulir ke bawah pada menu yang muncul, lalu pilih{' '}
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 font-semibold">
                    <PlusSquare className="w-3.5 h-3.5 mr-1 text-stone-700 inline" /> Tambahkan ke Layar Utama
                  </span>.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 text-xs">3</span>
                <div className="leading-snug">
                  Ketuk <strong>"Tambah"</strong> di pojok kanan atas. Ikon Warung Amma Ika akan langsung tampil di layar depan HP Anda.
                </div>
              </li>
            </ol>
          </div>
        ) : (
          /* Kasus 3: Android (Google Chrome & browser lainnya) */
          <div className="space-y-3.5 text-stone-700 text-sm">
            <p className="text-xs text-stone-600 leading-relaxed">
              Jika tombol otomatis belum muncul, Anda dapat memasang atau membuat pintasan langsung dari menu browser:
            </p>
            <ol className="space-y-3.5 text-xs sm:text-sm">
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 text-xs">1</span>
                <div className="leading-snug">
                  Ketuk tombol <strong>titik tiga (⋮)</strong>{' '}
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 font-medium">
                    <MoreVertical className="w-3.5 h-3.5 inline text-stone-700" /> Menu
                  </span>{' '}
                  di pojok kanan atas browser Google Chrome.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 text-xs">2</span>
                <div className="leading-snug">
                  Pilih menu <strong>"Instal Aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama" / "Buat Pintasan"</strong> (sesuai opsi yang tersedia di browser Anda).
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 text-xs">3</span>
                <div className="leading-snug">
                  Ketuk konfirmasi <strong>"Instal"</strong> atau <strong>"Tambah"</strong>. Aplikasi Warung Amma Ika siap dibuka kapan saja dari layar HP tanpa perlu mencari link lagi.
                </div>
              </li>
            </ol>
          </div>
        )}

        {/* Tombol Tutup */}
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-1 py-2.5 px-4 rounded-xl bg-stone-900 text-white font-bold text-xs sm:text-sm hover:bg-stone-800 active:scale-98 transition-all shadow-xs cursor-pointer"
        >
          Mengerti & Tutup
        </button>
      </div>
    </div>
  );
};
