import { useState, useEffect } from 'react';
import { Product } from '../types';
import { subscribeToProducts } from '../services/products.service';
import { INITIAL_PRODUCTS } from '../constants/index';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToProducts(
      (loadedProducts) => {
        setProducts(loadedProducts);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    products,
    loading,
    error,
  };
}
