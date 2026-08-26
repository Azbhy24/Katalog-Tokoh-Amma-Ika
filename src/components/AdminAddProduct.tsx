import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { 
  Camera, 
  Barcode, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  X, 
  RotateCcw, 
  Save, 
  Sparkles, 
  Image as ImageIcon,
  ArrowRight,
  Check,
  RefreshCw,
  Eye
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { PRODUCT_CATEGORIES, type Product } from '../constants';

interface AdminAddProductProps {
  onSuccess?: (product: Product) => void;
  onCancel?: () => void;
  showAlert: (title: string, message: string) => void;
}

export default function AdminAddProduct({ onSuccess, onCancel, showAlert }: AdminAddProductProps) {
  // Form States
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [priceFormatted, setPriceFormatted] = useState('');
  const [category, setCategory] = useState('Sembako');
  const [unit, setUnit] = useState('pcs');
  const [image, setImage] = useState('');
  const [inStock, setInStock] = useState(true);
  const [featured, setFeatured] = useState(false);

  // Scanner & API States
  const [isScanning, setIsScanning] = useState(false);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [apiLookupStatus, setApiLookupStatus] = useState<'idle' | 'found' | 'not_found' | 'error'>('idle');
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccessNotification, setSaveSuccessNotification] = useState<string | null>(null);

  // Scanner references
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'admin-barcode-scanner-view';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean audio beep on scan
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  };

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([40, 30, 40]);
      } catch (e) {}
    }
  };

  // Stop scanner safely
  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Scanner stop warning:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  // Start Scanner
  const startScanner = async () => {
    setIsScanning(true);
    setApiLookupStatus('idle');
    setApiMessage(null);

    // Wait for DOM element to be ready
    setTimeout(async () => {
      try {
        if (scannerRef.current) {
          await stopScanner();
        }

        const html5QrCode = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE
          ],
          verbose: false
        });

        scannerRef.current = html5QrCode;

        const qrCodeSuccessCallback = (decodedText: string) => {
          playBeep();
          triggerHaptic();
          stopScanner();
          handleBarcodeDetected(decodedText.trim());
        };

        const config = {
          fps: 15,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const edge = Math.floor(minEdge * 0.8);
            return { width: edge, height: Math.floor(edge * 0.65) };
          },
          aspectRatio: 1.0
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          qrCodeSuccessCallback,
          () => {
            // Ongoing frame scanning - ignore individual frame mismatches
          }
        );
      } catch (error: any) {
        console.error('Camera start error:', error);
        setIsScanning(false);
        showAlert(
          'Izin Kamera',
          'Tidak dapat mengakses kamera. Pastikan izin kamera aktif atau gunakan input barcode manual.'
        );
      }
    }, 150);
  };

  // Query Open Food Facts API
  const fetchOpenFoodFacts = async (codeToLookup: string) => {
    if (!codeToLookup) return;
    setIsSearchingApi(true);
    setApiLookupStatus('idle');
    setApiMessage(null);

    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(codeToLookup)}.json`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 1 && data.product) {
        // Product Found!
        const prod = data.product;
        const productName = prod.product_name_id || 
                            prod.product_name || 
                            prod.generic_name_id || 
                            prod.generic_name || 
                            prod.brands || 
                            '';

        const productImg = prod.image_front_url || 
                           prod.image_url || 
                           prod.image_front_small_url || 
                           (prod.selected_images?.front?.display?.id ? prod.selected_images.front.display.id : '') || 
                           '';

        const productQuantity = prod.quantity || '';

        if (productName) {
          setName(productName);
        }
        if (productImg) {
          setImage(productImg);
        }
        if (productQuantity && !unit) {
          setUnit(productQuantity);
        }

        // Auto-guess Category if possible
        const categoriesTags: string[] = prod.categories_tags || [];
        const nameLower = (productName + ' ' + (prod.brands || '')).toLowerCase();
        
        if (nameLower.includes('mie') || nameLower.includes('noodle') || nameLower.includes('indomie')) {
          setCategory('Mie Instan');
        } else if (nameLower.includes('minum') || nameLower.includes('tea') || nameLower.includes('kopi') || nameLower.includes('milk') || nameLower.includes('susu') || nameLower.includes('water')) {
          setCategory('Minuman');
        } else if (nameLower.includes('bumbu') || nameLower.includes('kecap') || nameLower.includes('saus') || nameLower.includes('masako') || nameLower.includes('royco')) {
          setCategory('Bumbu');
        } else if (nameLower.includes('snack') || nameLower.includes('keripik') || nameLower.includes('biskuit') || nameLower.includes('wafer')) {
          setCategory('Snack');
        } else if (nameLower.includes('sabun') || nameLower.includes('detergen') || nameLower.includes('rinso') || nameLower.includes('shampoo')) {
          setCategory('Kebutuhan Rumah');
        } else if (nameLower.includes('telur') || nameLower.includes('egg')) {
          setCategory('Telur');
        } else if (nameLower.includes('beras') || nameLower.includes('minyak') || nameLower.includes('gula') || nameLower.includes('terigu')) {
          setCategory('Sembako');
        }

        setApiLookupStatus('found');
        setApiMessage(`Produk terdeteksi: ${productName || 'Data berhasil diambil'}`);
      } else {
        // Status 0: Product Not Found
        setApiLookupStatus('not_found');
        setApiMessage('Produk tidak ditemukan di database online. Silakan isi Nama Produk & Foto secara manual.');
      }
    } catch (err) {
      console.warn('Open Food Facts API lookup failed:', err);
      setApiLookupStatus('error');
      setApiMessage('Gagal menghubungi Open Food Facts. Silakan isi Nama Produk & Foto secara manual.');
    } finally {
      setIsSearchingApi(false);
    }
  };

  const handleBarcodeDetected = (code: string) => {
    setBarcode(code);
    fetchOpenFoodFacts(code);
  };

  // Price handler with IDR formatting
  const handlePriceChange = (valStr: string) => {
    const numeric = valStr.replace(/[^0-9]/g, '');
    if (!numeric) {
      setPrice('');
      setPriceFormatted('');
      return;
    }
    const val = parseInt(numeric, 10);
    setPrice(val);
    setPriceFormatted(new Intl.NumberFormat('id-ID').format(val));
  };

  // Handle local image file upload
  const handleImageFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showAlert('Ukuran Gambar', 'Ukuran foto maksimal 2MB agar penyimpanan tetap efisien.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Reset form to scan next item
  const resetForm = () => {
    setBarcode('');
    setName('');
    setPrice('');
    setPriceFormatted('');
    setCategory('Sembako');
    setUnit('pcs');
    setImage('');
    setInStock(true);
    setFeatured(false);
    setApiLookupStatus('idle');
    setApiMessage(null);
  };

  // Save product to Firestore /products/{productId}
  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showAlert('Perhatian', 'Nama Produk wajib diisi!');
      return;
    }
    if (!price || Number(price) <= 0) {
      showAlert('Perhatian', 'Harga Produk wajib diisi dengan angka yang valid!');
      return;
    }

    setIsSubmitting(true);
    const newProductId = 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);

    const productPayload: Product = {
      id: newProductId,
      name: name.trim(),
      price: Math.round(Number(price)),
      unit: unit.trim() || 'pcs',
      category,
      image: image.trim() || 'https://images.tokopedia.net/img/cache/700/VqbcmP/2022/4/11/6f2a6f2a-6f2a-6f2a-6f2a-6f2a6f2a6f2a.jpg',
      inStock,
      ...(barcode.trim() ? { barcode: barcode.trim() } : {}),
      ...(featured ? { featured: true } : {})
    };

    try {
      const docRef = doc(db, 'products', newProductId);
      await setDoc(docRef, productPayload);
      
      triggerHaptic();
      setSaveSuccessNotification(`"${productPayload.name}" berhasil disimpan ke etalase toko!`);
      setTimeout(() => setSaveSuccessNotification(null), 5000);

      if (onSuccess) {
        onSuccess(productPayload);
      }

      // Reset form so user is ready for next product
      resetForm();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `products/${newProductId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-500 via-brand-600 to-orange-600 rounded-3xl p-6 text-white shadow-xl shadow-brand-500/15 relative overflow-hidden">
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-extrabold uppercase tracking-wider mb-2 text-white">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Barcode Scanner</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Tambah Produk Baru
            </h2>
            <p className="text-xs text-brand-100 mt-1 max-w-md font-medium">
              Scan barcode kemasan untuk auto-fill nama & foto dari Open Food Facts, lalu lengkapi harga dan simpan langsung ke Firestore.
            </p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Kembali"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessNotification && (
        <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-900 px-5 py-4 rounded-2xl flex items-center gap-3 shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Check className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-black text-sm">Produk Berhasil Ditambahkan! 🚀</h4>
            <p className="text-xs text-emerald-700 mt-0.5">{saveSuccessNotification}</p>
          </div>
          <button
            onClick={() => setSaveSuccessNotification(null)}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 uppercase tracking-wider"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Barcode Scanner Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">
                1. Scan Barcode Kemasan
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Pindai barcode pada kemasan produk dengan kamera HP
              </p>
            </div>
          </div>

          {!isScanning ? (
            <button
              type="button"
              onClick={startScanner}
              className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Barcode</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopScanner}
              className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Tutup Kamera</span>
            </button>
          )}
        </div>

        {/* Live Camera Scanner Viewport */}
        {isScanning && (
          <div className="border-2 border-brand-500 rounded-2xl overflow-hidden bg-black relative p-2 shadow-inner">
            <div id={scannerContainerId} className="w-full min-h-[260px] rounded-xl overflow-hidden" />
            <div className="text-center py-2 text-white text-[11px] font-bold tracking-wide flex items-center justify-center gap-2 bg-black/60 rounded-b-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Arahkan kamera ke garis barcode produk
            </div>
          </div>
        )}

        {/* Barcode Input & Lookup Bar */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Nomor Barcode (misal: 8998866200234)"
              className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-slate-800 transition-all outline-none"
            />
            {barcode && (
              <button
                type="button"
                onClick={() => setBarcode('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={!barcode || isSearchingApi}
            onClick={() => fetchOpenFoodFacts(barcode)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isSearchingApi ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Mencari...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Cari Online</span>
              </>
            )}
          </button>
        </div>

        {/* Lookup Feedback Badge */}
        {apiLookupStatus === 'found' && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">Produk Ditemukan di Open Food Facts! ✨</span>
              <p className="text-[11px] text-emerald-700">{apiMessage}</p>
            </div>
          </div>
        )}

        {apiLookupStatus === 'not_found' && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">Produk Tidak Ditemukan Online</span>
              <p className="text-[11px] text-amber-700">{apiMessage}</p>
            </div>
          </div>
        )}

        {apiLookupStatus === 'error' && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-900 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">Pencarian Online Gagal</span>
              <p className="text-[11px] text-rose-700">{apiMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Form Fields */}
      <form onSubmit={handleSaveProduct} className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">
            2. Lengkapi Rincian Produk
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            Informasi nama, harga jual warung, kategori, dan foto produk
          </p>
        </div>

        {/* Product Name */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider flex items-center justify-between">
            <span>Nama Produk <span className="text-rose-500">*</span></span>
            {apiLookupStatus === 'found' && (
              <span className="text-[10px] text-emerald-600 font-bold lowercase">auto-filled dari barcode</span>
            )}
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Indomie Goreng Spesial 85g"
            className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 transition-all outline-none"
          />
        </div>

        {/* Price & Unit Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Price (Rp) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider">
              Harga Jual Warung (Rp) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">
                Rp
              </span>
              <input
                type="text"
                required
                inputMode="numeric"
                value={priceFormatted}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="Contoh: 3.500"
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 rounded-xl pl-10 pr-4 py-3 text-xs font-extrabold text-slate-900 transition-all outline-none"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto py-1 no-scrollbar">
              {[3000, 3500, 5000, 10000, 15000, 20000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setPrice(preset);
                    setPriceFormatted(new Intl.NumberFormat('id-ID').format(preset));
                  }}
                  className="px-2 py-1 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-600 rounded-lg text-[10px] font-bold shrink-0 transition-colors"
                >
                  +{new Intl.NumberFormat('id-ID').format(preset)}
                </button>
              ))}
            </div>
          </div>

          {/* Unit Satuan */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider">
              Satuan / Ukuran
            </label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Contoh: pcs, kg, 5kg, pack, renteng"
              className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 transition-all outline-none"
            />
            <div className="flex gap-1.5 overflow-x-auto py-1 no-scrollbar">
              {['pcs', 'kg', '5kg', 'pack', 'renteng', 'botol', 'sachet'].map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-colors ${
                    unit === u ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category & Stock Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider">
              Kategori Produk
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 transition-all outline-none cursor-pointer"
            >
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Stock & Featured Switches */}
          <div className="space-y-2 pt-1">
            <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider block">
              Status Ketersediaan
            </label>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2.5 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                  className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800">
                  {inStock ? '🟢 Ada Stok' : '🔴 Stok Habis'}
                </span>
              </label>

              <label className="inline-flex items-center gap-2.5 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-amber-700">
                  ⭐ Unggulan
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Photo Upload & Preview */}
        <div className="space-y-2 pt-1">
          <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider flex items-center justify-between">
            <span>Foto Produk</span>
            <span className="text-[10px] text-slate-400 font-normal">URL atau Upload File Foto</span>
          </label>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Image Preview Box */}
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden relative group">
              {image ? (
                <>
                  <img
                    src={image}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={() => {
                      // fallback if broken link
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-rose-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <div className="text-center p-2 text-slate-400">
                  <ImageIcon className="w-6 h-6 mx-auto mb-1" />
                  <span className="text-[9px] font-bold">Tanpa Foto</span>
                </div>
              )}
            </div>

            {/* Upload & URL Controls */}
            <div className="flex-1 w-full space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://... (URL Foto Produk)"
                  className="flex-1 bg-slate-50 border border-slate-300 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 transition-all outline-none"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  title="Upload Foto dari HP"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pilih Foto</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Jika barcode ditemukan di Open Food Facts, foto terisi otomatis. Anda juga dapat mengambil foto dari kamera HP atau menempel link gambar.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={resetForm}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Form</span>
          </button>

          <div className="flex w-full sm:w-auto gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-1/2 sm:w-auto px-5 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !name || !price}
              className="flex-1 sm:flex-none px-6 py-3 bg-brand-500 hover:bg-brand-600 active:scale-95 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Firestore...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Produk 💾</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
