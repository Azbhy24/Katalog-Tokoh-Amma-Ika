import React, { useState, useMemo } from 'react';
import { Header } from '../components/layout/Header';
import { SearchBar } from '../components/catalog/SearchBar';
import { CategoryPills } from '../components/catalog/CategoryPills';
import { ProductGrid } from '../components/catalog/ProductGrid';
import { StickyCartBar } from '../components/layout/StickyCartBar';
import { CartDrawer } from '../components/cart/CartDrawer';
import { CheckoutModal } from '../components/checkout/CheckoutModal';
import { OrderTrackingModal } from '../components/tracking/OrderTrackingModal';
import { PWAInstallBanner } from '../components/pwa/PWAInstallBanner';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { useSettings } from '../hooks/useSettings';
import { Category, Order } from '../types';
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
    clearCart,
  } = useCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('Semua');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [activeTrackingToken, setActiveTrackingToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('last_active_order_id');
    } catch {
      return null;
    }
  });

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
        hasActiveOrder={Boolean(activeTrackingToken)}
        onOpenTracking={() => setIsTrackingOpen(true)}
      />

      {/* Konten Utama */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-28">
        {/* Banner Pesanan Aktif (Jika Ada Order Dalam Pelacakan) */}
        {activeTrackingToken && (
          <div className="p-3 sm:p-3.5 bg-emerald-50 border border-emerald-200/90 rounded-2xl flex items-center justify-between gap-3 text-emerald-950 text-xs shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <p className="truncate font-semibold text-emerald-900">
                Ada pesanan Anda yang sedang diproses oleh Warung Amma Ika
              </p>
            </div>
            <button
              onClick={() => setIsTrackingOpen(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-2xs uppercase tracking-wider shrink-0 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              Lacak Status
            </button>
          </div>
        )}

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
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Checkout Modal V2 */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        subtotal={subtotal}
        settings={settings}
        onOrderSuccess={(order: Order) => {
          clearCart();
          if (order.secretToken) {
            setActiveTrackingToken(order.secretToken);
          }
        }}
        onOpenTracking={(secretToken: string) => {
          setActiveTrackingToken(secretToken);
          setIsTrackingOpen(true);
        }}
      />

      {/* Realtime Order Tracking Modal V2 */}
      <OrderTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        secretToken={activeTrackingToken}
        settings={settings}
      />

      {/* PWA Promotion Modal */}
      <PWAInstallBanner />
    </div>
  );
};
