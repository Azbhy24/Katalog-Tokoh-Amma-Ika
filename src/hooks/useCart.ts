import { useState, useEffect, useCallback, useMemo } from 'react';
import { CartItem, Product } from '../types';

const CART_STORAGE_KEY = 'warung_amma_ika_cart_v2';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Sanitasi item agar sesuai struktur CartItem valid
          return parsed.filter(
            (item): item is CartItem =>
              item &&
              item.product &&
              typeof item.product.id === 'string' &&
              typeof item.quantity === 'number' &&
              item.quantity > 0
          );
        }
      }
    } catch (e) {
      console.warn('Failed to load cart from localStorage:', e);
    }
    return [];
  });

  // Persistensi ke localStorage setiap items berubah
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save cart to localStorage:', e);
    }
  }, [items]);

  const totalItems = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [items]);

  const getItemQuantity = useCallback(
    (productId: string): number => {
      const found = items.find((i) => i.product.id === productId);
      return found ? found.quantity : 0;
    },
    [items]
  );

  const addToCart = useCallback((product: Product) => {
    if (!product.inStock) return;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((i) => i.product.id === product.id);
      if (existingIndex > -1) {
        const newItems = [...prevItems];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + 1,
        };
        return newItems;
      } else {
        return [...prevItems, { product, quantity: 1 }];
      }
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((i) => i.product.id === productId);
      if (existingIndex === -1) return prevItems;

      const currentQty = prevItems[existingIndex].quantity;
      if (currentQty <= 1) {
        return prevItems.filter((i) => i.product.id !== productId);
      } else {
        const newItems = [...prevItems];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: currentQty - 1,
        };
        return newItems;
      }
    });
  }, []);

  const deleteItem = useCallback((productId: string) => {
    setItems((prevItems) => prevItems.filter((i) => i.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  return {
    items,
    totalItems,
    subtotal,
    getItemQuantity,
    addToCart,
    removeFromCart,
    deleteItem,
    clearCart,
  };
}
