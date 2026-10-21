import React from 'react';
import { X, Share2, MoreVertical, PlusSquare, ExternalLink } from 'lucide-react';

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
        className="w-full max-w-sm sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 p-6 flex flex-col gap-4 max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="manual-modal-title"
      >
        {/* Header dengan Logo Asli */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200/90 flex items-center justify-center p-1 overflow-hidden shrink-0">
              <img
                src="/amma_ika_logo_transparan.png"
                alt="Logo Warung Amma Ika"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent && !parent.querySelector('.fallback-modal-icon')) {
                    const icon = document.createElement('span');
                    icon.className = 'fallback-modal-icon text-xl';
                    icon.textContent = '🛍️';
                    parent.appendChild(icon);
                  }
                }}
              />
            </div>
            <div>
              <h3 id="manual-modal-title" className="font-bold text-stone-900 text-base">
                Simpan di Layar Utama HP
              </h3>
              <p className="text-xs text-stone-500">Warung Amma Ika</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Tutup petunjuk"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Petunjuk Berdasarkan Jenis HP / Aplikasi */}
        {isInAppBrowser ? (
          /* Kasus: Dibuka dari dalam aplikasi WhatsApp atau aplikasi pesan lainnya */
          <div className="space-y-3.5 text-stone-700 text-sm">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-start gap-2.5">
              <ExternalLink className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                Kamu sedang membuka katalog dari dalam WhatsApp atau aplikasi pesan. Agar bisa disimpan ke layar HP, buka halaman ini lewat <strong>Google Chrome</strong> (HP Android) atau <strong>Safari</strong> (iPhone).
              </div>
            </div>

            <p className="text-xs font-bold text-stone-800">
              Cara mudah membukanya:
            </p>

            <ol className="space-y-3 text-xs sm:text-sm">
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 text-xs">1</span>
                <div className="leading-snug">
                  Tekan ikon <strong>titik tiga (⋮)</strong> di pojok kanan atas layar WhatsApp kamu.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 text-xs">2</span>
                <div className="leading-snug">
                  Pilih menu <strong>"Buka di Chrome"</strong> atau <strong>"Buka di browser"</strong>.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 text-xs">3</span>
                <div className="leading-snug">
                  Setelah halaman terbuka di Chrome/Safari, tekan tombol <strong>"Pasang di Layar HP"</strong>.
                </div>
              </li>
            </ol>
          </div>
        ) : isIOS ? (
          /* Kasus: iPhone / iPad (Safari) */
          <div className="space-y-3.5 text-stone-700 text-sm">
            <p className="text-xs text-stone-600 leading-relaxed">
              Ikuti langkah mudah ini untuk menyimpan di iPhone / iPad kamu:
            </p>
            <ol className="space-y-3.5 text-xs sm:text-sm">
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 text-xs">1</span>
                <div className="leading-snug">
                  Tekan tombol <strong>Bagikan</strong>{' '}
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 font-medium">
                    <Share2 className="w-3.5 h-3.5 mr-1 text-blue-600 inline" /> Bagikan
                  </span>{' '}
                  di bagian bawah layar Safari kamu.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 text-xs">2</span>
                <div className="leading-snug">
                  Geser menu ke bawah, lalu pilih{' '}
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 font-bold">
                    <PlusSquare className="w-3.5 h-3.5 mr-1 text-stone-700 inline" /> Tambahkan ke Layar Utama
                  </span>.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 text-xs">3</span>
                <div className="leading-snug">
                  Tekan <strong>"Tambah"</strong> di pojok kanan atas. Gambar Warung Amma Ika akan langsung muncul di layar utama HP kamu!
                </div>
              </li>
            </ol>
          </div>
        ) : (
          /* Kasus: Android Chrome & Browser HP lainnya */
          <div className="space-y-3.5 text-stone-700 text-sm">
            <p className="text-xs text-stone-600 leading-relaxed">
              Jika kotak dialog belum muncul di layar, kamu bisa menyimpannya langsung lewat menu Chrome:
            </p>
            <ol className="space-y-3.5 text-xs sm:text-sm">
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 text-xs">1</span>
                <div className="leading-snug">
                  Tekan tombol <strong>titik tiga (⋮)</strong>{' '}
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 font-medium">
                    <MoreVertical className="w-3.5 h-3.5 inline text-stone-700" /> Menu
                  </span>{' '}
                  di pojok kanan atas Google Chrome.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 text-xs">2</span>
                <div className="leading-snug">
                  Pilih menu <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Pasang aplikasi" / "Buat pintasan"</strong> (sesuai opsi yang ada di HP kamu).
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 text-xs">3</span>
                <div className="leading-snug">
                  Tekan <strong>"Tambah"</strong> atau <strong>"Pasang"</strong>. Warung Amma Ika siap dibuka kapan saja langsung dari layar HP tanpa perlu mencari link lagi!
                </div>
              </li>
            </ol>
          </div>
        )}

        {/* Tombol Tutup */}
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-2 py-3 px-4 rounded-2xl bg-stone-900 text-white font-bold text-sm hover:bg-stone-800 active:scale-98 transition-all shadow-xs cursor-pointer"
        >
          Mengerti & Tutup
        </button>
      </div>
    </div>
  );
};
