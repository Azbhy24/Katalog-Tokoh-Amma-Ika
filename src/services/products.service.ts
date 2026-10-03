import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { INITIAL_PRODUCTS } from '../constants/index';

const PRODUCTS_COLLECTION = 'products';

/**
 * Berlangganan (realtime listener) ke koleksi products di Firestore.
 * Jika koleksi kosong atau offline, secara otomatis menggunakan INITIAL_PRODUCTS sebagai fallback.
 */
export function subscribeToProducts(
  onSuccess: (products: Product[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    
    return onSnapshot(
      productsRef,
      (snapshot) => {
        if (snapshot.empty) {
          onSuccess(INITIAL_PRODUCTS);
          return;
        }

        const loadedProducts: Product[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name || '',
            price: Number(data.price) || 0,
            unit: data.unit || 'pcs',
            category: data.category || 'Sembako',
            image: data.image || '',
            inStock: data.inStock !== false,
            barcode: data.barcode,
            featured: Boolean(data.featured),
            description: data.description,
            trackStock: data.trackStock,
            stockQty: data.stockQty,
            tags: data.tags,
            minOrderQty: data.minOrderQty,
          };
        });

        onSuccess(loadedProducts);
      },
      (err) => {
        console.warn('Firestore products listener error, falling back to local products:', err);
        if (onError) onError(err);
        onSuccess(INITIAL_PRODUCTS);
      }
    );
  } catch (error) {
    console.error('Failed to attach products listener:', error);
    onSuccess(INITIAL_PRODUCTS);
    return () => {};
  }
}

/**
 * Tambah produk baru ke Firestore
 */
export async function createProduct(product: Omit<Product, 'id'>): Promise<string> {
  const newDocRef = doc(collection(db, PRODUCTS_COLLECTION));
  await setDoc(newDocRef, {
    ...product,
    createdAt: new Date().toISOString(),
  });
  return newDocRef.id;
}

/**
 * Update produk di Firestore
 */
export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const productRef = doc(db, PRODUCTS_COLLECTION, id);
  await updateDoc(productRef, updates);
}

/**
 * Hapus produk dari Firestore
 */
export async function deleteProduct(id: string): Promise<void> {
  const productRef = doc(db, PRODUCTS_COLLECTION, id);
  await deleteDoc(productRef);
}
