import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { formatRupiah } from '../../lib/formatters';

interface StickyCartBarProps {
  totalItems: number;
  subtotal: number;
  onOpenCart: () => void;
}

export const StickyCartBar: React.FC<StickyCartBarProps> = ({
  totalItems,
  subtotal,
  onOpenCart,
}) => {
  if (totalItems <= 0) return null;

  return (
    <aside
      aria-label="Keranjang Belanja Mengambang"
      className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:w-96 z-40 animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <button
        onClick={onOpenCart}
        aria-label={`Buka Keranjang (${totalItems} barang, total ${formatRupiah(subtotal)})`}
        className="w-full flex items-center justify-between gap-3 p-3.5 sm:p-4 bg-stone-900 text-white rounded-2xl shadow-xl shadow-stone-950/20 active:scale-98 transition-all cursor-pointer border border-stone-800"
      >
        {/* Info Ringkas Keranjang */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 bg-amber-600 rounded-xl text-white">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 text-2xs font-black text-stone-900 bg-amber-300 rounded-full">
              {totalItems}
            </span>
          </div>

          <div className="flex flex-col text-left">
            <span className="text-xs text-stone-300 font-medium">
              {totalItems} Barang Dipilih
            </span>
            <span className="text-base font-black tracking-tight text-white">
              {formatRupiah(subtotal)}
            </span>
          </div>
        </div>

        {/* Tombol CTA */}
        <div className="flex items-center gap-1 text-xs sm:text-sm font-bold bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl transition-colors">
          <span>Lihat Keranjang</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </button>
    </aside>
  );
};
