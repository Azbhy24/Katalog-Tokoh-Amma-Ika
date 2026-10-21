import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  deleteDoc,
  onSnapshot, 
  Unsubscribe,
  DocumentSnapshot,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Order, OrderItem, CartItem, DeliveryMethod, OrderStatus } from '../types';

export interface CreateOrderInput {
  name: string;
  phone: string;
  deliveryMethod: DeliveryMethod;
  address?: string;
  benchmark?: string;
  notes?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

/**
 * Menghasilkan token akses rahasia berkekuatan kriptografi tinggi
 */
export function generateSecretToken(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `sec_${randomHex}`;
  }
  return `sec_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
}

/**
 * Helper untuk normalisasi document Firestore ke model Order dengan pemetaan ID yang jelas:
 * - documentId: ID dokumen Firestore (secretToken)
 * - secretToken: Token akses rahasia yang sama dengan documentId
 * - id: Nomor pesanan publik (misal ORD-XXXXXX)
 * - orderNumber: Alias eksplisit untuk nomor pesanan publik
 */
export function mapOrderDoc(snap: DocumentSnapshot | QueryDocumentSnapshot): Order {
  const data = snap.data() as Record<string, any> || {};
  const docKey = snap.id; // Firestore document ID (secretToken)
  const pubOrderNumber = data.orderNumber || data.id || ('ORD-' + docKey.replace(/^sec_/, '').substring(0, 6).toUpperCase());

  return {
    ...data,
    documentId: docKey,
    secretToken: data.secretToken || docKey,
    id: pubOrderNumber,
    orderNumber: pubOrderNumber,
  } as Order;
}

/**
 * Menyimpan pesanan baru ke Firestore orders collection dengan isolasi privasi
 */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  // Validasi keranjang belanja
  if (!input.items || input.items.length === 0) {
    throw new Error('Keranjang belanja kosong. Silakan pilih produk terlebih dahulu.');
  }

  // 1. Human-readable Order ID untuk tampilan antarmuka & pesan WhatsApp
  const orderNumber = 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  // 2. Secret access token dengan entropi tinggi sebagai kunci dokumen Firestore
  const secretToken = generateSecretToken();

  // Document reference berakar pada secretToken sehingga tidak dapat ditebak oleh pihak ketiga
  const orderDocRef = doc(db, 'orders', secretToken);

  // Transform cart items ke model OrderItem
  const orderItems: OrderItem[] = input.items.map(({ product, quantity }) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    quantity,
    unit: product.unit,
    image: product.image || '',
  }));

  const cleanedAddress = input.deliveryMethod === 'delivery' ? (input.address?.trim() || '') : '';
  const cleanedBenchmark = input.deliveryMethod === 'delivery' ? (input.benchmark?.trim() || '') : '';
  const cleanedNotes = input.notes?.trim() || '';

  // Payload order komprehensif terlindungi token rahasia
  const newOrder: Order = {
    id: orderNumber,
    orderNumber,
    documentId: secretToken,
    secretToken,
    createdAt: new Date().toISOString(),
    name: input.name.trim(),
    buyerName: input.name.trim(), // backward compat for legacy admin
    phone: input.phone.trim(),
    customerPhone: input.phone.trim(),
    deliveryMethod: input.deliveryMethod,
    courier: input.deliveryMethod === 'delivery' ? 'kurir' : 'none',
    deliveryTime: 'Sekarang (Secepatnya)',
    address: cleanedAddress,
    deliveryAddress: cleanedAddress,
    benchmark: cleanedBenchmark,
    notes: cleanedNotes,
    deliveryNotes: cleanedNotes,
    items: orderItems,
    subtotal: input.subtotal,
    deliveryFee: input.deliveryFee,
    total: input.total,
    status: 'pending',
    assignedCourierId: null, // forward compat untuk sistem aplikasi kurir
    paymentMethod: 'cash',
  };

  try {
    await setDoc(orderDocRef, newOrder);
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      try {
        window.localStorage.setItem('last_active_order_id', secretToken);
        window.localStorage.setItem('last_active_order_number', orderNumber);
      } catch (e) {
        console.warn('Gagal menyimpan order token ke localStorage:', e);
      }
    }
    return newOrder;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `orders/${secretToken}`);
    throw error;
  }
}

/**
 * Mengambil data pesanan tunggal berdasarkan secretToken
 */
export async function getOrderById(secretToken: string): Promise<Order | null> {
  if (!secretToken || typeof secretToken !== 'string' || !secretToken.trim()) {
    return null;
  }
  try {
    const docRef = doc(db, 'orders', secretToken.trim());
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return mapOrderDoc(snap);
  } catch (error: any) {
    const code = error?.code || '';
    const msg = (typeof error?.message === 'string' ? error.message : '').toLowerCase();
    const isPermissionDenied = 
      code === 'permission-denied' ||
      msg.includes('permission-denied') ||
      msg.includes('insufficient permissions');

    if (isPermissionDenied) {
      // Di bawah Firestore Rules, token acak/tidak cocok akan memicu permission-denied
      return null;
    }

    const isNetwork = 
      code === 'unavailable' ||
      code === 'deadline-exceeded' ||
      msg.includes('offline') ||
      msg.includes('network') ||
      msg.includes('client is offline');

    if (isNetwork) {
      throw new Error('Koneksi internet bermasalah saat mengambil data pesanan.');
    }

    handleFirestoreError(error, OperationType.GET, `orders/${secretToken}`);
    return null;
  }
}

/**
 * Berlangganan status pesanan secara realtime menggunakan secretToken
 */
export function subscribeToOrder(
  secretToken: string, 
  callback: (order: Order | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!secretToken || typeof secretToken !== 'string' || !secretToken.trim()) {
    callback(null);
    return () => {};
  }

  try {
    const docRef = doc(db, 'orders', secretToken.trim());
    return onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) {
          callback(null);
        } else {
          callback(mapOrderDoc(snap));
        }
      },
      (err: any) => {
        const code = err?.code || '';
        const msg = (typeof err?.message === 'string' ? err.message : '').toLowerCase();
        const isPermissionDenied = 
          code === 'permission-denied' ||
          msg.includes('permission-denied') ||
          msg.includes('insufficient permissions');

        if (isPermissionDenied) {
          // Token tidak valid atau pesanan tidak ditemukan di bawah aturan keamanan isolasi
          callback(null);
          return;
        }

        console.error(`Error subscribing to order ${secretToken}:`, err);
        if (onError) onError(err instanceof Error ? err : new Error(String(err)));
      }
    );
  } catch (err: any) {
    console.error(`Failed to attach order listener for ${secretToken}:`, err);
    if (onError) onError(err instanceof Error ? err : new Error(String(err)));
    return () => {};
  }
}

/**
 * Mengubah status pesanan oleh ADMIN (menggunakan documentId / secretToken Firestore)
 */
export async function updateOrderStatus(orderRefKey: string, status: OrderStatus): Promise<void> {
  if (!orderRefKey) {
    throw new Error('ID / Document Key pesanan tidak valid untuk update.');
  }
  try {
    const orderDocRef = doc(db, 'orders', orderRefKey);
    await updateDoc(orderDocRef, { 
      status,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${orderRefKey}`);
    throw error;
  }
}

/**
 * Menghapus arsip pesanan oleh ADMIN (menggunakan documentId / secretToken Firestore)
 */
export async function deleteOrder(orderRefKey: string): Promise<void> {
  if (!orderRefKey) {
    throw new Error('ID / Document Key pesanan tidak valid untuk hapus.');
  }
  try {
    const orderDocRef = doc(db, 'orders', orderRefKey);
    await deleteDoc(orderDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `orders/${orderRefKey}`);
    throw error;
  }
}

/**
 * Berlangganan seluruh pesanan masuk secara realtime untuk ADMIN
 */
export function subscribeToAllOrders(
  onSuccess: (orders: Order[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  try {
    const ordersCol = collection(db, 'orders');
    return onSnapshot(
      ordersCol,
      (snapshot) => {
        const list: Order[] = snapshot.docs.map((docSnap) => mapOrderDoc(docSnap));
        // Urutkan dari pesanan terbaru
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onSuccess(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'orders');
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.error('Failed to attach admin orders listener:', err);
    return () => {};
  }
}
