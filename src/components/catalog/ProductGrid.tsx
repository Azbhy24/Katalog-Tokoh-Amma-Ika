import React from 'react';
import { Product } from '../../types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  getItemQuantity: (productId: string) => number;
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (productId: string) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  getItemQuantity,
  onAddToCart,
  onRemoveFromCart,
}) => {
  if (products.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="text-4xl mb-3">🔍</div>
        <h3 className="text-base font-bold text-stone-800 mb-1">
          Produk tidak ditemukan
        </h3>
        <p className="text-xs sm:text-sm text-stone-500 max-w-xs mx-auto">
          Coba gunakan kata kunci lain atau pilih kategori sembako yang berbeda.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          quantityInCart={getItemQuantity(product.id)}
          onAddToCart={onAddToCart}
          onRemoveFromCart={onRemoveFromCart}
        />
      ))}
    </div>
  );
};
