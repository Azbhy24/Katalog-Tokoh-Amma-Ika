import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  Unsubscribe 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Order, OrderItem, CartItem, DeliveryMethod } from '../types';

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
    try {
      localStorage.setItem('last_active_order_id', secretToken);
      localStorage.setItem('last_active_order_number', orderNumber);
    } catch (e) {
      console.warn('Gagal menyimpan order token ke localStorage:', e);
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
  try {
    const docRef = doc(db, 'orders', secretToken);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Order;
  } catch (error) {
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
  try {
    const docRef = doc(db, 'orders', secretToken);
    return onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) {
          callback(null);
        } else {
          callback({ id: snap.id, ...snap.data() } as Order);
        }
      },
      (err) => {
        console.error(`Error subscribing to order ${secretToken}:`, err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.error(`Failed to attach order listener for ${secretToken}:`, err);
    return () => {};
  }
}
