import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { Product } from '../../types';
import { formatRupiah } from '../../lib/formatters';

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantityInCart,
  onAddToCart,
  onRemoveFromCart,
}) => {
  const isOutOfStock = !product.inStock;

  return (
    <article
      className={`group relative flex flex-col justify-between bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-2xs hover:shadow-sm transition-all text-left ${
        isOutOfStock ? 'opacity-70 bg-stone-50/80' : ''
      }`}
    >
      <div>
        {/* Gambar Produk */}
        <div className="relative aspect-4/3 w-full bg-stone-100 overflow-hidden">
          {product.image && product.image.trim() !== '' ? (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-300 text-3xl font-bold bg-stone-50">
              📦
            </div>
          )}

          {/* Badge Stok Habis */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-2xs flex items-center justify-center">
              <span className="px-3 py-1 bg-rose-600 text-white font-bold text-xs rounded-full shadow-xs tracking-wide">
                Stok Habis
              </span>
            </div>
          )}

          {/* Badge Unggulan */}
          {product.featured && !isOutOfStock && (
            <span className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500 text-white font-bold text-2xs uppercase tracking-wider rounded-md shadow-2xs">
              Pilihan
            </span>
          )}
        </div>

        {/* Info Produk */}
        <div className="p-3 sm:p-3.5 space-y-1">
          {/* Satuan Produk (Jelas & Menonjol) */}
          <span className="inline-block text-2xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 uppercase tracking-wider">
            {product.unit}
          </span>

          {/* Nama Produk */}
          <h2 className="text-sm sm:text-base font-bold text-stone-900 line-clamp-2 leading-snug">
            {product.name}
          </h2>
        </div>
      </div>

      {/* Harga & Tombol Aksi Bawah */}
      <div className="p-3 sm:p-3.5 pt-0 mt-auto flex items-center justify-between gap-2">
        {/* Harga */}
        <div className="flex flex-col">
          <span className="text-2xs text-stone-600 font-medium">Harga</span>
          <span className="text-sm sm:text-base font-black text-stone-900 tracking-tight">
            {formatRupiah(product.price)}
          </span>
        </div>

        {/* Quick Add / Counter Action */}
        <div className="shrink-0">
          {isOutOfStock ? (
            <span className="inline-block px-3 py-1.5 text-xs font-semibold text-stone-400 bg-stone-100 rounded-xl cursor-not-allowed border border-stone-200">
              Habis
            </span>
          ) : quantityInCart > 0 ? (
            /* Counter Mode: [ - ] 2 [ + ] */
            <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-300/80 rounded-xl p-0.5 shadow-2xs">
              <button
                onClick={() => onRemoveFromCart(product.id)}
                aria-label={`Kurangi ${product.name}`}
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-amber-900 bg-white hover:bg-amber-100 rounded-lg active:scale-90 transition-all cursor-pointer font-bold border border-amber-200/50"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <span className="min-w-5 sm:min-w-6 text-center text-xs sm:text-sm font-black text-amber-950">
                {quantityInCart}
              </span>

              <button
                onClick={() => onAddToCart(product)}
                aria-label={`Tambah ${product.name}`}
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-white bg-amber-700 hover:bg-amber-800 rounded-lg active:scale-90 transition-all cursor-pointer font-bold shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Initial Add Button: [ + ] */
            <button
              onClick={() => onAddToCart(product)}
              aria-label={`Tambah ${product.name} ke keranjang`}
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-amber-700 hover:bg-amber-800 text-white rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
