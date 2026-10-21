import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  Unsubscribe 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
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
        handleFirestoreError(err, OperationType.GET, PRODUCTS_COLLECTION);
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
export async function createProduct(product: Omit<Product, 'id'> & { id?: string }): Promise<string> {
  const productId = product.id || ('p_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6));
  const newDocRef = doc(db, PRODUCTS_COLLECTION, productId);
  try {
    await setDoc(newDocRef, {
      ...product,
      id: productId,
      inStock: product.inStock !== false,
      createdAt: new Date().toISOString(),
    });
    return productId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${PRODUCTS_COLLECTION}/${productId}`);
    throw error;
  }
}

/**
 * Update produk secara parsial di Firestore
 */
export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(productRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PRODUCTS_COLLECTION}/${id}`);
    throw error;
  }
}

/**
 * Ubah status stok produk (Tersedia / Habis)
 */
export async function toggleProductStock(id: string, currentInStock: boolean): Promise<boolean> {
  const newStock = !currentInStock;
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(productRef, { inStock: newStock });
    return newStock;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PRODUCTS_COLLECTION}/${id}`);
    throw error;
  }
}

/**
 * Simpan atau perbarui seluruh atribut produk (nama, harga, stok, foto, barcode, dll)
 */
export async function saveProduct(product: Product): Promise<void> {
  if (!product.id) {
    throw new Error('ID produk wajib ada untuk memperbarui produk.');
  }
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, product.id);
    const cleanPayload: Record<string, any> = {
      id: product.id,
      name: product.name.trim(),
      price: Math.max(0, Math.round(Number(product.price) || 0)),
      unit: product.unit?.trim() || 'pcs',
      category: product.category || 'Sembako',
      image: product.image?.trim() || '',
      inStock: product.inStock !== false,
    };
    if (product.barcode?.trim()) {
      cleanPayload.barcode = product.barcode.trim();
    }
    if (product.featured !== undefined) {
      cleanPayload.featured = Boolean(product.featured);
    }
    if (product.description?.trim()) {
      cleanPayload.description = product.description.trim();
    }

    await setDoc(productRef, cleanPayload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${PRODUCTS_COLLECTION}/${product.id}`);
    throw error;
  }
}

/**
 * Hapus produk dari Firestore
 */
export async function deleteProduct(id: string): Promise<void> {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, id);
    await deleteDoc(productRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PRODUCTS_COLLECTION}/${id}`);
    throw error;
  }
}
