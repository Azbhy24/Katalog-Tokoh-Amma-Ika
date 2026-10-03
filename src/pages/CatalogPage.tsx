import React, { useState, useMemo } from 'react';
import { Header } from '../components/layout/Header';
import { SearchBar } from '../components/catalog/SearchBar';
import { CategoryPills } from '../components/catalog/CategoryPills';
import { ProductGrid } from '../components/catalog/ProductGrid';
import { StickyCartBar } from '../components/layout/StickyCartBar';
import { CartDrawer } from '../components/cart/CartDrawer';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { useSettings } from '../hooks/useSettings';
import { Category } from '../types';
import { DEFAULT_CATEGORIES } from '../constants/index';

interface CatalogPageProps {
  onOpenAdmin?: () => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({ onOpenAdmin }) => {
  const { products, loading: loadingProducts } = useProducts();
  const { settings } = useSettings();
  const {
    items: cartItems,
    totalItems,
    subtotal,
    getItemQuantity,
    addToCart,
    removeFromCart,
    deleteItem,
  } = useCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('Semua');
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Kategori dinamis dari data produk + fallback kategori dasar
  const categories = useMemo(() => {
    const fromProducts = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    const merged = Array.from(new Set(['Semua', ...DEFAULT_CATEGORIES, ...fromProducts]));
    return merged;
  }, [products]);

  // Filter produk berdasarkan search & kategori
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Filter kategori
      if (
        activeCategory !== 'Semua' &&
        product.category.toLowerCase() !== activeCategory.toLowerCase()
      ) {
        return false;
      }

      // Filter pencarian
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = product.name.toLowerCase().includes(query);
        const matchCategory = product.category.toLowerCase().includes(query);
        const matchUnit = product.unit.toLowerCase().includes(query);
        return matchName || matchCategory || matchUnit;
      }

      return true;
    });
  }, [products, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-stone-50/70 text-stone-900 flex flex-col antialiased selection:bg-amber-100 selection:text-amber-900">
      {/* Header Utama Warung */}
      <Header
        settings={settings}
        totalCartItems={totalItems}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdmin={onOpenAdmin}
      />

      {/* Konten Utama */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-28">
        {/* Banner Status Tutup (Jika Toko Sedang Tutup) */}
        {!settings.isOpen && (
          <div className="p-3.5 sm:p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-950 text-xs sm:text-sm">
            <span className="text-xl">ℹ️</span>
            <div>
              <p className="font-bold">Warung sedang tutup sementara.</p>
              <p className="text-amber-800">
                Anda tetap dapat melihat katalog produk dan menyiapkan keranjang belanja Anda.
              </p>
            </div>
          </div>
        )}

        {/* Kolom Pencarian Cepat */}
        <section aria-label="Pencarian Produk">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </section>

        {/* Navigasi Kategori (Horizontal Scroll) */}
        <section aria-label="Filter Kategori Produk">
          <CategoryPills
            categories={categories}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
          />
        </section>

        {/* Informasi Ringkas / Counter Temuan */}
        <div className="flex items-center justify-between text-xs text-stone-700 px-1">
          <span>
            Menampilkan <strong>{filteredProducts.length}</strong> produk
            {activeCategory !== 'Semua' && ` di kategori "${activeCategory}"`}
            {searchQuery && ` untuk "${searchQuery}"`}
          </span>
        </div>

        {/* Grid Etalase Produk */}
        <section aria-label="Daftar Produk Sembako">
          {loadingProducts ? (
            <div className="py-20 text-center space-y-2">
              <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs sm:text-sm text-stone-500 font-medium">
                Memuat katalog sembako Warung Amma Ika...
              </p>
            </div>
          ) : (
            <ProductGrid
              products={filteredProducts}
              getItemQuantity={getItemQuantity}
              onAddToCart={addToCart}
              onRemoveFromCart={removeFromCart}
            />
          )}
        </section>
      </main>

      {/* Floating Bottom Sticky Cart Bar */}
      <StickyCartBar
        totalItems={totalItems}
        subtotal={subtotal}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        subtotal={subtotal}
        totalItems={totalItems}
        onAddToCart={addToCart}
        onRemoveFromCart={removeFromCart}
        onDeleteItem={deleteItem}
        // Placeholder untuk Phase 4 Checkout
        onProceedToCheckout={undefined}
      />
    </div>
  );
};
