import React from 'react';
import { X, Smartphone, Share2, MoreVertical, PlusSquare, ExternalLink } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-stone-200 p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">Pasang di Layar Utama</h3>
              <p className="text-xs text-stone-500">Warung Amma Ika</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Tutup petunjuk"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content based on device */}
        {isInAppBrowser ? (
          <div className="space-y-3.5 text-stone-700 text-sm">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
              <ExternalLink className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Anda sedang membuka web melalui aplikasi lain (seperti WhatsApp). Agar bisa dipasang di HP, buka melalui browser <strong>Google Chrome</strong>.
              </span>
            </div>

            <ol className="space-y-3 text-xs sm:text-sm">
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 text-xs">1</span>
                <div>
                  Ketuk ikon <strong>titik tiga (⋮)</strong> di pojok kanan atas layar.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 text-xs">2</span>
                <div>
                  Pilih menu <strong>"Buka di Chrome"</strong> atau <strong>"Buka di Browser Eksternal"</strong>.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 text-xs">3</span>
                <div>
                  Setelah terbuka di Chrome, ketuk tombol <strong>Pasang Aplikasi</strong> di layar atau lewat menu Chrome.
                </div>
              </li>
            </ol>
          </div>
        ) : isIOS ? (
          <div className="space-y-3.5 text-stone-700 text-sm">
            <p className="text-xs text-stone-600">
              Ikuti 3 langkah mudah ini untuk memasang di iPhone / iPad via browser Safari:
            </p>
            <ol className="space-y-3 text-xs sm:text-sm">
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 text-xs">1</span>
                <div>
                  Ketuk tombol <strong>Bagikan / Share</strong> (<Share2 className="w-3.5 h-3.5 inline text-blue-600" />) pada bilah navigasi Safari di bawah.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 text-xs">2</span>
                <div>
                  Gulir ke bawah dan ketuk <strong>"Tambah ke Layar Utama"</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-stone-700" />).
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 text-xs">3</span>
                <div>
                  Ketuk <strong>"Tambah"</strong> di pojok kanan atas. Ikon Warung Amma Ika akan langsung muncul di layar utama Anda.
                </div>
              </li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3.5 text-stone-700 text-sm">
            <p className="text-xs text-stone-600">
              Untuk memasang di HP Android melalui browser Google Chrome:
            </p>
            <ol className="space-y-3 text-xs sm:text-sm">
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 text-xs">1</span>
                <div>
                  Ketuk tombol <strong>titik tiga (⋮)</strong> (<MoreVertical className="w-3.5 h-3.5 inline text-stone-700" />) di pojok kanan atas Chrome.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 text-xs">2</span>
                <div>
                  Pilih menu <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Instal Aplikasi"</strong>.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold shrink-0 text-xs">3</span>
                <div>
                  Ketuk konfirmasi <strong>"Instal"</strong>. Aplikasi akan terpasang di menu HP seperti aplikasi pada umumnya.
                </div>
              </li>
            </ol>
          </div>
        )}

        {/* Footer Button */}
        <button
          onClick={onClose}
          className="w-full mt-2 py-2.5 px-4 rounded-xl bg-stone-900 text-white font-medium text-xs sm:text-sm hover:bg-stone-800 transition-colors shadow-sm"
        >
          Mengerti & Tutup
        </button>
      </div>
    </div>
  );
};
