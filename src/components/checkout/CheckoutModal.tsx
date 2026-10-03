import React, { useState, useMemo } from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  User, 
  FileText, 
  Truck, 
  Store, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  Loader2,
  Navigation,
  Clock
} from 'lucide-react';
import { CartItem, DeliveryMethod, Order, StoreSettings } from '../../types';
import { formatRupiah } from '../../lib/formatters';
import { createOrder, CreateOrderInput } from '../../services/orders.service';
import { createWhatsAppUrl, sanitizePhoneNumber } from '../../lib/whatsapp';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  settings: StoreSettings;
  onOrderSuccess: (order: Order) => void;
  onOpenTracking?: (secretToken: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  settings,
  onOrderSuccess,
  onOpenTracking,
}) => {
  // Form input state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');
  const [address, setAddress] = useState('');
  const [benchmark, setBenchmark] = useState('');
  const [notes, setNotes] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Perhitungan ongkir & total berdasarkan aturan settings
  const deliveryFee = useMemo(() => {
    if (deliveryMethod === 'pickup') return 0;
    return typeof settings.deliveryFeeDefault === 'number' ? settings.deliveryFeeDefault : 3000;
  }, [deliveryMethod, settings.deliveryFeeDefault]);

  const total = useMemo(() => {
    return subtotal + deliveryFee;
  }, [subtotal, deliveryFee]);

  if (!isOpen) return null;

  // Handler Submit Pesanan
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Proteksi double submit
    if (isSubmitting) return;

    // 1. Validasi keranjang
    if (!items || items.length === 0) {
      setErrorMessage('Keranjang belanja Anda kosong. Silakan pilih produk terlebih dahulu.');
      return;
    }

    // 2. Validasi nama
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Mohon isi nama lengkap atau panggilan Anda.');
      return;
    }

    // 3. Validasi nomor telepon / WhatsApp
    const cleanedPhone = phone.replace(/\D/g, '');
    if (!cleanedPhone || cleanedPhone.length < 8) {
      setErrorMessage('Mohon masukkan nomor WhatsApp yang aktif dan valid (minimal 8 digit).');
      return;
    }

    // 4. Validasi alamat jika metode Antar dipilih
    const trimmedAddress = address.trim();
    if (deliveryMethod === 'delivery' && !trimmedAddress) {
      setErrorMessage('Mohon isi alamat lengkap pengantaran (nama jalan, nomor rumah, atau RT/RW).');
      return;
    }

    // 5. Eksekusi submit dengan double-submit protection
    setIsSubmitting(true);

    try {
      const orderPayload: CreateOrderInput = {
        name: trimmedName,
        phone: cleanedPhone,
        deliveryMethod,
        address: trimmedAddress,
        benchmark: benchmark.trim(),
        notes: notes.trim(),
        items,
        subtotal,
        deliveryFee,
        total,
      };

      // Simpan ke Firestore
      const createdOrder = await createOrder(orderPayload);

      // Simpan status sukses di local state
      setCompletedOrder(createdOrder);

      // Callback notifikasi ke parent untuk reset keranjang (hanya jika Firestore sukses)
      onOrderSuccess(createdOrder);

      // Buka link WhatsApp pemilik toko secara otomatis
      try {
        const ownerPhone = settings.contacts?.OWNER || '85298585059';
        const waUrl = createWhatsAppUrl(ownerPhone, createdOrder);
        window.open(waUrl, '_blank');
      } catch (waError) {
        console.warn('Gagal membuka jendela WhatsApp secara otomatis:', waError);
      }

    } catch (err: any) {
      console.error('Gagal membuat pesanan:', err);
      setErrorMessage(
        err?.message || 'Terjadi gangguan saat memproses pesanan. Pastikan koneksi internet Anda aktif dan coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Tutup Modal
  const handleModalClose = () => {
    if (isSubmitting) return; // Jangan tutup jika sedang submitting
    setCompletedOrder(null);
    setErrorMessage(null);
    onClose();
  };

  // URL WhatsApp untuk order yang sudah dibuat (Success view)
  const successWaUrl = completedOrder
    ? createWhatsAppUrl(settings.contacts?.OWNER || '85298585059', completedOrder)
    : '#';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        onClick={handleModalClose}
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-2xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-6 text-center">
        <div 
          role="dialog"
          aria-modal="true"
          className="w-full max-w-lg bg-white rounded-3xl shadow-2xl text-left overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        >
          {/* TAMPILAN JIKA PESANAN BERHASIL (SUCCESS STATE) */}
          {completedOrder ? (
            <div className="p-6 sm:p-8 space-y-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-2xl font-black text-stone-900 font-serif">
                  Pesanan Berhasil Dibuat!
                </h3>
                <p className="text-xs sm:text-sm text-stone-500">
                  Terima kasih, <strong>{completedOrder.name}</strong>. Pesanan Anda telah tersimpan di sistem Warung Amma Ika.
                </p>
              </div>

              <div className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2 text-left text-xs">
                <div className="flex justify-between items-center border-b border-stone-200/70 pb-2">
                  <span className="text-stone-500 font-medium">Nomor Pesanan</span>
                  <span className="font-mono font-bold text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200">
                    #{completedOrder.id}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-stone-200/70 pb-2">
                  <span className="text-stone-500 font-medium">Metode Layanan</span>
                  <span className="font-bold text-stone-800">
                    {completedOrder.deliveryMethod === 'delivery' ? '🚚 Antar ke Rumah' : '🏪 Ambil di Toko'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-stone-700 font-bold">Total Pembayaran</span>
                  <span className="text-sm font-black text-amber-900">
                    {formatRupiah(completedOrder.total)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-2xs text-amber-900 text-left space-y-1 w-full">
                <p className="font-bold flex items-center gap-1.5">
                  <span>📱</span> Konfirmasi WhatsApp ke Penjual
                </p>
                <p className="text-stone-600">
                  Jika aplikasi WhatsApp tidak otomatis terbuka, silakan ketuk tombol hijau di bawah ini untuk mengirim pesan pesanan langsung ke Amma Ika.
                </p>
              </div>

              <div className="w-full space-y-2 pt-2">
                {/* Tombol Lihat Status Pesanan Realtime */}
                <button
                  type="button"
                  onClick={() => {
                    const token = completedOrder.secretToken || localStorage.getItem('last_active_order_id');
                    if (onOpenTracking && token) {
                      onOpenTracking(token);
                    }
                    handleModalClose();
                  }}
                  className="w-full py-3.5 px-4 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-900/15 active:scale-98 transition-all cursor-pointer"
                >
                  <Clock className="w-4 h-4" />
                  <span>Lihat Status Pesanan (Realtime)</span>
                </button>

                <a
                  href={successWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka / Kirim Ulang WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={handleModalClose}
                  className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  Kembali ke Katalog
                </button>
              </div>
            </div>
          ) : (
            /* FORM CHECKOUT */
            <>
              {/* Header Modal */}
              <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between shrink-0 bg-stone-50/50">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-stone-900 font-serif">
                    Checkout Pesanan
                  </h2>
                  <p className="text-2xs sm:text-xs text-stone-500">
                    Lengkapi data pengiriman untuk menyelesaikan pesanan Anda
                  </p>
                </div>
                <button
                  onClick={handleModalClose}
                  disabled={isSubmitting}
                  aria-label="Tutup Checkout"
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleSubmitOrder} className="flex flex-col flex-1 overflow-y-auto">
                <div className="p-4 sm:p-6 space-y-5">
                  {/* Alert Error Banner */}
                  {errorMessage && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-900 text-xs animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1 font-medium">{errorMessage}</div>
                    </div>
                  )}

                  {/* 1. Metode Pemenuhan Pesanan */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                      Pilih Metode Pengambilan <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('delivery')}
                        className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                          deliveryMethod === 'delivery'
                            ? 'border-amber-700 bg-amber-50/60 ring-2 ring-amber-700/20 text-stone-900'
                            : 'border-stone-200 hover:border-stone-300 bg-white text-stone-600'
                        }`}
                      >
                        <div className={`p-2 rounded-xl shrink-0 ${deliveryMethod === 'delivery' ? 'bg-amber-700 text-white' : 'bg-stone-100 text-stone-600'}`}>
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold">Antar ke Rumah</p>
                          <p className="text-2xs text-stone-500 mt-0.5">
                            Ongkir {deliveryFee > 0 ? formatRupiah(deliveryFee) : 'Gratis'}
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('pickup')}
                        className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                          deliveryMethod === 'pickup'
                            ? 'border-amber-700 bg-amber-50/60 ring-2 ring-amber-700/20 text-stone-900'
                            : 'border-stone-200 hover:border-stone-300 bg-white text-stone-600'
                        }`}
                      >
                        <div className={`p-2 rounded-xl shrink-0 ${deliveryMethod === 'pickup' ? 'bg-amber-700 text-white' : 'bg-stone-100 text-stone-600'}`}>
                          <Store className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold">Ambil Sendiri</p>
                          <p className="text-2xs text-stone-500 mt-0.5">Tanpa Ongkir (Rp0)</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* 2. Informasi Kontak Pelanggan */}
                  <div className="space-y-3.5">
                    <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                      Data Pemesan
                    </h3>

                    {/* Nama */}
                    <div className="space-y-1">
                      <label className="text-2xs font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-stone-400" />
                        <span>Nama Lengkap / Panggilan <span className="text-rose-500">*</span></span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Ibu Rina / Pak Haji Usman"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition-all placeholder:text-stone-400"
                      />
                    </div>

                    {/* WhatsApp */}
                    <div className="space-y-1">
                      <label className="text-2xs font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        <span>Nomor WhatsApp Aktif <span className="text-rose-500">*</span></span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Contoh: 081234567890"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition-all placeholder:text-stone-400"
                      />
                      <p className="text-3xs text-stone-400 pl-0.5">
                        Digunakan oleh Amma Ika untuk konfirmasi dan update pesanan.
                      </p>
                    </div>

                    {/* Alamat (Jika Antar ke Rumah) */}
                    {deliveryMethod === 'delivery' && (
                      <div className="space-y-3 p-3.5 bg-amber-50/40 border border-amber-200/60 rounded-2xl animate-in fade-in">
                        <div className="space-y-1">
                          <label className="text-2xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-amber-700" />
                            <span>Alamat Lengkap Pengantaran <span className="text-rose-500">*</span></span>
                          </label>
                          <textarea
                            required
                            rows={2}
                            placeholder="Nama jalan, lorong, nomor rumah, atau RT/RW di sekitar Lero..."
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition-all placeholder:text-stone-400 resize-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-2xs font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
                            <Navigation className="w-3.5 h-3.5 text-stone-400" />
                            <span>Patokan Lokasi (Opsional)</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: Depan pos ronda, pagar hijau, dekat masjid..."
                            value={benchmark}
                            onChange={(e) => setBenchmark(e.target.value)}
                            className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition-all placeholder:text-stone-400"
                          />
                        </div>
                      </div>
                    )}

                    {/* Catatan Tambahan */}
                    <div className="space-y-1">
                      <label className="text-2xs font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-stone-400" />
                        <span>Catatan Pesanan (Opsional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Titip di teras jika tidak ada orang, telur minta dipilihkan yang besar..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition-all placeholder:text-stone-400"
                      />
                    </div>
                  </div>

                  {/* 3. Ringkasan Belanja */}
                  <div className="space-y-2.5 border-t border-stone-200 pt-4">
                    <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                      Ringkasan Belanja ({items.reduce((acc, i) => acc + i.quantity, 0)} barang)
                    </h3>

                    <div className="max-h-36 overflow-y-auto space-y-2 pr-1 text-xs">
                      {items.map(({ product, quantity }) => (
                        <div key={product.id} className="flex justify-between items-center text-stone-700 py-1 border-b border-stone-100">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-bold text-stone-900 shrink-0">
                              {quantity}x
                            </span>
                            <span className="truncate">
                              {product.name}
                            </span>
                            <span className="text-2xs text-stone-400 shrink-0">
                              ({product.unit})
                            </span>
                          </div>
                          <span className="font-semibold text-stone-900 shrink-0 ml-2">
                            {formatRupiah(product.price * quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Kalkulasi Biaya */}
                    <div className="bg-stone-50 rounded-2xl p-3.5 space-y-1.5 border border-stone-200/70 text-xs">
                      <div className="flex justify-between text-stone-600">
                        <span>Subtotal Belanja</span>
                        <span className="font-bold text-stone-900">{formatRupiah(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>Biaya Pengantaran</span>
                        <span className="font-bold text-stone-900">
                          {deliveryFee > 0 ? formatRupiah(deliveryFee) : 'Gratis'}
                        </span>
                      </div>
                      <div className="border-t border-stone-200 pt-1.5 flex justify-between items-center">
                        <span className="font-bold text-stone-900">Total Pembayaran</span>
                        <span className="text-base font-black text-amber-900">{formatRupiah(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action Submit */}
                <div className="p-4 sm:p-5 border-t border-stone-200 bg-white shrink-0">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 bg-amber-700 hover:bg-amber-800 disabled:bg-stone-300 disabled:text-stone-500 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-900/10 active:scale-98 transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan Pesanan...</span>
                      </>
                    ) : (
                      <span>Kirim Pesanan Sekarang ({formatRupiah(total)})</span>
                    )}
                  </button>
                  <p className="text-3xs text-center text-stone-400 mt-2">
                    Pesanan akan otomatis diteruskan ke WhatsApp Warung Amma Ika
                  </p>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
