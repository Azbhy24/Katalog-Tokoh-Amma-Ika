import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { CartItem } from '../../types';
import { formatRupiah } from '../../lib/formatters';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  totalItems: number;
  onAddToCart: (product: CartItem['product']) => void;
  onRemoveFromCart: (productId: string) => void;
  onDeleteItem: (productId: string) => void;
  onProceedToCheckout?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  totalItems,
  onAddToCart,
  onRemoveFromCart,
  onDeleteItem,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-2xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Panel */}
      <aside
        aria-label="Panel Keranjang Belanja"
        className="fixed inset-y-0 right-0 max-w-full w-full sm:max-w-md bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250"
      >
        {/* Header Drawer */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-700" />
            <h2 className="text-base sm:text-lg font-black text-stone-900 font-serif">
              Keranjang Belanja
            </h2>
            <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
              {totalItems} barang
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup Keranjang"
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Daftar Barang Belanja */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="text-5xl">🛒</div>
              <h3 className="text-base font-bold text-stone-800">
                Keranjang masih kosong
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 max-w-xs">
                Pilih barang sembako yang Anda butuhkan dan ketuk tanda + untuk menambahkan.
              </p>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex items-center justify-between gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200/70"
              >
                {/* Foto Mini & Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-white border border-stone-200 overflow-hidden shrink-0">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">
                        📦
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0 text-left">
                    <span className="text-xs font-bold text-stone-900 truncate">
                      {product.name}
                    </span>
                    <span className="text-2xs font-semibold text-amber-800">
                      {product.unit}
                    </span>
                    <span className="text-xs font-black text-stone-900 mt-0.5">
                      {formatRupiah(product.price)}
                    </span>
                  </div>
                </div>

                {/* Counter & Tombol Hapus */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="inline-flex items-center gap-1 bg-white border border-stone-300/80 rounded-xl p-0.5">
                    <button
                      onClick={() => onRemoveFromCart(product.id)}
                      aria-label={`Kurangi ${product.name}`}
                      className="w-6 h-6 flex items-center justify-center text-stone-700 hover:bg-stone-100 rounded-lg active:scale-90 transition-all cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>

                    <span className="min-w-5 text-center text-xs font-black text-stone-900">
                      {quantity}
                    </span>

                    <button
                      onClick={() => onAddToCart(product)}
                      aria-label={`Tambah ${product.name}`}
                      className="w-6 h-6 flex items-center justify-center text-stone-700 hover:bg-stone-100 rounded-lg active:scale-90 transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => onDeleteItem(product.id)}
                    aria-label={`Hapus ${product.name}`}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Ringkasan & Checkout Button */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-stone-200 bg-white space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-600 font-medium">Subtotal Belanja</span>
              <span className="text-lg font-black text-stone-900">
                {formatRupiah(subtotal)}
              </span>
            </div>

            <p className="text-2xs text-stone-600">
              * Biaya pengantaran dan rincian alamat ditentukan pada tahap checkout.
            </p>

            {/* Tombol Lanjut ke Checkout */}
            <button
              onClick={onProceedToCheckout}
              disabled={!onProceedToCheckout}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                onProceedToCheckout
                  ? 'bg-amber-700 hover:bg-amber-800 text-white shadow-md shadow-amber-900/10 active:scale-98'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <span>Lanjut ke Checkout</span>
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};
