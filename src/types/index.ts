export type Category = 
  | 'Semua'
  | 'Sembako'
  | 'Telur'
  | 'Mie Instan'
  | 'Minuman'
  | 'Bumbu'
  | 'Snack'
  | 'Kebutuhan Rumah'
  | string;

export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  category: Category;
  image: string;
  inStock: boolean;
  barcode?: string;
  featured?: boolean;
  description?: string;
  // Backward compatibility fields
  trackStock?: boolean;
  stockQty?: number;
  tags?: string[];
  minOrderQty?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type DeliveryMethod = 'delivery' | 'pickup';

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_delivery'
  | 'on_delivery'
  | 'delivering'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  image?: string;
}

export interface CustomerInfo {
  name: string;
  phone?: string;
  deliveryMethod: DeliveryMethod;
  address?: string;
  benchmark?: string;
  notes?: string;
  courierName?: string;
}

export interface Order extends CustomerInfo {
  id: string;
  createdAt: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod?: 'cash' | 'qris';
  // Backward compatibility & courier app forward compatibility fields
  buyerName?: string;
  courier?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryNotes?: string;
  deliveryTime?: string;
  assignedCourierId?: string | null;
  customerId?: string;
  secretToken?: string;
}

export interface StoreContacts {
  OWNER: string;
  KURIR_DULLAH?: string;
  KURIR_LEMAN?: string;
  [key: string]: string | undefined;
}

export interface StoreSettings {
  isOpen: boolean;
  minOrder: number;
  contacts: StoreContacts;
  deliveryFeeDefault: number;
  storeAddress?: string;
}
