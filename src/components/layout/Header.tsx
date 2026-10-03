import React from 'react';
import { MapPin, ShoppingBag } from 'lucide-react';
import { StoreSettings } from '../../types';

interface HeaderProps {
  settings: StoreSettings;
  totalCartItems: number;
  onOpenCart: () => void;
  onOpenAdmin?: () => void;
  onOpenTracking?: () => void;
  hasActiveOrder?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  totalCartItems,
  onOpenCart,
  onOpenAdmin,
  onOpenTracking,
  hasActiveOrder,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/80 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
        {/* Identitas Warung */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 font-serif">
              Warung Amma Ika
            </h1>
            
            {/* Status Buka/Tutup Toko */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                settings.isOpen
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  settings.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              {settings.isOpen ? 'Buka' : 'Tutup'}
            </span>
          </div>

          {/* Lokasi Warung */}
          <div className="flex items-center gap-1 text-xs text-stone-700 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-stone-600 shrink-0" />
            <span>Lero, Suppa, Pinrang</span>
          </div>
        </div>

        {/* Tombol Aksi Kanan */}
        <div className="flex items-center gap-2">
          {/* Tombol Lacak Pesanan Aktif */}
          {hasActiveOrder && onOpenTracking && (
            <button
              onClick={onOpenTracking}
              title="Lacak Pesanan Aktif"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/90 transition-all active:scale-95 cursor-pointer text-xs font-bold shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="hidden sm:inline">Lacak Pesanan</span>
            </button>
          )}

          {/* Tombol Keranjang (Desktop/Tablet) */}
          <button
            onClick={onOpenCart}
            aria-label="Buka Keranjang Belanja"
            className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 transition-all active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5 text-amber-800" />
            <span className="hidden sm:inline text-xs font-bold">Keranjang</span>
            {totalCartItems > 0 && (
              <span className="flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-black text-white bg-amber-600 rounded-full shadow-xs">
                {totalCartItems}
              </span>
            )}
          </button>

          {/* Admin Entry Shortcut */}
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              title="Papan Kelola Warung"
              aria-label="Papan Pengelola"
              className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              <span className="text-xs font-semibold px-1 py-0.5 border border-stone-300 rounded text-stone-600">
                Admin
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
