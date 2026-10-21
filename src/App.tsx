/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { 
  History,
  ShoppingBag, 
  Package, 
  Clock, 
  ChevronRight, 
  Plus, 
  Minus, 
  ShoppingCart, 
  ArrowLeft,
  Store,
  CheckCircle2,
  Search,
  Bike,
  User,
  Home,
  LogOut,
  Settings,
  TrendingUp,
  CreditCard,
  Trash2,
  Star,
  MapPin,
  Sparkles,
  Phone,
  ArrowUp,
  ExternalLink,
  Globe,
  Share2,
  Check,
  Barcode,
  Camera,
  Scan,
  Zap,
  ShieldCheck,
  Edit3,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { PRODUCTS, BUNDLES, CONTACTS, PRODUCT_CATEGORIES, type Product, type Bundle } from './constants';
import AdminAddProduct from './components/AdminAddProduct';
import { CatalogPage } from './pages/CatalogPage';
import { PWAInstallBanner } from './components/pwa/PWAInstallBanner';
import { PWAInstallHeaderButton } from './components/pwa/PWAInstallHeaderButton';
import { 
  updateOrderStatus, 
  deleteOrder, 
  subscribeToAllOrders 
} from './services/orders.service';
import { 
  subscribeToProducts, 
  toggleProductStock, 
  saveProduct,
  createProduct,
  deleteProduct
} from './services/products.service';
import type { Order, OrderStatus } from './types';
import { 
  db, 
  auth, 
  googleProvider, 
  OperationType, 
  handleFirestoreError 
} from './lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  signInAnonymously,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  collection, 
  setDoc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';

type View = 'home' | 'bundles' | 'shop' | 'checkout' | 'success' | 'admin' | 'tracker' | 'pos';
type Courier = 'none' | 'dullah' | 'leman';

interface CartItem {
  id: string;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  level?: number;
  toppings?: string[];
  notes?: string;
}

const ORDER_STATUS_CONFIG: { 
  id: OrderStatus; 
  label: string; 
  badgeClass: string; 
  icon: string; 
  description: string;
}[] = [
  { 
    id: 'pending', 
    label: '1. Menunggu Konfirmasi', 
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200', 
    icon: '⏳',
    description: 'Pesanan baru masuk dari pembeli, menunggu konfirmasi toko' 
  },
  { 
    id: 'confirmed', 
    label: '2. Dikonfirmasi', 
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', 
    icon: '📋',
    description: 'Pesanan telah diterima dan disetujui warung' 
  },
  { 
    id: 'preparing', 
    label: '3. Sedang Dikemas', 
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200', 
    icon: '📦',
    description: 'Barang sedang dipersiapkan dan dipacking rapi' 
  },
  { 
    id: 'ready_for_delivery', 
    label: '4. Siap Diantar / Ambil', 
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200', 
    icon: '🛍️',
    description: 'Barang siap diambil di warung atau diserahkan ke kurir' 
  },
  { 
    id: 'on_delivery', 
    label: '5. Sedang Diantar', 
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200', 
    icon: '🛵',
    description: 'Kurir sedang dalam perjalanan ke alamat pembeli' 
  },
  { 
    id: 'delivered', 
    label: '6. Pesanan Selesai', 
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
    icon: '✅',
    description: 'Barang telah diterima pembeli & transaksi selesai' 
  },
  { 
    id: 'cancelled', 
    label: 'X. Batalkan Pesanan', 
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200', 
    icon: '🚫',
    description: 'Pesanan dibatalkan (stok habis atau permintaan pelanggan)' 
  },
];

const formatPriceHelper = (price: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);
};

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    const start = displayValue;
    const end = value;
    if (start === end) return;
    
    const duration = 350; // ms animate time
    const startTime = performance.now();
    let animationFrameId: number;
    
    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = Math.round(start + (end - start) * ease);
      setDisplayValue(current);
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(update);
      }
    };
    
    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value]);
  
  return <>{formatPriceHelper(displayValue)}</>;
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [storeOpen, setStoreOpen] = useState(true);
  const [minOrder, setMinOrder] = useState(20000);
  const [contacts, setContacts] = useState(CONTACTS);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  
  // Amma Ika Interactive Order States
  const [diningMode, setDiningMode] = useState<'dinein' | 'takeaway'>('dinein');
  const [tableNumber, setTableNumber] = useState<string>('102');
  const [guestCount, setGuestCount] = useState<number>(2);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(() => localStorage.getItem('last_active_order_id'));
  
  // Customization Drawer states
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [selectedSpicyLevel, setSelectedSpicyLevel] = useState<number>(0);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [customQuantity, setCustomQuantity] = useState<number>(1);
  const [trackedOrder, setTrackedOrder] = useState<any | null>(null);

  // High-End Cyber POS Financial Billing States
  const [posCashPaidRaw, setPosCashPaidRaw] = useState<string>('');
  const [posCashPaid, setPosCashPaid] = useState<number>(0);
  const [posCheckoutSuccessOpen, setPosCheckoutSuccessOpen] = useState<boolean>(false);
  const [posReceiptDetails, setPosReceiptDetails] = useState<{
    items: any[];
    total: number;
    cash: number;
    change: number;
    invoiceNo: string;
    timestamp: string;
  } | null>(null);

  const handlePosCashChange = (rawText: string) => {
    // Tolerant parser: strip everything except numbers. Prevent errors, return empty cases safely.
    const numericPart = rawText.replace(/[^0-9]/g, '');
    if (!numericPart) {
      setPosCashPaidRaw('');
      setPosCashPaid(0);
      return;
    }
    const val = parseInt(numericPart, 10);
    setPosCashPaid(val);
    
    // Auto format into beautifully formatted thousand separators
    const formatted = new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
    setPosCashPaidRaw('Rp ' + formatted);
  };

  const setQuickCashAmount = (val: number) => {
    triggerHaptic();
    setPosCashPaid(val);
    const formatted = new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
    setPosCashPaidRaw('Rp ' + formatted);
  };

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(20);
      } catch (e) {}
    }
  };

  // Standalone Digital POS States & Actions
  const [posCart, setPosCart] = useState<{ product: any; quantity: number }[]>([]);
  const [posCategory, setPosCategory] = useState<string>('Semua');
  const [posMobileTab, setPosMobileTab] = useState<'catalog' | 'cart'>('catalog');
  
  const posCatalogProducts = [
    { id: 'pos_1', name: 'Kopi Aren Lero', price: 18000, category: 'Minuman', icon: '☕' },
    { id: 'pos_2', name: 'Mie Goreng Lero Pedas', price: 15000, category: 'Makanan', icon: '🍜' },
    { id: 'pos_3', name: 'Es Pisang Ijo Khas Sulawesi', price: 16000, category: 'Dessert', icon: '🍌' },
    { id: 'pos_4', name: 'Ayam Sambal Korek', price: 22000, category: 'Makanan', icon: '🍗' },
    { id: 'pos_5', name: 'Kerupuk Bakwan Ter-Enak', price: 10000, category: 'Cemilan', icon: '🍘' },
    { id: 'pos_6', name: 'Roti Bakar Cokelat Keju', price: 14000, category: 'Dessert', icon: '🍞' },
    { id: 'pos_7', name: 'Teh Manis Krisan Madu', price: 8000, category: 'Minuman', icon: '🍵' },
    { id: 'pos_8', name: 'Dimsum Udang Rambutan', price: 15000, category: 'Cemilan', icon: '🥟' }
  ];

  const filteredPosProducts = posCategory === 'Semua' 
    ? posCatalogProducts 
    : posCatalogProducts.filter(p => p.category.toLowerCase() === posCategory.toLowerCase());

  const addPosProduct = (item: any) => {
    triggerHaptic();
    setPosCart(prev => {
      const existing = prev.find(i => i.product.id === item.id);
      if (existing) {
        return prev.map(i => i.product.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product: item, quantity: 1 }];
    });
  };

  const removePosProduct = (item: any) => {
    triggerHaptic();
    setPosCart(prev => {
      const existing = prev.find(i => i.product.id === item.id);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.product.id === item.id ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.product.id !== item.id);
    });
  };

  const clearPosCart = () => {
    triggerHaptic();
    setPosCart([]);
    setPosCashPaidRaw('');
    setPosCashPaid(0);
  };

  const handlePosCheckout = () => {
    triggerHaptic();
    const total = posCart.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
    const change = posCashPaid - total;
    if (posCashPaid < total) return;
    
    const invoiceNo = 'TRX-' + Math.floor(100000 + Math.random() * 900000);
    const timestamp = new Date().toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: 'short', year: 'numeric' });
    
    setPosReceiptDetails({
      items: [...posCart],
      total,
      cash: posCashPaid,
      change,
      invoiceNo,
      timestamp
    });
    setPosCheckoutSuccessOpen(true);
  };

  const shareReceiptToWhatsApp = (receipt: any) => {
    const text = `*STRUK DIGITAL - WARUNG AMMA IKA*\n` +
      `No Faktur: ${receipt.invoiceNo}\n` +
      `Waktu: ${receipt.timestamp}\n` +
      `--------------------------------\n` +
      receipt.items.map((i: any) => `${i.product.name} x${i.quantity} = ${formatPriceHelper(i.product.price * i.quantity)}`).join('\n') +
      `\n--------------------------------\n` +
      `*Total: ${formatPriceHelper(receipt.total)}*\n` +
      `Tunai: ${formatPriceHelper(receipt.cash)}\n` +
      `*Kembalian: ${formatPriceHelper(receipt.change)}*\n\n` +
      `Terima kasih telah berbelanja di Warung Amma Ika Lero! 🙏✨`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm' | 'prompt';
    title: string;
    message: string;
    placeholder?: string;
    defaultValue?: string;
    onConfirm?: (value?: string) => void;
    onCancel?: () => void;
  } | null>(null);

  const showAlert = (title: string, message: string, onConfirm?: () => void) => {
    setDialog({
      isOpen: true,
      type: 'alert',
      title,
      message,
      onConfirm: () => {
        setDialog(null);
        if (onConfirm) onConfirm();
      }
    });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    setDialog({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      onConfirm: () => {
        setDialog(null);
        onConfirm();
      },
      onCancel: () => {
        setDialog(null);
        if (onCancel) onCancel();
      }
    });
  };

  const showPrompt = (title: string, message: string, defaultValue: string, onConfirm: (val: string) => void, placeholder?: string) => {
    setDialog({
      isOpen: true,
      type: 'prompt',
      title,
      message,
      defaultValue,
      placeholder,
      onConfirm: (val) => {
        setDialog(null);
        onConfirm(val || '');
      },
      onCancel: () => {
        setDialog(null);
      }
    });
  };

  const [cart, setCart] = useState<CartItem[]>([]);
  const [buyerName, setBuyerName] = useState('');
  const [selectedCourier, setSelectedCourier] = useState<Courier>('none');
  const [deliveryTime, setDeliveryTime] = useState('Pagi Ini');
  const [passcodeError, setPasscodeError] = useState('');

  const [adminTab, setAdminTab] = useState<'orders' | 'products' | 'add-product'>('orders');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState<OrderStatus>('pending');
  const [isSavingOrderStatus, setIsSavingOrderStatus] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    unit: '',
    category: 'Sembako',
    image: '',
    inStock: true
  });

  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [adminClickCount, setAdminClickCount] = useState(0);
  
  // Real-time Countdown state for special bakwan promo
  const [countdown, setCountdown] = useState({ hours: 2, minutes: 42, seconds: 15 });

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 3, minutes: 0, seconds: 0 };
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auth Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u && !u.isAnonymous) {
        const emailLower = (u.email || '').toLowerCase();
        if (emailLower === 'advanicplus173@gmail.com') {
          setIsAdminAuthenticated(true);
        } else {
          try {
            const adminDoc = await getDoc(doc(db, 'admins', u.uid));
            if (adminDoc.exists()) {
              setIsAdminAuthenticated(true);
            } else {
              setIsAdminAuthenticated(false);
            }
          } catch {
            setIsAdminAuthenticated(false);
          }
        }
      } else {
        setIsAdminAuthenticated(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Amma Ika QR URL Parameters Integration on Mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const table = params.get('tableNumber');
    if (mode === 'dinein' || mode === 'takeaway') {
      setDiningMode(mode as any);
      if (mode === 'takeaway') {
        setSelectedCourier('none');
      }
    }
    if (table) {
      setTableNumber(table);
    }
  }, []);

  // Real-time listener for customer's active order tracking
  useEffect(() => {
    if (!activeOrderId) {
      setTrackedOrder(null);
      return;
    }
    let isCancelled = false;
    let unsubscribe: (() => void) | null = null;

    const initTracking = () => {
      if (isCancelled) return;

      const orderDocRef = doc(db, 'orders', activeOrderId);
      unsubscribe = onSnapshot(
        orderDocRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setTrackedOrder({ id: snap.id, ...data });
            // If the order exists, automatically make sure buyerName is hydrated
            if (data.buyerName) setBuyerName(data.buyerName);
          } else {
            setTrackedOrder(null);
          }
        },
        (error) => {
          console.warn("Tracked order snapshot notice (access restricted):", error);
        }
      );
    };

    initTracking();

    return () => {
      isCancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [activeOrderId]);

  // Hidden admin trigger: 5 clicks on logo/title
  const handleHeaderClick = () => {
    setAdminClickCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setCurrentView('admin');
        return 0;
      }
      return next;
    });
    setTimeout(() => setAdminClickCount(0), 3000);
  };

  // Sync Settings, Products & Orders
  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'config');

    const unsubSettings = onSnapshot(
      settingsRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setStoreOpen(data.isOpen ?? true);
          setMinOrder(data.minOrder ?? 20000);
          setContacts(data.contacts ?? CONTACTS);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/config');
      }
    );

    const unsubProducts = subscribeToProducts(
      (loadedProducts) => {
        setProducts(loadedProducts);
      },
      (error) => {
        console.warn('Products sync error:', error);
      }
    );

    let unsubOrders = () => {};
    if (isAdminAuthenticated && user) {
      unsubOrders = subscribeToAllOrders(
        (orderList) => {
          setOrders(orderList);
        },
        (error) => {
          console.error('Admin orders subscription error:', error);
        }
      );
    }

    return () => { unsubSettings(); unsubProducts(); unsubOrders(); };
  }, [isAdminAuthenticated, user]);

  const categories = useMemo(() => {
    return ['Semua', ...new Set(products.map(p => p.category))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleAddToCartCustomized = (product: Product, level: number, toppings: string[], notes: string, qty: number) => {
    const toppingsPrice = toppings.reduce((sum, t) => {
      if (t === 'Pangsit Goreng') return sum + 3000;
      if (t === 'Sosis Sapi') return sum + 2000;
      if (t === 'Siomay Kukus') return sum + 3500;
      if (t === 'Keju Lumer') return sum + 2500;
      return sum;
    }, 0);
    const levelSurcharge = level >= 6 ? 1500 : 0;
    const finalUnitPrice = product.price + toppingsPrice + levelSurcharge;
    
    // Create unique key to lump same customization together
    const customId = `${product.id}-level-${level}-toppings-${toppings.sort().join(',')}-notes-${notes}`;
    
    setCart(prev => {
      const existing = prev.find(i => i.id === customId);
      if (existing) {
        return prev.map(i => i.id === customId ? { ...i, quantity: i.quantity + qty } : i);
      }
      return [
        ...prev,
        {
          id: customId,
           productId: product.id,
          name: product.name,
          price: finalUnitPrice,
          quantity: qty,
          image: product.image,
          level: product.category === 'Makanan Matang' ? level : undefined,
          toppings: toppings.length ? toppings : undefined,
          notes: notes.trim() || undefined
        }
      ];
    });
    setCustomizingProduct(null);
  };

  const addToCart = (product: Product | any) => {
    // If it's already a CartItem (has custom ID structure)
    if (product.productId) {
      setCart(prev => prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      return;
    }
    
    // Otherwise, check if category qualifies for a customization drawer
    if (product.category === 'Makanan Matang' || product.category === 'Cemilan & Dessert') {
      setCustomizingProduct(product);
      setSelectedSpicyLevel(2); // default Sedang
      setSelectedToppings([]);
      setCustomNotes('');
      setCustomQuantity(1);
    } else {
      setCart(prev => {
        const existing = prev.find(i => i.id === product.id);
        if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
        return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1, image: product.image }];
      });
    }
  };

  const removeFromCart = (id: string, all = false) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing && existing.quantity > 1 && !all) {
        return prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);
  };

  const handlePlaceOrder = () => {
    if (!storeOpen) {
      showAlert("Buka Tutup", "Maaf, warung sedang tutup sementara.");
      return;
    }
    
    const whatsappNumber = selectedCourier === 'dullah' ? contacts.DULLAH : 
                          selectedCourier === 'leman' ? contacts.LEMAN : contacts.OWNER;
    
    const orderDocRef = doc(collection(db, 'orders'));
    
    // Save to Firestore
    const orderData = {
      buyerName,
      items: cart,
      total: cartTotal,
      courier: selectedCourier,
      deliveryTime,
      diningMode,
      tableNumber: diningMode === 'dinein' ? tableNumber : '',
      guestCount: diningMode === 'dinein' ? guestCount : 0,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setDoc(orderDocRef, orderData)
      .then(() => {
        localStorage.setItem('last_active_order_id', orderDocRef.id);
        setActiveOrderId(orderDocRef.id);
        setCart([]); // Clear Cart upon successful order creation
        setCurrentView('tracker');
      })
      .catch(e => {
        handleFirestoreError(e, OperationType.WRITE, `orders/${orderDocRef.id}`);
      });

    const totalText = formatPrice(cartTotal);
    
    // Format cart text including customization parameters (spiciness and toppings!)
    const itemsList = cart.map(item => {
      const levelText = item.level !== undefined ? ` (Lvl ${item.level})` : '';
      const toppingText = item.toppings?.length ? ` [Topping: ${item.toppings.join(', ')}]` : '';
      const noteText = item.notes ? ` (Catatan: ${item.notes})` : '';
      return `- *${item.name}* ${levelText}${toppingText}${noteText} (${item.quantity}x)`;
    }).join('%0A');

    const modeText = diningMode === 'dinein' ? `DINE-IN MEJA ${tableNumber} (Jumlah Kursi: ${guestCount})` : `TAKEAWAY / AMBIL`;
    const message = `*PESANAN BARU - AMMA IKA*%0A------------------------%0A` +
                    `Nama: *${buyerName.toUpperCase()}*%0A` +
                    `Layanan: *${modeText}*%0A` +
                    `Pesanan:%0A${itemsList}%0A%0A` +
                    `Total: *${totalText}*%0A` +
                    `Pengiriman: *${selectedCourier === 'none' ? 'AMBIL DI TOKO / MEJA' : 'KURIR ' + selectedCourier.toUpperCase()}*%0A` +
                    `Waktu: *${deliveryTime}*`;
    
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  const loginWithGoogle = async () => {
    try {
      setPasscodeError('');
      const result = await signInWithPopup(auth, googleProvider);
      const loggedUser = result.user;
      const userEmail = (loggedUser.email || '').toLowerCase();
      if (userEmail === 'advanicplus173@gmail.com') {
        setIsAdminAuthenticated(true);
        showAlert("Selamat Datang", `Berhasil masuk sebagai Pengelola Warung (${loggedUser.email})`);
      } else {
        const adminDoc = await getDoc(doc(db, 'admins', loggedUser.uid));
        if (adminDoc.exists()) {
          setIsAdminAuthenticated(true);
          showAlert("Selamat Datang", `Berhasil masuk sebagai Pengelola Warung (${loggedUser.email})`);
        } else {
          setIsAdminAuthenticated(false);
          setPasscodeError(`Akses Ditolak: Akun (${loggedUser.email || 'Tanpa Email'}) bukan akun pengelola terdaftar. Silakan login menggunakan akun Google resmi Amma Ika.`);
          await signOut(auth);
        }
      }
    } catch (e: any) {
      console.error('Google Sign In Error:', e);
      setPasscodeError(e.message || 'Gagal login dengan Google');
    }
  };

  const logout = () => signOut(auth).then(() => { 
    setCurrentView('home'); 
    setIsAdminAuthenticated(false); 
    showAlert("Keluar Portal", "Anda telah keluar dari Portal Pengelola.");
  });

  const handleSaveProductEdit = async (e: any) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      await saveProduct(editingProduct);
      setEditingProduct(null);
      showAlert("Berhasil", "Produk berhasil diperbarui!");
    } catch (error) {
      console.error('Gagal menyimpan produk:', error);
      showAlert("Gagal", "Gagal menyimpan perubahan produk. Pastikan koneksi atau izin admin aktif.");
    }
  };

  const handleAddProduct = async (e: any) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      showAlert("Pemberitahuan", "Nama dan Harga produk wajib diisi!");
      return;
    }
    const finalProduct = {
      name: newProduct.name.trim(),
      price: Math.max(0, Math.round(Number(newProduct.price) || 0)),
      unit: newProduct.unit?.trim() || 'pcs',
      category: newProduct.category || 'Sembako',
      image: newProduct.image?.trim() || 'https://images.tokopedia.net/img/cache/700/VqbcmP/2022/4/11/6f2a6f2a-6f2a-6f2a-6f2a-6f2a6f2a6f2a.jpg',
      inStock: newProduct.inStock !== false
    };
    try {
      await createProduct(finalProduct);
      setIsAddingProduct(false);
      setNewProduct({
        name: '',
        price: 0,
        unit: '',
        category: 'Sembako',
        image: '',
        inStock: true
      });
      showAlert("Berhasil", "Produk baru berhasil ditambahkan!");
    } catch (error) {
      console.error('Gagal menambahkan produk:', error);
      showAlert("Gagal", "Gagal menambahkan produk baru. Pastikan koneksi atau izin admin aktif.");
    }
  };

  const handleDeleteProduct = (id: string) => {
    showConfirm("Hapus Produk", "Apakah Anda yakin ingin menghapus produk ini dari etalase?", async () => {
      try {
        await deleteProduct(id);
        showAlert("Terhapus", "Produk berhasil dihapus!");
      } catch (error) {
        console.error('Gagal menghapus produk:', error);
        showAlert("Gagal", "Gagal menghapus produk dari etalase.");
      }
    });
  };

  const toggleStockStatus = async (p: Product) => {
    try {
      await toggleProductStock(p.id, p.inStock);
      // Optimistic update
      setProducts(prev => prev.map(item => item.id === p.id ? { ...item, inStock: !item.inStock } : item));
    } catch (error) {
      console.error('Gagal mengubah status stok:', error);
      showAlert("Gagal", "Gagal memperbarui ketersediaan stok produk.");
    }
  };

  const handleSeedProducts = () => {
    showConfirm("Muat Ulang Produk", "Apakah Anda ingin memuat ulang seluruh produk bawaan ke database cloud?", async () => {
      try {
        for (const p of PRODUCTS) {
          await setDoc(doc(db, 'products', p.id), p);
        }
        showAlert("Asal Mula Berhasil", "Produk bawaan berhasil diunggah ke database cloud!");
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'products');
      }
    });
  };

  const handleToggleStoreStatus = async () => {
    try {
      const settingsRef = doc(db, 'settings', 'config');
      await updateDoc(settingsRef, { isOpen: !storeOpen });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/config');
    }
  };

  const handleChangeMinOrder = async (change: number) => {
    try {
      const settingsRef = doc(db, 'settings', 'config');
      await updateDoc(settingsRef, { minOrder: Math.max(0, minOrder + change) });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/config');
    }
  };

  const handleDeleteOrder = (order: Order) => {
    const docKey = order.documentId || order.secretToken || order.id;
    showConfirm("Hapus Arsip", `Apakah Anda yakin ingin menghapus arsip pesanan ${order.orderNumber || order.id}?`, async () => {
      try {
        await deleteOrder(docKey);
        setOrders(prev => prev.filter(o => (o.documentId !== docKey && o.secretToken !== docKey && o.id !== docKey)));
        showAlert("Berhasil", "Arsip pesanan berhasil dihapus.");
      } catch (error) {
        console.error('Gagal menghapus arsip pesanan:', error);
        showAlert("Gagal", "Gagal menghapus arsip pesanan.");
      }
    });
  };

  const handleSaveOrderStatus = async () => {
    if (!editingOrder) return;
    const docKey = editingOrder.documentId || editingOrder.secretToken || editingOrder.id;
    try {
      setIsSavingOrderStatus(true);
      await updateOrderStatus(docKey, selectedNewStatus);
      setOrders(prev => prev.map(item => 
        (item.documentId === docKey || item.secretToken === docKey || item.id === docKey) 
          ? { ...item, status: selectedNewStatus } 
          : item
      ));
      const statusObj = ORDER_STATUS_CONFIG.find(s => s.id === selectedNewStatus);
      showAlert("Status Diperbarui", `Status pesanan #${editingOrder.orderNumber || editingOrder.id} berhasil diperbarui menjadi "${statusObj?.label || selectedNewStatus}".`);
      setEditingOrder(null);
    } catch (err) {
      console.error('Error updating order status:', err);
      showAlert("Gagal", "Gagal memperbarui status pesanan di database cloud.");
    } finally {
      setIsSavingOrderStatus(false);
    }
  };

  // Chart Data Preparation
  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    }).reverse();

    return last7Days.map(date => ({
      name: date,
      orders: orders.filter(o => new Date(o.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) === date).length
    }));
  }, [orders]);

  const stats = {
    daily: orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length,
    pending: orders.filter(o => o.status === 'pending').length,
    total: formatPrice(orders.reduce((acc, o) => acc + o.total, 0))
  };

  // Scroll to top implementation
  const scrollToProducts = () => {
    const el = document.getElementById('shop-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setCurrentView('shop');
    }
  };

  // Phase 3: Seamless V2 Customer Catalog
  if (currentView === 'home') {
    return (
      <CatalogPage onOpenAdmin={() => setCurrentView('admin')} />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-warung-brand/20 flex flex-col">
      
      {/* 1. Global Header - Stitch Design System */}
      <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-md border-b border-outline-variant/60 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3">
            {/* Logo Brand Segment */}
            <div onClick={handleHeaderClick} className="flex items-center gap-2.5 cursor-pointer select-none shrink-0">
              <div className="w-10 h-10 rounded-xl bg-orange-50/80 border border-orange-200/80 flex items-center justify-center text-primary shadow-xs overflow-hidden relative">
                <img
                  src="/amma_ika_logo_transparan.png"
                  alt="Logo Warung Amma Ika"
                  className="w-full h-full object-contain p-0.5"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="hidden absolute inset-0 items-center justify-center text-primary">
                  <Store className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-primary tracking-tight leading-none">
                  Warung Amma Ika
                </h1>
                <p className="text-[10px] font-medium text-on-surface-variant tracking-wider mt-0.5 sm:hidden">
                  Lero, Pinrang
                </p>
              </div>
            </div>

            {/* Location Badge (Stitch) */}
            <div className="hidden sm:flex items-center gap-1.5 text-primary bg-surface-container-lowest px-3 py-1.5 rounded-full border border-outline-variant/60 shadow-xs">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span className="font-semibold text-xs text-primary">Lero, Pinrang</span>
            </div>

            {/* QR Dine-In / Takeaway Badge & Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="hidden lg:flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/60 shadow-xs px-2.5 py-1.5 rounded-xl text-on-surface select-none">
                <span className="text-xs">{diningMode === 'dinein' ? '🍽️' : '🥡'}</span>
                <div className="text-left">
                  <div className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest leading-none">ORDER</div>
                  <div className="text-[11px] font-bold text-on-surface leading-tight mt-0.5">
                    {diningMode === 'dinein' ? `Meja ${tableNumber}` : 'Takeaway'}
                  </div>
                </div>
                <button 
                  onClick={() => {
                    showConfirm(
                      "Pilih Layanan",
                      "Makan di Meja (Dine-In) atau Bawa Pulang (Takeaway)?",
                      () => {
                        setDiningMode('dinein');
                        showPrompt("Nomor Meja", "Masukkan nomor meja baru:", tableNumber, (val) => {
                          if (val.trim()) setTableNumber(val.trim());
                        });
                      },
                      () => {
                        setDiningMode('takeaway');
                        setSelectedCourier('none');
                      }
                    );
                  }}
                  className="ml-1 text-[9px] bg-surface-container-low px-1.5 py-0.5 rounded text-primary font-bold hover:bg-surface-variant transition-all uppercase cursor-pointer"
                >
                  Ubah
                </button>
              </div>

              <button 
                onClick={() => setCurrentView('pos')}
                className={`px-3 py-2 text-xs font-bold rounded-xl transition-all border cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'pos' 
                    ? 'bg-secondary text-white border-secondary shadow-sm' 
                    : 'bg-surface-container-lowest text-on-surface border-outline-variant/60 hover:bg-surface-container-low'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Kasir POS</span>
              </button>

              <button 
                onClick={() => setCurrentView('home')}
                className={`hidden md:block px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${currentView === 'home' ? 'text-primary bg-primary-container/25' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Katalog
              </button>
              <button 
                onClick={() => setCurrentView('bundles')}
                className={`hidden md:block px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${currentView === 'bundles' ? 'text-primary bg-primary-container/25' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Paket Hemat
              </button>
              
              <PWAInstallHeaderButton />

              <button 
                onClick={() => setCurrentView('admin')}
                className={`p-2 rounded-xl transition-all border cursor-pointer ${
                  currentView === 'admin' 
                    ? 'bg-primary-container text-on-primary-container border-primary-container shadow-xs' 
                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/60 hover:bg-surface-container-low'
                }`}
                title="Papan Kontrol Admin"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Shopping Cart Trigger */}
              <button
                onClick={() => cartCount > 0 ? setCurrentView('checkout') : showAlert('Keranjang Kosong', 'Keranjang belanja Anda kosong. Silakan pilih menu di Etalase terlebih dahulu.')}
                className={`relative p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer border ${
                  cartCount > 0 
                    ? 'bg-primary-container text-on-primary-container border-primary-container shadow-xs' 
                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/60'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-surface">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Quick Search Segment - Stitch Design */}
          <div className="w-full relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant/60">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Cari sembako murah, minyak, beras, mie..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (currentView !== 'shop' && currentView !== 'home') setCurrentView('home');
              }}
              className="block w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/60 rounded-xl text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-xs"
            />
          </div>
        </div>
      </header>

      {/* 2. Brand Ribbon / Marquee Announcements */}
      <div className="bg-brand-600 overflow-hidden py-3 shadow-sm select-none shrink-0 border-y border-brand-700">
        <div className="flex whitespace-nowrap gap-12 font-bold text-xs text-white tracking-widest uppercase items-center animate-scroll">
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="w-7 h-7 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-sm shrink-0 shadow-inner">🦀</span> KRUPUK BAKWAN TER-ENAK DI UJUNG LERO PINRANG!
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="w-7 h-7 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-sm shrink-0 shadow-inner">🚚</span> LAYANAN ANTAR CEPAT LANGSUNG KE DEPAN PINTU DAPUR!
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="w-7 h-7 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-sm shrink-0 shadow-inner">💰</span> HARGA PALING MURAH, SEMBAKO PALING LENGKAP!
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="w-7 h-7 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-sm shrink-0 shadow-inner">🤝</span> PELAYANAN SUPER RAMAH DAN KHAS SULAWESI!
          </div>
          {/* Duplicate to smooth loop */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="w-7 h-7 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-sm shrink-0 shadow-inner">🦀</span> KRUPUK BAKWAN TER-ENAK DI UJUNG LERO PINRANG!
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="w-7 h-7 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-sm shrink-0 shadow-inner">🚚</span> LAYANAN ANTAR CEPAT LANGSUNG KE DEPAN PINTU DAPUR!
          </div>
        </div>
      </div>

      {/* 3. Main content workspace */}
      <main className="flex-1 pb-28 md:pb-12">
        <AnimatePresence mode="wait">
          
          {/* DIGITAL KASIR POS VIEW: Clean, Comfortable, Production Grade Financial Workspace */}
          {currentView === 'pos' && (
            <motion.div
              key="pos"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="relative min-h-screen text-slate-800 pb-20 select-none overflow-hidden bg-slate-50/70"
            >
              {/* Subtle ambient lighting */}
              <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-emerald-500/5 blur-[90px] pointer-events-none" />
              <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />

              <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
                
                {/* Header Info */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 mb-4 sm:mb-6 gap-3">
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 uppercase flex items-center gap-2">
                      <span className="text-emerald-600">⚡</span> KASIR DIGITAL WARUNG
                    </h2>
                    <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                      Warung Amma Ika • Lero Pinrang • POS Kasir Cepat
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-[10px] font-black text-emerald-700 tracking-wider uppercase">ONLINE LIVE</span>
                    </div>
                    <button
                      onClick={clearPosCart}
                      className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 transition-all text-slate-600 font-bold text-[11px] uppercase tracking-wider rounded-xl shadow-2xs cursor-pointer active:scale-95"
                    >
                      Reset Keranjang
                    </button>
                  </div>
                </div>

                {/* Mobile Tab Switcher (Visible on Mobile/Tablet only) */}
                <div className="lg:hidden grid grid-cols-2 gap-2 mb-4 bg-slate-200/70 p-1.5 rounded-2xl border border-slate-300/60 shadow-inner">
                  <button
                    onClick={() => {
                      triggerHaptic();
                      setPosMobileTab('catalog');
                    }}
                    className={`py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      posMobileTab === 'catalog'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🍱</span>
                    <span>Menu ({filteredPosProducts.length})</span>
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic();
                      setPosMobileTab('cart');
                    }}
                    className={`py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 relative ${
                      posMobileTab === 'cart'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🛒</span>
                    <span>Keranjang & Bayar</span>
                    {posCart.length > 0 && (
                      <span className="bg-white text-emerald-700 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-2xs">
                        {posCart.reduce((s, i) => s + i.quantity, 0)}
                      </span>
                    )}
                  </button>
                </div>

                {/* Category Pills Filter (Touch-friendly horizontal scroll) */}
                <div className={`flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-4 -mx-1 px-1 select-none ${posMobileTab === 'cart' ? 'hidden lg:flex' : 'flex'}`}>
                  {['Semua', 'Makanan', 'Minuman', 'Dessert', 'Cemilan'].map(cat => {
                    const active = posCategory.toLowerCase() === cat.toLowerCase();
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          triggerHaptic();
                          setPosCategory(cat);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider whitespace-nowrap transition-all border shrink-0 cursor-pointer shadow-2xs ${
                          active
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {cat === 'Semua' ? '🔥 Semua' : cat === 'Makanan' ? '🍜 Makanan' : cat === 'Minuman' ? '☕ Minuman' : cat === 'Dessert' ? '🍌 Dessert' : '🍘 Cemilan'}
                      </button>
                    );
                  })}
                </div>

                {/* Primary Content Grid Split */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                  
                  {/* LEFT: Products Grid Catalog */}
                  <div className={`lg:col-span-7 space-y-4 ${posMobileTab === 'cart' ? 'hidden lg:block' : 'block'}`}>
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[11px] font-black tracking-wider text-slate-700 uppercase">Katalog Pilihan Warung</span>
                      <span className="text-[11px] font-bold text-slate-500">{filteredPosProducts.length} Menu Tampil</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                      {filteredPosProducts.map(p => {
                        const cartEntry = posCart.find(i => i.product.id === p.id);
                        const qty = cartEntry ? cartEntry.quantity : 0;
                        const isSelected = qty > 0;

                        return (
                          <motion.div
                            key={p.id}
                            whileTap={{ scale: 0.96 }}
                            transition={{ type: "spring", stiffness: 450, damping: 14 }}
                            onClick={() => addPosProduct(p)}
                            className={`group relative p-4 sm:p-5 rounded-2xl bg-white border transition-all cursor-pointer flex flex-col items-center justify-between min-h-[175px] sm:min-h-[195px] text-center select-none shadow-2xs hover:shadow-md ${
                              isSelected 
                                ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/20' 
                                : 'border-slate-200 hover:border-emerald-400/60'
                            }`}
                          >
                            <span className="absolute top-2.5 left-2.5 bg-slate-100 border border-slate-200/60 text-slate-600 font-bold text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider">
                              {p.category}
                            </span>

                            <div className="mt-3 sm:mt-2 w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl shadow-inner">
                              {p.icon}
                            </div>

                            <div className="mt-2 space-y-0.5 w-full">
                              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-tight truncate leading-tight">
                                {p.name}
                              </h4>
                              <p className="text-xs sm:text-sm font-black text-emerald-600 tracking-tight">
                                {formatPriceHelper(p.price)}
                              </p>
                            </div>

                            {/* Control quantity bubble */}
                            {isSelected ? (
                              <div className="mt-2 flex items-center justify-between w-full h-9 bg-slate-100 rounded-xl border border-slate-200 px-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => removePosProduct(p)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all text-sm shadow-2xs active:scale-90"
                                >
                                  -
                                </button>
                                <span className="text-xs font-black text-slate-900 px-1">{qty}</span>
                                <button
                                  type="button"
                                  onClick={() => addPosProduct(p)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all text-sm shadow-2xs active:scale-90"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <div className="mt-2 text-[10px] font-extrabold text-emerald-700 uppercase bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl tracking-wider group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all w-full text-center shadow-2xs">
                                + TAMBAH
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* RIGHT: Financial Sidebar calculations */}
                  <div className={`lg:col-span-5 flex flex-col gap-4 sm:gap-6 ${posMobileTab === 'catalog' ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[11px] font-black tracking-wider text-slate-700 uppercase">Ringkasan Faktur</span>
                      <span className="text-[11px] font-bold text-slate-500">
                        {posCart.reduce((sum, i) => sum + i.quantity, 0)} Porsi Terpilih
                      </span>
                    </div>

                    {/* Scrollable list of items inside the POS cart */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 max-h-56 sm:max-h-64 overflow-y-auto no-scrollbar space-y-2.5 shadow-2xs">
                      {posCart.length === 0 ? (
                        <div className="py-8 flex flex-col justify-center items-center text-center text-slate-400 space-y-2">
                          <span className="text-3xl">🛒</span>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Keranjang Masih Kosong</span>
                          <button
                            onClick={() => setPosMobileTab('catalog')}
                            className="lg:hidden mt-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg uppercase tracking-wider shadow-2xs"
                          >
                            Pilih Menu Sekarang
                          </button>
                        </div>
                      ) : (
                        posCart.map(item => (
                          <div 
                            key={item.product.id}
                            className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                          >
                            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                              {item.product.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-extrabold text-slate-800 uppercase truncate tracking-tight leading-snug">
                                {item.product.name}
                              </h5>
                              <p className="text-[10px] font-bold text-slate-500">
                                {formatPriceHelper(item.product.price)} x {item.quantity}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-slate-900 mr-1">
                                {formatPriceHelper(item.product.price * item.quantity)}
                              </span>
                              <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-200 shrink-0 shadow-2xs">
                                <button 
                                  onClick={() => removePosProduct(item.product)} 
                                  className="w-6 h-6 flex items-center justify-center text-xs font-extrabold text-slate-600 hover:text-slate-900 active:scale-90"
                                >
                                  -
                                </button>
                                <span className="text-xs font-black text-slate-900 px-2">{item.quantity}</span>
                                <button 
                                  onClick={() => addPosProduct(item.product)} 
                                  className="w-6 h-6 flex items-center justify-center text-xs font-extrabold text-emerald-600 hover:text-emerald-700 active:scale-90"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Integrated calculations panel */}
                    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
                      
                      {/* Total bill display */}
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3 sm:pb-4">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 leading-none">TOTAL TAGIHAN</span>
                        <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                          <AnimatedNumber value={posCart.reduce((sum, i) => sum + (i.product.price * i.quantity), 0)} />
                        </span>
                      </div>

                      {/* Cash Input Fields formatted as live rupiah */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-700">BAYAR CASH (INPUT NOMINAL)</label>
                          {posCart.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const total = posCart.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
                                setQuickCashAmount(total);
                              }}
                              className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md uppercase tracking-wider hover:bg-emerald-100 shadow-2xs"
                            >
                              ⚡ Uang Pas
                            </button>
                          )}
                        </div>
                        
                        <div className="flex items-center bg-slate-50 h-12 px-3 sm:px-4 rounded-xl border border-slate-300 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100 transition-all shadow-inner">
                          <span className="text-xs font-black text-emerald-700 tracking-wider uppercase mr-2 sm:mr-3">TUNAI</span>
                          <input
                            type="text"
                            placeholder="Ketik jumlah uang tunai..."
                            value={posCashPaidRaw}
                            onChange={(e) => handlePosCashChange(e.target.value)}
                            className="bg-transparent text-slate-900 font-extrabold text-sm outline-none w-full placeholder-slate-400 border-none"
                          />
                        </div>

                        {/* Quick Nominal Preset Pills for Mobile Cashiers */}
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                          {[10000, 20000, 50000, 100000, 200000].map(amt => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setQuickCashAmount(amt)}
                              className="px-2.5 py-1 bg-slate-100 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 text-[11px] font-mono font-bold text-slate-700 rounded-lg whitespace-nowrap active:scale-95 transition-all shrink-0 shadow-2xs"
                            >
                              {amt >= 1000 ? `${amt / 1000}rb` : amt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Auto calculated Change (Kembalian) display */}
                      <div className="flex justify-between items-center bg-emerald-50/80 px-4 py-3 rounded-xl border border-emerald-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 leading-none">KEMBALIAN TUNAI</span>
                        <span className="text-base sm:text-lg font-black text-emerald-800 font-mono">
                          <AnimatedNumber 
                            value={
                              Math.max(
                                0, 
                                posCashPaid - posCart.reduce((sum, i) => sum + (i.product.price * i.quantity), 0)
                              )
                            } 
                          />
                        </span>
                      </div>

                      {/* Pulsing Glow Checkout Active/Disabled Action Button */}
                      {(() => {
                        const total = posCart.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
                        const canPay = total > 0 && posCashPaid >= total;
                        
                        return (
                          <motion.button
                            onClick={handlePosCheckout}
                            disabled={!canPay}
                            whileTap={canPay ? { scale: 0.96 } : {}}
                            className={`w-full h-13 sm:h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                              canPay 
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/20 hover:brightness-105' 
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            }`}
                          >
                            <span>{canPay ? '🔑' : '🔒'}</span>
                            <span>{canPay ? 'SELESAIKAN BAYAR & STRUK' : 'NOMINAL KURANG'}</span>
                          </motion.button>
                        );
                      })()}

                    </div>
                  </div>

                </div>

                {/* Mobile Floating Sticky Bottom Bar when on Catalog with items */}
                {posMobileTab === 'catalog' && posCart.length > 0 && (
                  <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    className="lg:hidden fixed bottom-16 inset-x-3 z-40 bg-white/95 backdrop-blur-md border border-slate-300 p-3 rounded-2xl shadow-xl flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">
                        {posCart.reduce((s, i) => s + i.quantity, 0)} Item Terpilih
                      </div>
                      <div className="text-sm font-black text-slate-900 truncate">
                        {formatPriceHelper(posCart.reduce((sum, i) => sum + (i.product.price * i.quantity), 0))}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        triggerHaptic();
                        setPosMobileTab('cart');
                      }}
                      className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-md hover:bg-emerald-700 active:scale-95 transition-all shrink-0 flex items-center gap-1.5"
                    >
                      <span>Bayar</span>
                      <span>⚡</span>
                    </button>
                  </motion.div>
                )}

              </div>
            </motion.div>
          )}

          {/* HOME VIEW: V2 Customer Catalog Modular Component */}
          {currentView === 'home' ? (
            <div key="home" className="w-full">
              <CatalogPage onOpenAdmin={() => setCurrentView('admin')} />
            </div>
          ) : null}

          {/* HOME VIEW: Stitch Design System Catalog */}
          {false && currentView === 'home' && (
            <motion.div 
              key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-6 py-4"
            >
              {/* Category Navigation (Stitch Style) */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex overflow-x-auto gap-2.5 hide-scrollbar pb-2 pt-1">
                  {categories.map(cat => {
                    const active = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`whitespace-nowrap px-4 py-2 rounded-full font-semibold text-xs sm:text-sm transition-all cursor-pointer border ${
                          active
                            ? 'bg-primary-container text-on-primary-container border-transparent shadow-xs font-bold scale-102'
                            : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/60 hover:bg-surface-variant'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hero / Promo Banner (Stitch Style) */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative w-full h-44 sm:h-56 rounded-2xl overflow-hidden shadow-sm flex items-center p-6 bg-gradient-to-r from-primary-container via-[#ffa733] to-inverse-primary text-left">
                  <div className="relative z-10 w-2/3 sm:w-1/2 space-y-2">
                    <span className="inline-block px-2.5 py-1 bg-surface-container-lowest text-primary font-bold text-xs rounded-md shadow-xs">
                      Promo
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-on-primary-container leading-tight">
                      Unggulan Minggu Ini
                    </h2>
                    <p className="text-xs sm:text-sm text-on-primary-container/90 font-medium max-w-md hidden sm:block">
                      Dapatkan bahan segar kualitas terbaik untuk keluarga Anda di Warung Amma Ika.
                    </p>
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        onClick={scrollToProducts}
                        className="bg-surface-container-lowest hover:bg-surface-container-low text-primary px-4 py-1.5 rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer"
                      >
                        Belanja Sekarang →
                      </button>
                    </div>
                  </div>
                  <div className="absolute right-0 top-0 bottom-0 w-1/2 overflow-hidden">
                    <img
                      className="w-full h-full object-cover object-left opacity-95 mix-blend-multiply"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBoowsO18ql3rrTZUcrjiZCJtM8BclJaI3Ettf_OkKMIuWpS8INNOj8muWBM96Mtb8l78axwguI_1Wza56bvW6EQzf8DzYeuo1MIhDKIe9jfYvq2mrnt5rF4o_Twylz8_Scq_Yez3VYu2cCviS5cUiLUSY2TWO1QjvhLmIO4yf7mfDYN8pHQ6fKxyO190IKq2xLz_Q5I8ym9hkRDi7XqbsQBMRZ2q69wjVMasJaGU4zOWrSdtUb_7U5"
                      alt="Promo Sembako Segar"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>

              {/* Product Grid Section (Stitch Style) */}
              <section id="shop-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg sm:text-xl font-bold text-on-surface">
                    Katalog Produk
                  </h3>
                  <span className="text-xs font-medium text-on-surface-variant">
                    {filteredProducts.length} Produk Tersedia
                  </span>
                </div>

                {/* Grid of Product Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredProducts.map(p => (
                    <div 
                      key={p.id}
                      className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/40 flex flex-col justify-between group hover:shadow-lg transition-all duration-200 text-left"
                    >
                      {/* Product Image Area */}
                      <div className="h-32 sm:h-48 w-full relative bg-surface-container-low p-4 flex items-center justify-center">
                        {p.image && p.image.trim() !== '' ? (
                          <img 
                            src={p.image} 
                            alt={p.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-outline-variant/60">
                            📦
                          </div>
                        )}
                        {!p.inStock && (
                          <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center p-2">
                            <span className="bg-red-600 text-white font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                              Stok Habis
                            </span>
                          </div>
                        )}
                        {p.barcode && (
                          <span className="absolute bottom-2 left-2 bg-surface-container-lowest/90 border border-outline-variant/60 text-on-surface-variant font-mono text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                            <Barcode className="w-2.5 h-2.5 text-primary" /> {p.barcode}
                          </span>
                        )}
                        {p.category === 'Unggulan' && (
                          <span className="absolute top-2 left-2 bg-primary-container text-on-primary-container font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs">
                            Unggulan 🌟
                          </span>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="p-3 flex flex-col flex-grow justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-bold text-on-surface-variant/80 uppercase tracking-wider">{p.category}</span>
                            {p.unit && <span className="text-[10px] text-on-surface-variant font-medium">{p.unit}</span>}
                          </div>
                          <h4 className="font-semibold text-sm text-on-surface mb-1 line-clamp-2 leading-snug">
                            {p.name}
                          </h4>
                        </div>

                        <div className="mt-3 pt-2 flex items-center justify-between border-t border-outline-variant/20">
                          <span className="font-bold text-sm sm:text-base text-secondary">
                            {formatPrice(p.price)}
                          </span>
                          {p.inStock ? (
                            <button
                              onClick={() => addToCart(p)}
                              className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all active:scale-90 shadow-xs cursor-pointer"
                              title="Tambah ke Keranjang"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              disabled
                              className="w-8 h-8 rounded-full bg-surface-variant text-on-surface-variant/40 flex items-center justify-center cursor-not-allowed"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredProducts.length === 0 && (
                  <div className="bg-surface-container-lowest p-12 text-center rounded-2xl border border-outline-variant/50 space-y-3 shadow-xs">
                    <div className="w-14 h-14 bg-surface-container-low rounded-full flex items-center justify-center mx-auto text-on-surface-variant">
                      <Search className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-base text-on-surface">Produk Tidak Ditemukan</h4>
                    <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                      Cari dengan kata kunci lain atau periksa kategori yang dipilih.
                    </p>
                  </div>
                )}
              </section>

              {/* Location & WhatsApp Contact (Stitch Style) */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 mb-4 text-left">
                <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-xs border border-outline-variant/60 flex flex-col md:flex-row items-center gap-6 justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0 text-primary">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-on-surface mb-1">Lokasi Kami</h3>
                      <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                        Lero, Suppa, Pinrang. Silakan hubungi kami untuk pesanan dalam jumlah besar atau pertanyaan lainnya.
                      </p>
                    </div>
                  </div>
                  <a 
                    href={`https://wa.me/${contacts.OWNER}?text=Halo%20Amma%20Ika%20saya%20mau%20pesan%20sembako`}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="w-full md:w-auto px-6 py-3 h-12 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-xs shrink-0 cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                    Chat WhatsApp
                  </a>
                </div>
              </div>

              {/* Google Maps & Jam Operasional Section */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 pt-4">
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 overflow-hidden shadow-xs flex flex-col lg:flex-row items-stretch text-left">
                  {/* Google Maps Iframe block */}
                  <div className="flex-1 min-h-[280px] lg:min-h-[380px] relative bg-neutral-100">
                    <iframe 
                      title="Google Maps Location Warung Amma Ika"
                      src="https://maps.google.com/maps?q=Warung+Amma+Ika,+Lero,+Suppa,+Pinrang,+Sulawesi+Selatan&output=embed"
                      className="absolute inset-0 w-full h-full border-0 select-none pointer-events-auto"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  </div>

                  {/* Operational Detail Column */}
                  <div className="p-6 sm:p-8 lg:w-[400px] shrink-0 bg-surface-container-low/40 text-on-surface space-y-6 flex flex-col justify-between">
                    <div className="space-y-5">
                      <div className="flex items-start gap-3">
                        <MapPin className="text-primary w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-xs text-on-surface-variant uppercase tracking-wider mb-1">Alamat Warung</h4>
                          <p className="text-xs sm:text-sm font-semibold text-on-surface leading-relaxed">
                            Kampung Lero, Kec. Suppa, Kab. Pinrang, Sulawesi Selatan.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Clock className="text-primary w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-xs text-on-surface-variant uppercase tracking-wider mb-1">Jam Operasional</h4>
                          <p className="text-xs sm:text-sm font-bold text-on-surface">
                            Setiap Hari (07:00 - 22:00 WITA)
                          </p>
                          <span className="text-[10px] text-green-600 font-semibold block mt-1">
                            ✓ Pesanan langsung diproses & siap diantar
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Bike className="text-primary w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-xs text-on-surface-variant uppercase tracking-wider mb-1">Area Delivery</h4>
                          <p className="text-xs sm:text-sm font-semibold text-on-surface leading-relaxed">
                            Melayani seluruh Kampung Lero, Suppa, dan area sekitarnya.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-outline-variant/30">
                      <h4 className="font-bold text-xs text-on-surface-variant uppercase tracking-wider mb-2">Kontak Kami</h4>
                      <div className="space-y-1.5 text-xs text-on-surface">
                        <div className="flex justify-between items-center py-1 border-b border-outline-variant/20">
                          <span>🏪 Amma Ika (Owner)</span>
                          <span className="text-primary font-bold">+852 9858 5059</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span>🛵 Kurir Lero</span>
                          <span className="text-primary font-bold">+62 831 1091 0332</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {/* SHOP VIEW: Instant full catalogue listing */}
          {currentView === 'shop' && (
            <motion.div 
              key="shop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-outline-variant/40 pb-4 text-left">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-on-surface leading-tight">
                    Etalase Sembako Lengkap
                  </h1>
                  <p className="text-xs font-medium text-on-surface-variant mt-1">
                    Semua kebutuhan dapur tersedia, dijamin murah, lengkap & segar!
                  </p>
                </div>
                <div className="text-xs font-semibold text-on-surface-variant shrink-0">
                  Total {filteredProducts.length} Produk
                </div>
              </div>

              {/* Category selector row */}
              <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-2">
                {categories.map(cat => {
                  const active = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`whitespace-nowrap px-4 py-2 rounded-full font-semibold text-xs sm:text-sm transition-all cursor-pointer border ${
                        active
                          ? 'bg-primary-container text-on-primary-container border-transparent shadow-xs font-bold scale-102'
                          : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/60 hover:bg-surface-variant'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Main Catalogue Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map(p => (
                  <div 
                    key={p.id}
                    className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/40 flex flex-col justify-between group hover:shadow-lg transition-all duration-200 text-left"
                  >
                    {/* Image block */}
                    <div className="h-32 sm:h-48 w-full relative bg-surface-container-low p-4 flex items-center justify-center">
                      {p.image && p.image.trim() !== '' ? (
                        <img 
                          src={p.image} 
                          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300" 
                          alt={p.name} 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-outline-variant/60">
                          📦
                        </div>
                      )}
                      {!p.inStock && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center p-2">
                          <span className="bg-red-600 text-white font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                            Stok Habis
                          </span>
                        </div>
                      )}
                      {p.barcode && (
                        <span className="absolute bottom-2 left-2 bg-surface-container-lowest/90 border border-outline-variant/60 text-on-surface-variant font-mono text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                          <Barcode className="w-2.5 h-2.5 text-primary" /> {p.barcode}
                        </span>
                      )}
                    </div>

                    {/* Meta data block */}
                    <div className="p-3 flex flex-col flex-grow justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-bold text-on-surface-variant/80 uppercase tracking-wider">{p.category}</span>
                          {p.unit && <span className="text-[10px] text-on-surface-variant font-medium">{p.unit}</span>}
                        </div>
                        <h4 className="font-semibold text-sm text-on-surface mb-1 line-clamp-2 leading-snug">
                          {p.name}
                        </h4>
                      </div>

                      {/* Action footer block */}
                      <div className="mt-3 pt-2 flex items-center justify-between border-t border-outline-variant/20">
                        <span className="font-bold text-sm sm:text-base text-secondary">
                          {formatPrice(p.price)}
                        </span>
                        {p.inStock ? (
                          <button 
                            onClick={() => addToCart(p)}
                            className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all active:scale-90 shadow-xs cursor-pointer"
                            title="Tambah ke Keranjang"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            disabled 
                            className="w-8 h-8 rounded-full bg-surface-variant text-on-surface-variant/40 flex items-center justify-center cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* BUNDLES VIEW: Custom designed grocery bundle items */}
          {currentView === 'bundles' && (
            <motion.div 
              key="bundles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10 text-left"
            >
              <div className="border-b border-neutral-200 pb-5">
                <h1 className="text-3xl font-black italic tracking-tighter uppercase text-neutral-900 leading-none">
                  Paket Sembako Sejahtera
                </h1>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mt-1">
                  Beli paketan sembako jauh lebih murah, hemat, dan stok dapur aman seminggu penuh!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {BUNDLES.map(b => (
                  <div 
                    key={b.id} 
                    className="bg-white rounded-3xl overflow-hidden border border-neutral-200 shadow-soft hover:shadow-lg transition-all flex flex-col justify-between group"
                  >
                    <div className="relative h-56 bg-neutral-100 overflow-hidden">
                      {b.image && b.image.trim() !== '' ? (
                        <img 
                          src={b.image} 
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" 
                          alt={b.name} 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          🛍️
                        </div>
                      )}
                      <div className="absolute top-4 left-4 bg-yellow-400 px-3 py-1.5 rounded-full text-[10px] font-black text-neutral-900 shadow-md uppercase tracking-wider">
                        Pilihan Amma Ika ⭐
                      </div>
                    </div>

                    <div className="p-8 flex-1 flex flex-col justify-between gap-6">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <h3 className="text-lg font-black text-neutral-900 uppercase leading-none">{b.name}</h3>
                          <p className="text-xs font-medium text-neutral-500 leading-relaxed">{b.description}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[10px] font-bold text-neutral-700">
                          {b.items.map((it, i) => (
                            <span key={i} className="bg-brand-50 px-2.5 py-1.5 rounded-lg border border-brand-100/50 flex items-center gap-1">
                              ✓ {it}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block leading-none">Harga Spesial</span>
                          <span className="text-2xl font-black italic tracking-tighter text-brand-700 leading-none">{formatPrice(b.price)}</span>
                        </div>
                        <button 
                          onClick={() => addToCart(b)}
                          className="bg-brand-600 hover:bg-brand-700 active:scale-95 text-white px-6 py-3.5 rounded-xl font-bold text-xs uppercase shadow-md transition-all shrink-0"
                        >
                          Beli Paket Sembako
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* CHECKOUT VIEW: Smooth state order builder */}
          {currentView === 'checkout' && (
            <motion.div 
              key="checkout" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-left"
            >
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setCurrentView('shop')}
                  className="w-11 h-11 bg-white rounded-xl flex items-center justify-center border border-neutral-200 shadow-soft text-neutral-651 active:scale-90 transition-all hover:border-brand-500 hover:text-brand-500"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-black italic uppercase tracking-tighter text-neutral-900 leading-none">
                    Form Pemesanan
                  </h1>
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mt-1">
                    Isi detail identitas untuk pengantaran kurir Lero
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Side: Form Details */}
                <div className="lg:col-span-7 space-y-6">
                  <section className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200 shadow-soft space-y-6">
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-neutral-900 uppercase tracking-tight text-base leading-none">
                        1. Data Pelanggan
                      </h3>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        Masukan nama anda agar tidak salah kirim
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-neutral-500 ml-1 tracking-widest">
                          NAMA LENGKAP PEMBERSIH / AMMA
                        </label>
                        <input 
                          type="text" 
                          value={buyerName} 
                          onChange={e => setBuyerName(e.target.value)}
                          placeholder="Contoh: Amma Siapa / Abdullah" 
                          className="w-full bg-neutral-100 px-5 py-3.5 rounded-xl text-neutral-800 font-bold border border-transparent outline-none focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-neutral-500 ml-1 tracking-widest">
                          PENGIRIMAN / PENGANTARAN
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            { id: 'none', label: 'Ambil Di Warung', details: 'Ambil mandiri' },
                            { id: 'dullah', label: 'Kurir Dullah', details: 'Lokal Lero' },
                            { id: 'leman', label: 'Kurir Leman', details: 'Lokal Lero' }
                          ].map(c => (
                            <button 
                              key={c.id} 
                              onClick={() => setSelectedCourier(c.id as Courier)}
                              className={`p-4 rounded-xl border-2 text-left flex flex-col justify-between gap-3 transition-all ${
                                selectedCourier === c.id 
                                  ? 'bg-neutral-900 border-neutral-900 text-white shadow-md scale-102' 
                                  : 'bg-white border-neutral-200 text-neutral-700 hover:border-brand-300'
                              }`}
                            >
                              <div className="flex justify-between items-center w-full">
                                <span className="font-extrabold text-xs uppercase tracking-tight">{c.label}</span>
                                {selectedCourier === c.id && <CheckCircle2 className="w-4 h-4 text-brand-451" />}
                              </div>
                              <span className={`text-[10px] font-bold ${selectedCourier === c.id ? 'text-white/60' : 'text-neutral-400'}`}>{c.details}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-neutral-500 ml-1 tracking-widest">
                          JADWAL PENGANTARAN
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {['Pagi Ini (08:00 - 12:00 WITA)', 'Sore Ini (15:00 - 18:00 WITA)', 'Malam Ini (19:00 - 21:00 WITA)', 'Besok Pagi'].map(time => (
                            <button
                              key={time}
                              onClick={() => setDeliveryTime(time)}
                              className={`px-4 py-3 text-xs font-bold rounded-xl border text-center transition-all ${
                                deliveryTime === time 
                                  ? 'bg-brand-50 text-brand-700 border-brand-500' 
                                  : 'bg-white text-neutral-500 border-neutral-200 hover:border-brand-400 hover:text-brand-600'
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Right Side: Cart Summary Checkout Block */}
                <div className="lg:col-span-5 space-y-6">
                  <section className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200 shadow-soft space-y-6">
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-neutral-900 uppercase tracking-tight text-base leading-none">
                        2. Keranjang Belanja
                      </h3>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        Sedia total {cart.length} macam barang
                      </p>
                    </div>

                    <div className="divide-y divide-neutral-100 max-h-[300px] overflow-y-auto pr-1">
                      {cart.map(item => (
                        <div key={item.id} className="py-4 flex items-center gap-4">
                          {item.image && item.image.trim() !== '' ? (
                            <img 
                              src={item.image} 
                              className="w-12 h-12 rounded-xl object-cover border border-neutral-150 shrink-0" 
                              alt={item.name} 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center text-lg border border-neutral-150 shrink-0">
                              📦
                            </div>
                          )}
                          <div className="flex-1 space-y-1 text-left">
                            <h5 className="font-extrabold text-xs text-neutral-900 leading-tight uppercase">{item.name}</h5>
                            <span className="font-bold text-xs text-brand-600 leading-none">{formatPrice(item.price)}</span>
                          </div>
                          
                          {/* Quantity selector */}
                          <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-lg">
                            <button 
                              onClick={() => removeFromCart(item.id)} 
                              className="w-6 h-6 rounded-md hover:bg-neutral-200 flex items-center justify-center text-neutral-500"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-black text-xs min-w-[15px] text-center">{item.quantity}</span>
                            <button 
                              onClick={() => addToCart(item as any)} 
                              className="w-6 h-6 rounded-md bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-sm"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-brand-50 p-4 rounded-xl border border-brand-100 space-y-3">
                      <div className="flex justify-between items-center text-xs font-bold text-neutral-600">
                        <span>Subtotal Belanja</span>
                        <span>{formatPrice(cartTotal)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-neutral-600 border-b border-brand-200/50 pb-2">
                        <span>Biaya Kurir Lero</span>
                        <span className="text-green-600">Bayar Sukarela (COD)</span>
                      </div>
                      <div className="flex justify-between items-end pt-1">
                        <span className="text-xs font-black text-neutral-550 uppercase">Total Invoice</span>
                        <span className="text-xl font-black italic tracking-tighter text-brand-700">{formatPrice(cartTotal)}</span>
                      </div>
                    </div>

                    {/* Submit Order action */}
                    <button 
                      onClick={handlePlaceOrder}
                      disabled={!buyerName.trim() || cart.length === 0}
                      className="w-full bg-brand-600 hover:bg-brand-700 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
                    >
                      <span>🛒 Kirim Pesanan via WhatsApp</span>
                    </button>
                  </section>
                </div>

              </div>
            </motion.div>
          )}

          {/* SUCCESS VIEW: Custom styled screen on finishing checkout */}
          {currentView === 'success' && (
            <motion.div 
              key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-brand-600 flex items-center justify-center p-6 text-center z-50 text-white"
            >
              <div className="space-y-8 max-w-md w-full">
                <div className="flex justify-center">
                  <motion.div 
                    initial={{ scale: 0, rotate: -20 }} 
                    animate={{ scale: 1, rotate: 0 }} 
                    className="w-36 h-36 bg-white rounded-3xl flex items-center justify-center shadow-2xl border-8 border-brand-700 shrink-0"
                  >
                    <CheckCircle2 className="w-16 h-16 text-brand-600 stroke-[3px]" />
                  </motion.div>
                </div>

                <div className="space-y-4">
                  <h1 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-white">
                    SIP! PESANAN SIAP
                  </h1>
                  <p className="text-sm font-semibold text-white/90 leading-relaxed px-2">
                    Pesanan anda sudah berhasil kami teruskan ke WhatsApp nomor Warung Amma Ika / kurir terpilih. Terima kasih sudah mempercayai warung kami ya!
                  </p>
                </div>

                <button 
                  onClick={() => setCurrentView('home')}
                  className="w-full max-w-xs py-4 bg-neutral-900 text-white rounded-xl font-bold tracking-wider text-xs uppercase shadow-xl hover:bg-neutral-850 active:scale-95 transition-all mx-auto"
                >
                  Kembali ke Beranda
                </button>
              </div>
            </motion.div>
          )}

          {/* TRACKER VIEW: Real-time Interactive Grocery & Kitchen Tracking */}
          {currentView === 'tracker' && (
            <motion.div 
              key="tracker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="max-w-xl mx-auto px-4 sm:px-6 py-12 space-y-8 text-center"
            >
              {/* Animated Glowing Header */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white text-xs font-extrabold px-4.5 py-2 rounded-full shadow-lg border border-orange-400 tracking-widest uppercase animate-pulse">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                  Live Order Tracker 🛰️
                </div>
                
                <h1 className="text-3xl font-black italic uppercase tracking-tighter text-neutral-950 leading-none">
                  Layar Pantau Pesanan
                </h1>
                <p className="text-neutral-800/60 text-xs font-semibold uppercase tracking-wider mt-1 px-4 leading-relaxed">
                  Pantau proses penyiapan sembako, cemilan, dan makanan hangat pesanan Anda dari meja kemas Amma Ika
                </p>
              </div>

              {trackedOrder ? (
                <div className="space-y-6">
                  {/* Base Order Meta */}
                  <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-soft text-left space-y-4">
                    <div className="flex justify-between items-start border-b border-neutral-100 pb-3">
                      <div>
                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block leading-none">ORDER ID</span>
                        <span className="text-xs font-black text-neutral-700 tracking-tight block mt-0.5 font-mono">
                          #{trackedOrder.id.substring(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block leading-none font-sans">STATUS</span>
                        <span className={`inline-block text-[10px] font-black uppercase px-2.5 py-1 rounded bg-orange-50 text-orange-650 mt-1 border border-orange-100`}>
                          {trackedOrder.status === 'pending' && 'Antrean Dapur & Kemas 📝'}
                          {trackedOrder.status === 'cooking' && 'Sedang Dipersiapkan 🔥'}
                          {trackedOrder.status === 'ready' && 'Siap Disajikan / Dikirim 🍽️'}
                          {trackedOrder.status === 'completed' && 'Selesai ❤️'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-bold text-neutral-600">
                      <div>
                        <span className="text-[9px] text-neutral-400 block font-normal tracking-wide">Nama Pembeli</span>
                        <span className="text-neutral-800 text-xs uppercase">{trackedOrder.buyerName}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-neutral-400 block font-normal tracking-wide">Layanan</span>
                        <span className="text-neutral-800 text-xs font-extrabold">
                          {trackedOrder.diningMode === 'dinein' ? `Dine-In • Meja ${trackedOrder.tableNumber}` : 'Bawa Pulang / Kirim Kurir'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Step tracker timeline */}
                  <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-soft text-left space-y-8 relative overflow-hidden">
                    {/* Progress Vertical bar */}
                    <div className="absolute left-10 top-12 bottom-12 w-1.5 bg-neutral-100 rounded-full">
                      {/* Active level sizing line */}
                      <div 
                        className="w-full bg-brand-500 rounded-full transition-all duration-1000"
                        style={{
                          height: 
                            trackedOrder.status === 'pending' ? '10%' :
                            trackedOrder.status === 'cooking' ? '50%' :
                            trackedOrder.status === 'ready' ? '85%' : '100%'
                        }}
                      />
                    </div>

                    {/* Step 1: Pending */}
                    <div className="flex gap-5 relative z-10 select-none">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                        trackedOrder.status === 'pending' ? 'bg-orange-600 text-white border-orange-600 ring-4 ring-orange-100 shadow' :
                        ['cooking', 'ready', 'completed'].includes(trackedOrder.status) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-neutral-450 border-neutral-200'
                      }`}>
                        {['cooking', 'ready', 'completed'].includes(trackedOrder.status) ? '✓' : '1'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-extrabold text-neutral-900 uppercase">Pesanan Diterima 📝</h4>
                        <p className="text-xs text-neutral-450 mt-0.5 leading-snug">
                          Pesanan baru masuk ke dalam monitor utama dan sedang diantrekan untuk mulai dibilang, dikemas, atau dimasak hangat.
                        </p>
                      </div>
                    </div>

                    {/* Step 2: Cooking status */}
                    <div className="flex gap-5 relative z-10 select-none">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                        trackedOrder.status === 'cooking' ? 'bg-orange-600 text-white border-orange-600 ring-4 ring-orange-100 shadow animate-pulse' :
                        ['ready', 'completed'].includes(trackedOrder.status) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-neutral-450 border-neutral-200'
                      }`}>
                        {['ready', 'completed'].includes(trackedOrder.status) ? '✓' : '2'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-extrabold text-neutral-900 uppercase">Sedang Dipersiapkan & Dimasak 🔥</h4>
                        <p className="text-xs text-neutral-450 mt-0.5 leading-snug">
                          Amma Ika sedang menimbang sembako pilihan Anda, mengemas paket bundle, membungkus camilan, atau mengolah bumbu khas pesanan matang anda!
                        </p>
                      </div>
                    </div>

                    {/* Step 3: Ready */}
                    <div className="flex gap-5 relative z-10 select-none">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                        trackedOrder.status === 'ready' ? 'bg-orange-600 text-white border-orange-600 ring-4 ring-orange-100 shadow' :
                        ['completed'].includes(trackedOrder.status) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-neutral-450 border-neutral-200'
                      }`}>
                        {['completed'].includes(trackedOrder.status) ? '✓' : '3'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-extrabold text-neutral-900 uppercase">Pesanan Siap Diantar / Sedia! 🍽️</h4>
                        <p className="text-xs text-neutral-450 mt-0.5 leading-snug">
                          {trackedOrder.diningMode === 'dinein' 
                            ? `Staf sedang berjalan mengantarkan pesanan hangat ke nomor Meja Anda (#${trackedOrder.tableNumber})!` 
                            : 'Pesanan sudah rapi terkemas dan siap diambil di konter atau sedang menuju alamat kirim Anda.'}
                        </p>
                      </div>
                    </div>

                    {/* Step 4: Completed */}
                    <div className="flex gap-5 relative z-10 select-none">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                        trackedOrder.status === 'completed' ? 'bg-green-600 text-white border-green-600 ring-4 ring-green-100 shadow' : 'bg-white text-neutral-450 border-neutral-200'
                      }`}>
                        4
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-extrabold text-neutral-900 uppercase">Selesai • Terima Kasih! ❤️</h4>
                        <p className="text-xs text-neutral-450 mt-0.5 leading-snug">
                          Terima kasih banyak sudah mempercayakan belanja kebutuhan pokok & kuliner di Warung Amma Ika. Sampai jumpa kembali!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* List of elements in this tracking session */}
                  <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-soft text-left space-y-3">
                    <span className="text-[9px] font-black uppercase text-neutral-500 tracking-wider block">DAFTAR BELANJAAN & KULINER PANTAUAN</span>
                    <div className="divide-y divide-neutral-100">
                      {trackedOrder.items?.map((it: any, i: number) => {
                        return (
                          <div key={i} className="py-2.5 flex justify-between items-center text-xs font-bold">
                            <div className="space-y-0.5 text-left">
                              <span className="text-neutral-900 uppercase text-xs">{it.name}</span>
                              <div className="flex flex-wrap gap-1 text-[9px] text-neutral-400 font-bold mt-0.5">
                                {it.level !== undefined && (
                                  <span className="bg-orange-50 border border-orange-100 text-orange-600 px-1 rounded">Lvl {it.level}</span>
                                )}
                                {it.toppings?.map((top: string) => (
                                  <span key={top} className="bg-neutral-100 border border-neutral-200 px-1 rounded">+{top}</span>
                                ))}
                                {it.notes && (
                                  <span className="bg-blue-50 border border-blue-100 text-blue-600 px-1 rounded">Catatan: {it.notes}</span>
                                )}
                              </div>
                            </div>
                            <span className="text-neutral-500 shrink-0 select-none font-black text-xs">{it.quantity}x</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-soft space-y-4">
                  <div className="text-3xl">🏜️</div>
                  <h2 className="font-extrabold text-neutral-800 uppercase text-xs leading-none">Tidak Ada Tracking Aktif</h2>
                  <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mx-auto">
                    Anda sedang tidak memiliki rincian pesanan aktif yang dipantau. Silakan memesan melalui menu belanja!
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setCurrentView('shop')}
                  className="px-6 py-3.5 bg-neutral-950 hover:bg-neutral-900 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Belanja Menu Lain 🍜
                </button>
                {activeOrderId && (
                  <button
                    type="button"
                    onClick={() => {
                      showConfirm("Hentikan Pelacakan", "Apakah Anda yakin ingin menghentikan pelacakan pesanan ini?", () => {
                        setActiveOrderId(null);
                        localStorage.removeItem('last_active_order_id');
                        setCurrentView('home');
                      });
                    }}
                    className="px-5 py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Hapus Tracker
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* ADMIN DASHBOARD: Refined, beautiful card control system */}
          {currentView === 'admin' && (
            <motion.div 
              key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10 text-left"
            >
              <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-neutral-200 pb-6">
                <div>
                  <h1 className="text-3xl font-black italic uppercase tracking-tighter text-neutral-900 leading-none">
                    Papan Kontrol Pemilik
                  </h1>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mt-1">
                    Kelola stok, pantau pesanan masuk secara real-time
                  </p>
                </div>
                {isAdminAuthenticated && (
                  <button 
                    onClick={logout} 
                    className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 transition-colors shrink-0"
                  >
                    <LogOut className="w-4 h-4" /> Keluar Portal
                  </button>
                )}
              </header>

              {!isAdminAuthenticated ? (
                // Secure Google Admin Login
                <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-neutral-200 shadow-soft text-center space-y-6">
                  <div className="w-16 h-16 bg-amber-50 rounded-2xl mx-auto flex items-center justify-center border border-amber-200 shadow-sm text-amber-700">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-xl font-extrabold text-neutral-900 uppercase tracking-tight leading-none">
                      Portal Pengelola Warung
                    </h2>
                    <p className="text-xs text-neutral-500 font-medium px-4 leading-relaxed">
                      Laman khusus Amma Ika untuk mengelola produk, mengubah harga, stok, dan memantau pesanan masuk secara real-time.
                    </p>
                  </div>

                  <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-left text-2xs text-neutral-600 space-y-1.5">
                    <p className="font-bold text-neutral-800 flex items-center gap-1.5">
                      <span>🔒</span> Keamanan Otorisasi Terverifikasi
                    </p>
                    <p>
                      Akses administratif dilindungi oleh Firebase Security Rules. Hanya akun Google resmi pemilik yang diizinkan memodifikasi data toko dan melihat daftar pesanan pembeli.
                    </p>
                  </div>

                  {passcodeError && (
                    <div className="text-xs font-semibold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200 text-left">
                      {passcodeError}
                    </div>
                  )}

                  <div className="pt-2 space-y-3">
                    <button 
                      type="button"
                      onClick={loginWithGoogle}
                      className="w-full py-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Globe className="w-4 h-4 text-amber-400" />
                      <span>Masuk dengan Akun Google Resmi</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setCurrentView('home')}
                      className="w-full py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Kembali ke Beranda</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-10">
                  {/* Tab Selector */}
                  <div className="flex flex-wrap gap-2 sm:gap-4 border-b border-neutral-200 pb-1">
                    <button
                      type="button"
                      onClick={() => setAdminTab('orders')}
                      className={`pb-4 px-3 font-bold text-xs tracking-wider transition-all border-b-2 uppercase cursor-pointer ${
                        adminTab === 'orders' 
                          ? 'border-brand-600 text-brand-600' 
                          : 'border-transparent text-neutral-400 hover:text-neutral-600'
                      }`}
                    >
                      Ringkasan & Pesanan 📊
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminTab('products')}
                      className={`pb-4 px-3 font-bold text-xs tracking-wider transition-all border-b-2 uppercase cursor-pointer ${
                        adminTab === 'products' 
                          ? 'border-brand-600 text-brand-600' 
                          : 'border-transparent text-neutral-400 hover:text-neutral-600'
                      }`}
                    >
                      Kelola Etalase ({products.length}) 📋
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminTab('add-product')}
                      className={`pb-4 px-3 font-bold text-xs tracking-wider transition-all border-b-2 uppercase flex items-center gap-1.5 cursor-pointer ${
                        adminTab === 'add-product' 
                          ? 'border-brand-600 text-brand-600 bg-brand-50/50 rounded-t-lg' 
                          : 'border-transparent text-brand-600 hover:text-brand-700'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Tambah Produk (Scan Barcode) 📷</span>
                    </button>
                  </div>

                  {adminTab === 'orders' ? (
                    <div className="space-y-10">
                      {/* Dashboard stats layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                      { label: "Pesanan Hari Ini", val: stats.daily, actionLabel: "Pesanan Aktif", color: "text-blue-600 bg-blue-50 border-blue-100" },
                      { label: "Menunggu Tindakan", val: stats.pending, actionLabel: "Pending", color: "text-orange-600 bg-orange-50 border-orange-100" },
                      { label: "Total Penjualan", val: stats.total, actionLabel: "Semua Cabang", color: "text-emerald-600 bg-emerald-50 border-emerald-100" }
                    ].map((st, i) => (
                      <div key={i} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-soft flex items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-neutral-450 uppercase tracking-widest">{st.label}</span>
                          <p className="text-2xl font-black text-neutral-900 tracking-tight">{st.val}</p>
                        </div>
                        <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border rounded-md ${st.color}`}>
                          {st.actionLabel}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Interactive charts and config controls */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Orders history line graph */}
                    <section className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200 shadow-soft space-y-6 lg:col-span-8">
                      <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                        <TrendingUp className="w-5 h-5 text-brand-600" />
                        <h3 className="font-extrabold text-neutral-950 uppercase tracking-tight text-sm">
                          Grafik Tren Pembelian 7 Hari Terakhir
                        </h3>
                      </div>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                            <YAxis hide />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', fontWeight: 800, fontSize: '11px' }} />
                            <Line type="monotone" dataKey="orders" stroke="#FF6B00" strokeWidth={4} dot={{ r: 6, fill: '#FF6B00', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </section>

                    {/* Shop operational switches */}
                    <section className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200 shadow-soft space-y-8 lg:col-span-4">
                      <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                        <Settings className="w-5 h-5 text-neutral-500" />
                        <h3 className="font-extrabold text-neutral-950 uppercase tracking-tight text-sm">
                          Setelan Toko Utama
                        </h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-neutral-100 rounded-xl flex items-center justify-between border border-neutral-200">
                          <div className="space-y-1">
                            <span className="font-bold text-[10px] text-neutral-400 uppercase tracking-wider block">Status Layanan</span>
                            <span className={`text-xs font-black uppercase tracking-wide tracking-tight ${storeOpen ? 'text-green-600' : 'text-red-500'}`}>
                              {storeOpen ? 'Buka Sekarang • Live' : 'Sedang Tutup • Offline'}
                            </span>
                          </div>
                          
                          <button 
                            type="button"
                            onClick={handleToggleStoreStatus}
                            className={`w-14 h-7 rounded-full p-1 relative items-center transition-all cursor-pointer ${storeOpen ? 'bg-green-500' : 'bg-red-400'}`}
                          >
                            <span className={`block w-5 h-5 bg-white rounded-full shadow-sm transition-all absolute top-1 ${storeOpen ? 'right-1' : 'left-1'}`} />
                          </button>
                        </div>

                        <div className="p-4 border border-dashed border-neutral-200 rounded-xl space-y-3 text-center">
                          <span className="font-bold text-[10px] text-neutral-400 uppercase tracking-widest block leading-none">
                            MINIMUM ORDER DELIVERY
                          </span>
                          <div className="flex items-center justify-center gap-4">
                            <button 
                              onClick={() => handleChangeMinOrder(-5000)} 
                              className="w-8 h-8 rounded-lg border border-neutral-250 flex items-center justify-center bg-white cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-base font-extrabold tracking-tight text-neutral-800">{formatPrice(minOrder)}</span>
                            <button 
                              onClick={() => handleChangeMinOrder(5000)} 
                              className="w-8 h-8 rounded-lg border border-neutral-250 flex items-center justify-center bg-white cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Orders history list */}
                  <section className="bg-white p-6 sm:p-10 rounded-2xl border border-neutral-200 shadow-soft space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-100 pb-5">
                      <div>
                        <h3 className="font-extrabold text-neutral-900 uppercase tracking-tight text-base leading-none">
                          Arsip Pesanan Masuk
                        </h3>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
                          Pembaruan otomatis real-time dari pembeli website
                        </p>
                      </div>
                      <span className="bg-brand-50 border border-brand-150 text-brand-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        Total {orders.length} Pesanan
                      </span>
                    </div>

                    <div className="space-y-6">
                      {orders.map(o => (
                        <div 
                          key={o.documentId || o.secretToken || o.id} 
                          className="p-5 sm:p-6 bg-neutral-100 rounded-xl border border-neutral-200 space-y-4 text-left relative group/item"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h5 className="font-extrabold text-neutral-900 text-sm leading-none uppercase">{o.buyerName || o.name}</h5>
                                <span className="font-mono text-[10px] font-bold text-brand-700 bg-brand-50 border border-brand-200 px-1.5 py-0.5 rounded">
                                  #{o.orderNumber || o.id}
                                </span>
                              </div>
                              <span className="text-[10px] text-neutral-400 font-bold block">
                                {new Date(o.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                              </span>
                            </div>

                            <div className="flex items-center flex-wrap gap-2">
                              {/* Status badge - klik langsung untuk ubah status */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingOrder(o);
                                  setSelectedNewStatus((o.status as OrderStatus) || 'pending');
                                }}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border cursor-pointer flex items-center gap-1.5 shadow-2xs hover:scale-102 transition-all ${
                                  o.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' :
                                  o.status === 'confirmed' ? 'bg-amber-50 text-amber-700 border-amber-250 hover:bg-amber-100' :
                                  o.status === 'preparing' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' :
                                  o.status === 'ready_for_delivery' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' :
                                  o.status === 'on_delivery' || o.status === 'delivering' ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' :
                                  o.status === 'delivered' || o.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100' :
                                  'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                }`}
                                title="Klik untuk ubah status pesanan ini"
                              >
                                <span>{ORDER_STATUS_CONFIG.find(c => c.id === o.status)?.icon || '📌'}</span>
                                <span>{ORDER_STATUS_CONFIG.find(c => c.id === o.status)?.label || o.status}</span>
                              </button>

                              {/* Tombol Edit Pensil Khusus Mobile & Desktop */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingOrder(o);
                                  setSelectedNewStatus((o.status as OrderStatus) || 'pending');
                                }}
                                className="px-2.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-xl font-bold text-xs flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                                title="Ubah status pesanan ini"
                              >
                                <span>✏️</span>
                                <span className="text-[10px] font-extrabold uppercase">Edit Status</span>
                              </button>

                              {/* Tombol Hapus */}
                              <button 
                                onClick={() => handleDeleteOrder(o)} 
                                className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                                title="Hapus arsip ini"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2">
                            {o.items?.map((it: any, i: number) => (
                              <div key={i} className="bg-white px-3 py-2 rounded-lg border border-neutral-150 flex items-center gap-2 shadow-sm text-[10px] font-bold text-neutral-700">
                                {it.image && it.image.trim() !== '' ? (
                                  <img src={it.image} className="w-6 h-6 rounded-md object-cover border border-neutral-100 shrink-0" alt={it.name} referrerPolicy="no-referrer" />
                                ) : (
                                  <span className="w-6 h-6 rounded-md bg-neutral-100 flex items-center justify-center text-xs">📦</span>
                                )}
                                <span>{it.name} <span className="text-brand-600 font-extrabold ml-1">x{it.quantity}</span></span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-3 border-t border-neutral-200 flex flex-wrap justify-between items-center gap-4 text-[10px] font-bold">
                            <div className="space-y-0.5">
                              <span className="text-neutral-400 uppercase tracking-widest block leading-none">Total Belanja</span>
                              <span className="text-sm font-extrabold text-brand-700 italic">{formatPrice(o.total)}</span>
                            </div>
                            <div className="text-right space-y-0.5">
                              <span className="text-neutral-400 uppercase tracking-widest block leading-none">Pilihan Pengiriman / Jadwal</span>
                              <span className="text-neutral-700 uppercase tracking-tight italic block">
                                {o.courier === 'none' ? 'AMBIL SENDIRI' : 'KURIR ' + o.courier?.toUpperCase()} • {o.deliveryTime}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {orders.length === 0 && (
                        <div className="py-16 text-center space-y-3 rounded-xl border-2 border-dashed border-neutral-200">
                          <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400">
                            <Clock className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                            Belum ada pesanan masuk di data harian.
                          </p>
                        </div>
                      )}

                      {/* Modal / Bottom Sheet Edit Status Pesanan */}
                      {editingOrder && (
                        <div 
                          className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in"
                          onClick={(e) => {
                            if (e.target === e.currentTarget && !isSavingOrderStatus) {
                              setEditingOrder(null);
                            }
                          }}
                        >
                          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl border border-neutral-200 max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden text-left animate-in slide-in-from-bottom">
                            {/* Drag handle for mobile */}
                            <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto my-2.5 sm:hidden" />

                            {/* Header */}
                            <div className="px-5 py-4 border-b border-neutral-100 flex items-start justify-between bg-neutral-50/90 shrink-0">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                    Pesanan #{editingOrder.orderNumber || editingOrder.id}
                                  </span>
                                  <span className="text-[10px] font-bold text-neutral-400">
                                    {new Date(editingOrder.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <h4 className="font-black text-neutral-900 text-base leading-tight uppercase pt-0.5">
                                  Ubah Status: {editingOrder.buyerName || editingOrder.name}
                                </h4>
                                <p className="text-xs font-semibold text-neutral-500">
                                  Total {formatPrice(editingOrder.total)} • {editingOrder.courier === 'none' ? 'Ambil di Toko' : 'Kurir ' + editingOrder.courier?.toUpperCase()}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setEditingOrder(null)}
                                disabled={isSavingOrderStatus}
                                className="w-8 h-8 rounded-full bg-neutral-200/80 hover:bg-neutral-300 text-neutral-700 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer shrink-0 ml-2"
                                title="Tutup"
                              >
                                ✕
                              </button>
                            </div>

                            {/* Body (scrollable) */}
                            <div className="p-5 overflow-y-auto flex-1 space-y-4">
                              {/* Rincian Produk Pesanan (Konfirmasi Visual Jelas) */}
                              <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200/80 space-y-2">
                                <div className="flex items-center justify-between text-[11px] font-bold text-neutral-600">
                                  <span>Rincian Barang yang Dipesan ({editingOrder.items?.length || 0} macam):</span>
                                  <span className="text-brand-600 font-extrabold">{formatPrice(editingOrder.total)}</span>
                                </div>
                                <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                                  {editingOrder.items?.map((it: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-neutral-150">
                                      <div className="flex items-center gap-2 truncate">
                                        {it.image && it.image.trim() !== '' ? (
                                          <img src={it.image} alt={it.name} className="w-6 h-6 rounded object-cover shrink-0" />
                                        ) : (
                                          <span className="w-6 h-6 rounded bg-neutral-100 flex items-center justify-center text-2xs">📦</span>
                                        )}
                                        <span className="font-semibold text-neutral-800 truncate">{it.name}</span>
                                      </div>
                                      <span className="font-bold text-brand-700 ml-2 shrink-0">x{it.quantity}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Pilihan Status Pesanan */}
                              <div className="space-y-2 pt-1">
                                <label className="text-[11px] font-black uppercase text-neutral-600 tracking-wider block">
                                  Pilih Status Baru:
                                </label>
                                <div className="space-y-2">
                                  {ORDER_STATUS_CONFIG.map(statusItem => {
                                    const isSelected = selectedNewStatus === statusItem.id;
                                    return (
                                      <button
                                        key={statusItem.id}
                                        type="button"
                                        onClick={() => setSelectedNewStatus(statusItem.id)}
                                        className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                                          isSelected
                                            ? 'bg-brand-50/70 border-brand-500 ring-2 ring-brand-400/40 shadow-xs'
                                            : 'bg-white border-neutral-200 hover:bg-neutral-50'
                                        }`}
                                      >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 border ${statusItem.badgeClass}`}>
                                          {statusItem.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between">
                                            <span className={`text-xs font-black uppercase tracking-tight ${isSelected ? 'text-brand-900' : 'text-neutral-900'}`}>
                                              {statusItem.label}
                                            </span>
                                            {isSelected && (
                                              <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                                ✓
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-[11px] text-neutral-500 mt-0.5 leading-tight">
                                            {statusItem.description}
                                          </p>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Footer (Sticky di HP, mudah dijangkau) */}
                            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center gap-3 shrink-0">
                              <button
                                type="button"
                                onClick={() => setEditingOrder(null)}
                                disabled={isSavingOrderStatus}
                                className="px-5 py-3 rounded-xl border border-neutral-300 bg-white text-neutral-700 font-bold text-xs uppercase tracking-wider hover:bg-neutral-100 transition-colors cursor-pointer"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveOrderStatus}
                                disabled={isSavingOrderStatus}
                                className="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                              >
                                {isSavingOrderStatus ? (
                                  <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Menyimpan...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Simpan Status</span>
                                    <span>💾</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
                  ) : adminTab === 'add-product' ? (
                    <AdminAddProduct 
                      showAlert={showAlert} 
                      onSuccess={() => setAdminTab('products')} 
                      onCancel={() => setAdminTab('products')} 
                    />
                  ) : (
                <div className="space-y-8">
                  {/* Product management tab view */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-extrabold text-neutral-900 uppercase tracking-tight text-lg leading-none">
                        Kelola Etalase Toko
                      </h3>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1.5">
                        Kelola ketersediaan, edit info detail, scan barcode kemasan, atau tambah produk baru
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={handleSeedProducts}
                        className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shrink-0 flex items-center gap-1.5 border border-neutral-200 cursor-pointer"
                      >
                        Reset Produk Bawaan 🔄
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminTab('add-product')}
                        className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Tambah / Scan Barcode 📷</span>
                      </button>
                    </div>
                  </div>

                  {/* Edit Product Modal / Bottom Sheet */}
                  {editingProduct && (
                    <div 
                      className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in"
                      onClick={(e) => {
                        if (e.target === e.currentTarget) setEditingProduct(null);
                      }}
                    >
                      <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl border border-neutral-200 max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden text-left animate-in slide-in-from-bottom">
                        <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto my-2.5 sm:hidden" />
                        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/90 shrink-0">
                          <div>
                            <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest block">Pengelola Toko</span>
                            <h4 className="font-black text-neutral-900 uppercase tracking-tight text-sm">
                              ✏️ Edit Detail Produk: {editingProduct.name}
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingProduct(null)}
                            className="w-8 h-8 rounded-full bg-neutral-200/80 hover:bg-neutral-300 text-neutral-700 flex items-center justify-center font-bold text-sm cursor-pointer"
                            title="Tutup"
                          >
                            ✕
                          </button>
                        </div>
                        <form onSubmit={handleSaveProductEdit} className="p-5 overflow-y-auto flex-1 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-neutral-500 tracking-wider">Nama Produk *</label>
                              <input
                                type="text"
                                required
                                value={editingProduct.name || ''}
                                onChange={e => setEditingProduct(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                                className="w-full bg-white px-4 py-2.5 rounded-lg border border-neutral-300 text-xs font-semibold focus:outline-none focus:border-brand-500 text-neutral-800"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-neutral-500 tracking-wider">Harga (Rp) *</label>
                                <input
                                  type="number"
                                  required
                                  value={editingProduct.price || ''}
                                  onChange={e => setEditingProduct(prev => prev ? ({ ...prev, price: Number(e.target.value) }) : null)}
                                  className="w-full bg-white px-4 py-2.5 rounded-lg border border-neutral-300 text-xs font-semibold focus:outline-none focus:border-brand-500 text-neutral-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-neutral-500 tracking-wider">Satuan Unit</label>
                                <input
                                  type="text"
                                  value={editingProduct.unit || ''}
                                  onChange={e => setEditingProduct(prev => prev ? ({ ...prev, unit: e.target.value }) : null)}
                                  className="w-full bg-white px-4 py-2.5 rounded-lg border border-neutral-300 text-xs font-semibold focus:outline-none focus:border-brand-500 text-neutral-800"
                                />
                              </div>
                            </div>

                            {/* Barcode & Category */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-neutral-500 tracking-wider">Barcode</label>
                                <input
                                  type="text"
                                  value={editingProduct.barcode || ''}
                                  onChange={e => setEditingProduct(prev => prev ? ({ ...prev, barcode: e.target.value }) : null)}
                                  placeholder="Nomor Barcode"
                                  className="w-full bg-white px-4 py-2.5 rounded-lg border border-neutral-300 text-xs font-mono font-bold focus:outline-none focus:border-brand-500 text-neutral-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-neutral-500 tracking-wider">Kategori</label>
                                <select
                                  value={editingProduct.category || 'Sembako'}
                                  onChange={e => setEditingProduct(prev => prev ? ({ ...prev, category: e.target.value }) : null)}
                                  className="w-full bg-white px-4 py-2.5 rounded-lg border border-neutral-300 text-xs font-semibold focus:outline-none focus:border-brand-500 text-neutral-800 cursor-pointer"
                                >
                                  {PRODUCT_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-neutral-500 tracking-wider">Status Stok</label>
                              <div className="flex items-center gap-3 h-10">
                                <label className="inline-flex items-center cursor-pointer gap-2 bg-white px-3 py-2 rounded-lg border border-neutral-200">
                                  <input
                                    type="checkbox"
                                    checked={editingProduct.inStock !== false}
                                    onChange={e => setEditingProduct(prev => prev ? ({ ...prev, inStock: e.target.checked }) : null)}
                                    className="w-4.5 h-4.5 text-brand-600 border-neutral-300 rounded cursor-pointer"
                                  />
                                  <span className="text-xs font-bold text-neutral-700">Tersedia di Etalase</span>
                                </label>
                              </div>
                            </div>

                            <div className="space-y-1 md:col-span-2">
                              <label className="text-[9px] font-black uppercase text-neutral-500 tracking-wider">URL Gambar Produk</label>
                              <input
                                type="text"
                                value={editingProduct.image || ''}
                                onChange={e => setEditingProduct(prev => prev ? ({ ...prev, image: e.target.value }) : null)}
                                className="w-full bg-white px-4 py-2.5 rounded-lg border border-neutral-300 text-xs font-semibold focus:outline-none focus:border-brand-500 text-neutral-800"
                              />
                            </div>
                          </div>

                          <div className="pt-3 sticky bottom-0 bg-white py-3 border-t border-neutral-150 flex justify-end gap-3 shrink-0">
                            <button
                              type="button"
                              onClick={() => setEditingProduct(null)}
                              className="px-4 py-2.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                            >
                              Simpan Perubahan 💾
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Grid layout of all products */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map(p => (
                      <div key={p.id} className="bg-white border border-neutral-200 rounded-2xl shadow-soft flex flex-col overflow-hidden text-left relative group/prod">
                        <div className="relative aspect-video w-full bg-neutral-100 border-b border-b-neutral-100 overflow-hidden shrink-0">
                          {p.image && p.image.trim() !== '' ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform group-hover/prod:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl text-neutral-400">
                              📦
                            </div>
                          )}
                          <span className="absolute top-2.5 left-2.5 bg-neutral-900/80 backdrop-blur-md text-white font-bold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-widest">
                            {p.category}
                          </span>
                          {p.barcode && (
                            <span className="absolute bottom-2.5 left-2.5 bg-black/75 backdrop-blur-md text-white font-mono font-bold text-[9px] px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Barcode className="w-3 h-3 text-amber-400" />
                              {p.barcode}
                            </span>
                          )}
                        </div>
                        
                        <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-neutral-900 text-xs uppercase tracking-tight line-clamp-2 leading-snug">
                              {p.name}
                            </h4>
                            <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                              Unit: {p.unit || 'pcs'}
                            </span>
                            <span className="text-sm font-black text-brand-600 block mt-1">
                              {formatPrice(p.price)}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-neutral-150 flex items-center justify-between gap-2">
                            {/* Stock toggle button */}
                            <button
                              type="button"
                              onClick={() => toggleStockStatus(p)}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer ${
                                p.inStock
                                  ? 'bg-green-50 text-green-700 border-green-150 hover:bg-green-100'
                                  : 'bg-red-50 text-red-500 border-red-150 hover:bg-red-100'
                              }`}
                            >
                              {p.inStock ? 'Tersedia' : 'Habis • Tutup'}
                            </button>

                            <div className="flex gap-1.5">
                              {/* Edit details */}
                              <button
                                type="button"
                                onClick={() => setEditingProduct(p)}
                                className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 rounded-lg border border-neutral-200 transition-colors text-xs cursor-pointer"
                                title="Edit info"
                              >
                                ✏️
                              </button>
                              {/* Delete product */}
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1.5 text-neutral-405 hover:text-red-500 hover:bg-red-50 rounded-lg border border-neutral-200 transition-colors cursor-pointer"
                                title="Hapus produk"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* 5. Minimalistic Professional Footer */}
      <footer className="bg-white border-t border-neutral-200 mt-auto py-12 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-extrabold text-neutral-950 uppercase tracking-tight leading-none text-base">
              WARUNG AMMA IKA
            </h4>
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
              Lero, Suppa, Pinrang, Sulawesi Selatan • Indonesia
            </p>
          </div>
          <div className="text-xs text-neutral-405 font-bold uppercase tracking-wide">
            © {new Date().getFullYear()} Warung Amma Ika. Hak Cipta Dilindungi.
          </div>
        </div>
      </footer>

      {/* 6. Signature Product Customization Drawer/Modal */}
      <AnimatePresence>
        {customizingProduct && (
          <div className="fixed inset-0 z-55 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
            {/* Backdrop click closer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCustomizingProduct(null)}
              className="absolute inset-0 cursor-pointer bg-neutral-950/20"
            />
            
            {/* Drawer Body */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] z-10 text-left"
            >
              {/* Product Header Hero Image */}
              <div className="relative h-44 bg-neutral-100 shrink-0">
                {customizingProduct.image && customizingProduct.image.trim() !== '' ? (
                  <img
                    src={customizingProduct.image}
                    alt={customizingProduct.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    📦
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setCustomizingProduct(null)}
                  className="absolute top-4 right-4 w-9 h-9 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-sm font-extrabold shadow-md cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable details */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                <div className="space-y-1">
                  <div className="inline-block bg-orange-100 text-orange-700 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    {customizingProduct.category}
                  </div>
                  <h3 className="font-extrabold text-sm sm:text-base text-neutral-950 uppercase tracking-tight leading-snug">
                    {customizingProduct.name}
                  </h3>
                  <p className="text-xs font-black text-orange-600">
                    {formatPrice(customizingProduct.price)} (Base)
                  </p>
                </div>

                {/* Spicy Level Selector (Only for Makanan Matang category) */}
                {customizingProduct.category === 'Makanan Matang' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-200/40">
                      <label className="text-[9px] font-black uppercase text-neutral-500 tracking-wider">
                        🌶️ KUSTOMISASI PEDAS (LEVEL 0 - 8)
                      </label>
                      <span className="text-xs font-black text-orange-655 bg-orange-50 px-2 py-0.5 rounded">
                        {selectedSpicyLevel === 0 ? 'Original (No Chili 🌸)' : `Level ${selectedSpicyLevel} 🌶️`}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-1.5">
                      {[0, 1, 2, 3, 4, 5, 6, 8].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setSelectedSpicyLevel(lvl)}
                          className={`py-3 px-1 rounded-xl text-xs font-black text-center flex flex-col justify-center items-center gap-1 border transition-all ${
                            selectedSpicyLevel === lvl
                              ? 'bg-orange-600 border-orange-600 text-white shadow-md font-extrabold'
                              : 'bg-white hover:border-neutral-400 border-neutral-200 text-neutral-800'
                          }`}
                        >
                          <span className="leading-none text-xs">{lvl}</span>
                          <span className="text-[8px] font-medium leading-none opacity-80">
                            {lvl >= 6 ? '+Rp 1.5k' : 'Free'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extra Toppings Selector */}
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-neutral-500 tracking-wider">
                    🥟 TOPPING TAMBAHAN (OPSIONAL)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(customizingProduct.category === 'Makanan Matang'
                      ? [
                          { name: 'Telur Mata Sapi', price: 3000, desc: 'Telur dadar / mata sapi hangat' },
                          { name: 'Sosis Sapi', price: 2000, desc: 'Sosis potong goreng gurih' },
                          { name: 'Bawang Goreng Extra', price: 1000, desc: 'Ekstra kriuk bawang goreng manis' },
                          { name: 'Pangsit Garing', price: 3000, desc: 'Kulit lumpia renyah (1 pc)' }
                        ]
                      : [
                          { name: 'Keju Parut', price: 2500, desc: 'Keju cheddar parut gurih' },
                          { name: 'Cokelat Meses', price: 2000, desc: 'Meses butiran manis lezat' },
                          { name: 'Susu Kental Manis', price: 1500, desc: 'Susu manis ekstra creamy' },
                          { name: 'Nangka Manis', price: 3000, desc: 'Potongan buah nangka harum' }
                        ]
                    ).map((topping) => {
                      const isSelected = selectedToppings.includes(topping.name);
                      return (
                        <button
                          key={topping.name}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedToppings(prev => prev.filter(t => t !== topping.name));
                            } else {
                              setSelectedToppings(prev => [...prev, topping.name]);
                            }
                          }}
                          className={`p-3 text-left rounded-xl border flex flex-col justify-between transition-all select-none cursor-pointer ${
                            isSelected
                              ? 'bg-orange-50 border-orange-400 text-neutral-900 shadow-xs'
                              : 'bg-white hover:border-neutral-300 border-neutral-200 text-neutral-800'
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="text-xs font-black leading-tight">{topping.name}</span>
                            <span className="text-[10px] font-black text-orange-655">+{formatPrice(topping.price)}</span>
                          </div>
                          <span className="text-[9px] font-medium text-neutral-400 mt-1">{topping.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Special Cooking Notes */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-neutral-500 tracking-wider">
                    ✏️ CATATAN PENYIAPAN (OPSIONAL)
                  </label>
                  <textarea
                    rows={2}
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="Contoh: Pisah bawang goreng / Tambah es batu..."
                    className="w-full bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-xs font-bold leading-normal outline-none focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all text-neutral-800"
                  />
                </div>
              </div>

              {/* Sticky Footer: Quantity Selector and Add Button */}
              <div className="p-4 sm:p-6 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between gap-4 shrink-0">
                {/* Quantity Stepper */}
                <div className="flex items-center gap-3 bg-white border border-neutral-200/80 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setCustomQuantity(prev => Math.max(1, prev - 1))}
                    className="w-8 h-8 rounded-lg hover:bg-neutral-100 text-neutral-700 flex items-center justify-center text-sm font-black cursor-pointer"
                  >
                    －
                  </button>
                  <span className="font-extrabold text-sm text-neutral-900 min-w-[18px] text-center">
                    {customQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCustomQuantity(prev => prev + 1)}
                    className="w-8 h-8 rounded-lg bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center text-sm font-black cursor-pointer"
                  >
                    ＋
                  </button>
                </div>

                {/* Add to Cart with Surcharge Calculation */}
                <button
                  type="button"
                  onClick={() => {
                    handleAddToCartCustomized(
                      customizingProduct,
                      selectedSpicyLevel,
                      selectedToppings,
                      customNotes,
                      customQuantity
                    );
                  }}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95 text-center flex justify-between items-center cursor-pointer"
                >
                  <span>Tambahkan</span>
                  <span>
                    {formatPrice(
                      (customizingProduct.price +
                        (selectedSpicyLevel >= 6 ? 1500 : 0) +
                        selectedToppings.reduce((sum, t) => {
                          if (t === 'Telur Mata Sapi') return sum + 3000;
                          if (t === 'Sosis Sapi') return sum + 2000;
                          if (t === 'Bawang Goreng Extra') return sum + 1000;
                          if (t === 'Pangsit Garing') return sum + 3000;
                          
                          if (t === 'Keju Parut') return sum + 2500;
                          if (t === 'Cokelat Meses') return sum + 2000;
                          if (t === 'Susu Kental Manis') return sum + 1500;
                          if (t === 'Nangka Manis') return sum + 3000;
                          return sum;
                        }, 0)) *
                        customQuantity
                    )}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Modern Digital POS Receipt Success Overlay */}
      <AnimatePresence>
        {posCheckoutSuccessOpen && posReceiptDetails && (
          <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative bg-white border border-slate-200 w-full max-w-md rounded-3xl shadow-2xl p-6 z-10 text-left overflow-hidden text-slate-900"
            >
              {/* Visual success splash */}
              <div className="text-center py-4 border-b border-slate-100">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full mx-auto flex items-center justify-center text-2xl font-black mb-3 shadow-inner">
                  ✓
                </div>
                <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-wider">
                  TRANSAKSI SUKSES ⚡
                </h3>
                <p className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                  Struk Pembayaran Digital • Warung Amma Ika
                </p>
              </div>

              {/* Invoice Meta details */}
              <div className="py-4 border-b border-slate-100 space-y-1.5 text-xs font-semibold text-slate-600 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">No. Faktur:</span>
                  <span className="font-mono text-emerald-700 font-bold">{posReceiptDetails.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Waktu Cetak:</span>
                  <span className="font-bold text-slate-700">{posReceiptDetails.timestamp}</span>
                </div>
              </div>

              {/* Bill List */}
              <div className="py-4 border-b border-slate-100 max-h-40 overflow-y-auto no-scrollbar space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-2 font-sans">Daftar Belanjaan</span>
                {posReceiptDetails.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="font-bold uppercase text-slate-800 truncate max-w-[200px]">
                      {item.product.name} <span className="text-slate-400 font-mono text-[11px]">x{item.quantity}</span>
                    </span>
                    <span className="font-mono text-slate-600 font-semibold">
                      {formatPriceHelper(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Calculation Details */}
              <div className="py-4 space-y-2.5 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-500 uppercase">SUBTOTAL BILL</span>
                  <span className="text-slate-900 font-extrabold">{formatPriceHelper(posReceiptDetails.total)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-slate-100 pt-2.5">
                  <span className="text-slate-500 uppercase">TUNAI DITERIMA</span>
                  <span className="text-slate-900 font-mono font-bold">{formatPriceHelper(posReceiptDetails.cash)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm border-t border-slate-100 pt-2.5">
                  <span className="text-emerald-700 uppercase">KEMBALIAN CASH</span>
                  <span className="text-emerald-700 font-mono font-black">{formatPriceHelper(posReceiptDetails.change)}</span>
                </div>
              </div>

              {/* Action Buttons for Mobile & Desktop */}
              <div className="mt-5 grid grid-cols-2 gap-2.5 font-sans">
                <button
                  onClick={() => shareReceiptToWhatsApp(posReceiptDetails)}
                  className="bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-white py-3 rounded-xl font-bold text-[11px] uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>💬</span>
                  <span>Kirim WA</span>
                </button>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') window.print();
                  }}
                  className="bg-slate-100 border border-slate-200 hover:bg-slate-200 active:scale-95 text-slate-700 py-3 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>🖨️</span>
                  <span>Cetak Struk</span>
                </button>
              </div>

              {/* Reset and Continue action button */}
              <div className="mt-2.5 font-sans">
                <button
                  onClick={() => {
                    triggerHaptic();
                    clearPosCart();
                    setPosCheckoutSuccessOpen(false);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center cursor-pointer"
                >
                  ⚡ Buat Transaksi Baru
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Custom Dialog Modal (Replaces browser alert/confirm/prompt) */}
      <AnimatePresence>
        {dialog && dialog.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (dialog.type === 'alert' || dialog.type === 'confirm') {
                  if (dialog.onCancel) {
                    dialog.onCancel();
                  } else {
                    setDialog(null);
                  }
                }
              }}
              className="absolute inset-0 cursor-pointer bg-neutral-950/20"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full max-w-sm rounded-[24px] shadow-2xl p-6 overflow-hidden z-10 text-left border border-neutral-100"
            >
              <h3 className="font-extrabold text-neutral-950 text-base uppercase tracking-tight">
                {dialog.title}
              </h3>
              <p className="text-xs font-semibold text-neutral-600 mt-2 leading-relaxed">
                {dialog.message}
              </p>

              {dialog.type === 'prompt' && (
                <div className="mt-4">
                  <input
                    type="text"
                    id="dialog-prompt-input"
                    defaultValue={dialog.defaultValue}
                    placeholder={dialog.placeholder}
                    className="w-full bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-xs font-bold leading-normal outline-none focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all text-neutral-800"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (document.getElementById('dialog-prompt-input') as HTMLInputElement)?.value;
                        if (dialog.onConfirm) dialog.onConfirm(val);
                      }
                    }}
                  />
                </div>
              )}

              <div className="mt-6 flex gap-3 justify-end">
                {dialog.type !== 'alert' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (dialog.onCancel) {
                        dialog.onCancel();
                      } else {
                        setDialog(null);
                      }
                    }}
                    className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (dialog.type === 'prompt') {
                      const val = (document.getElementById('dialog-prompt-input') as HTMLInputElement)?.value;
                      if (dialog.onConfirm) dialog.onConfirm(val);
                    } else {
                      if (dialog.onConfirm) dialog.onConfirm();
                    }
                  }}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. Ultra-Modern Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-neutral-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-center justify-around select-none">
        <button
          onClick={() => {
            triggerHaptic();
            setCurrentView('home');
          }}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
            currentView === 'home'
              ? 'text-orange-600 font-extrabold'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <span className="text-lg">🏠</span>
          <span className="text-[9px] uppercase tracking-wider mt-0.5">Beranda</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic();
            setCurrentView('pos');
          }}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all relative ${
            currentView === 'pos'
              ? 'bg-emerald-50 text-emerald-700 shadow-2xs border border-emerald-200 font-extrabold'
              : 'text-slate-500 hover:text-emerald-700 font-semibold'
          }`}
        >
          <span className="text-lg">⚡</span>
          <span className="text-[9px] uppercase tracking-wider mt-0.5">Kasir POS</span>
          {posCart.length > 0 && currentView !== 'pos' && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
              {posCart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            triggerHaptic();
            setCurrentView('shop');
          }}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all relative ${
            currentView === 'shop'
              ? 'text-orange-600 font-extrabold'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <span className="text-lg">🛒</span>
          <span className="text-[9px] uppercase tracking-wider mt-0.5">Belanja</span>
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-600 text-white text-[9px] font-black flex items-center justify-center">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            triggerHaptic();
            setCurrentView('bundles');
          }}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
            currentView === 'bundles'
              ? 'text-orange-600 font-extrabold'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <span className="text-lg">📦</span>
          <span className="text-[9px] uppercase tracking-wider mt-0.5">Paket</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic();
            setCurrentView('tracking');
          }}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
            currentView === 'tracking'
              ? 'text-orange-600 font-extrabold'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <span className="text-lg">📍</span>
          <span className="text-[9px] uppercase tracking-wider mt-0.5">Lacak</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic();
            setCurrentView('admin');
          }}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
            currentView === 'admin'
              ? 'text-orange-600 font-extrabold'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <span className="text-lg">⚙️</span>
          <span className="text-[9px] uppercase tracking-wider mt-0.5">Admin</span>
        </button>
      </div>

      {/* PWA In-App Install Prompt Banner */}
      <PWAInstallBanner />

    </div>
  );
}
