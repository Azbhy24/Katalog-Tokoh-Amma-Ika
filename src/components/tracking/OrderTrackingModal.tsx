import React, { useEffect, useState, useMemo } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  Package, 
  Truck, 
  Store, 
  MapPin, 
  AlertCircle, 
  Phone, 
  FileText, 
  RefreshCw, 
  ExternalLink,
  Ban,
  Check
} from 'lucide-react';
import { Order, OrderStatus, StoreSettings } from '../../types';
import { formatRupiah } from '../../lib/formatters';
import { subscribeToOrder } from '../../services/orders.service';
import { sanitizePhoneNumber } from '../../lib/whatsapp';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  secretToken: string | null;
  settings: StoreSettings;
}

// Tahapan lifecycle progress tracking
interface StepInfo {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TRACKING_STEPS: StepInfo[] = [
  {
    key: 'pending',
    label: 'Pesanan Dibuat',
    description: 'Menunggu konfirmasi penerimaan oleh Amma Ika',
    icon: Clock,
  },
  {
    key: 'confirmed',
    label: 'Dikonfirmasi',
    description: 'Pesanan telah diterima dan dicek ketersediaannya',
    icon: CheckCircle2,
  },
  {
    key: 'preparing',
    label: 'Sedang Dikemas',
    description: 'Sembako dan barang belanjaan sedang disiapkan',
    icon: Package,
  },
  {
    key: 'ready_for_delivery',
    label: 'Siap Diantar / Ambil',
    description: 'Barang sudah rapi dan siap dikirim atau diambil',
    icon: Store,
  },
  {
    key: 'on_delivery',
    label: 'Dalam Perjalanan',
    description: 'Kurir sedang menuju ke alamat pengantaran Anda',
    icon: Truck,
  },
  {
    key: 'delivered',
    label: 'Selesai',
    description: 'Pesanan telah diterima dengan baik. Terima kasih!',
    icon: Check,
  },
];

// Helper pemetaan index tahapan
function getStepIndex(status?: OrderStatus): number {
  switch (status) {
    case 'pending':
      return 0;
    case 'confirmed':
      return 1;
    case 'preparing':
      return 2;
    case 'ready_for_delivery':
      return 3;
    case 'on_delivery':
    case 'delivering':
      return 4;
    case 'delivered':
    case 'completed':
      return 5;
    case 'cancelled':
      return -1;
    default:
      return 0;
  }
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  secretToken,
  settings,
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Berlangganan status realtime menggunakan secretToken
  useEffect(() => {
    if (!isOpen || !secretToken) {
      setOrder(null);
      setLoading(false);
      setErrorMessage(null);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const unsubscribe = subscribeToOrder(
      secretToken,
      (liveOrder) => {
        setLoading(false);
        if (!liveOrder) {
          setErrorMessage('Pesanan tidak ditemukan atau tautan pelacakan tidak valid.');
          setOrder(null);
        } else {
          setOrder(liveOrder);
          setErrorMessage(null);
        }
      },
      (error) => {
        setLoading(false);
        console.error('Tracking listener error:', error);
        setErrorMessage('Gagal memuat status pesanan secara realtime. Silakan periksa koneksi internet Anda.');
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isOpen, secretToken]);

  const currentStepIdx = useMemo(() => getStepIndex(order?.status), [order?.status]);
  const isCancelled = order?.status === 'cancelled';
  const isDelivered = order?.status === 'delivered' || order?.status === 'completed';

  // Link WhatsApp Amma Ika untuk tanya pesanan
  const contactOwnerUrl = useMemo(() => {
    const ownerPhone = settings.contacts?.OWNER || '85298585059';
    const cleanPhone = sanitizePhoneNumber(ownerPhone);
    const orderNum = order?.id || 'pesanan saya';
    const text = `Halo Amma Ika, saya ingin menanyakan status pesanan #${orderNum}.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }, [order?.id, settings.contacts]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-2xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-6 text-center">
        <div 
          role="dialog"
          aria-modal="true"
          className="w-full max-w-lg bg-white rounded-3xl shadow-2xl text-left overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        >
          {/* Header Pelacakan */}
          <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between shrink-0 bg-stone-50/70">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-sm sm:text-base font-black text-stone-900 font-serif">
                  Pelacakan Pesanan Realtime
                </h2>
              </div>
              <p className="text-2xs sm:text-xs text-stone-500 font-medium">
                {order?.id ? `No. Pesanan: #${order.id}` : 'Memuat status pesanan...'}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Tutup Pelacakan"
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Konten Scrollable */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            {/* Loading State */}
            {loading && (
              <div className="py-16 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-stone-500 font-medium">
                  Menghubungkan ke sistem pemantauan Warung Amma Ika...
                </p>
              </div>
            )}

            {/* Error / Not Found State */}
            {!loading && errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 text-center">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-rose-900 text-sm">Pesanan Tidak Ditemukan</h3>
                  <p className="text-rose-700 text-2xs leading-relaxed max-w-sm mx-auto">
                    {errorMessage}
                  </p>
                </div>
                <div className="pt-2">
                  <a
                    href={contactOwnerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
                  >
                    <span>Hubungi Amma Ika di WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Data Order Tersedia */}
            {!loading && order && (
              <>
                {/* Banner Status Dibatalkan */}
                {isCancelled && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-900">
                    <div className="p-2 bg-rose-100 rounded-xl text-rose-600 shrink-0">
                      <Ban className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-sm">Pesanan Dibatalkan</h4>
                      <p className="text-2xs text-rose-700 leading-relaxed">
                        Pesanan ini telah dibatalkan oleh pihak toko atau atas permintaan pembeli. Silakan hubungi Amma Ika jika Anda memiliki pertanyaan.
                      </p>
                    </div>
                  </div>
                )}

                {/* Banner Status Selesai */}
                {isDelivered && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-900">
                    <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-sm">Pesanan Selesai</h4>
                      <p className="text-2xs text-emerald-700 leading-relaxed">
                        Terima kasih telah berbelanja di Warung Amma Ika! Semoga sembako dan kebutuhan rumah Anda bermanfaat.
                      </p>
                    </div>
                  </div>
                )}

                {/* Progress Status Bar (Aktif jika tidak dibatalkan) */}
                {!isCancelled && (
                  <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold text-stone-500 uppercase tracking-wider">
                        Tahapan Pemrosesan
                      </span>
                      <span className="text-2xs font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full">
                        Tahap {currentStepIdx + 1} dari {TRACKING_STEPS.length}
                      </span>
                    </div>

                    {/* Progress Dots & Timeline */}
                    <div className="space-y-3">
                      {TRACKING_STEPS.map((step, idx) => {
                        const isDone = currentStepIdx > idx;
                        const isCurrent = currentStepIdx === idx;
                        const IconComponent = step.icon;

                        return (
                          <div key={step.key} className="flex items-start gap-3 relative">
                            {/* Garis vertikal penghubung */}
                            {idx < TRACKING_STEPS.length - 1 && (
                              <div 
                                className={`absolute left-4 top-8 w-0.5 -bottom-3 transition-colors ${
                                  isDone ? 'bg-emerald-500' : 'bg-stone-200'
                                }`} 
                              />
                            )}

                            {/* Lingkaran Ikon */}
                            <div 
                              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                                isDone 
                                  ? 'bg-emerald-600 text-white shadow-xs' 
                                  : isCurrent 
                                    ? 'bg-amber-600 text-white ring-4 ring-amber-100 shadow-md scale-105' 
                                    : 'bg-stone-200 text-stone-400'
                              }`}
                            >
                              <IconComponent className="w-4 h-4" />
                            </div>

                            {/* Teks Step */}
                            <div className="space-y-0.5 pt-1 flex-1">
                              <div className="flex items-center justify-between">
                                <h5 className={`font-bold ${isCurrent ? 'text-amber-900 font-serif text-xs' : isDone ? 'text-stone-800' : 'text-stone-400'}`}>
                                  {step.label}
                                </h5>
                                {isCurrent && (
                                  <span className="text-3xs font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                    Aktif
                                  </span>
                                )}
                              </div>
                              <p className={`text-2xs ${isCurrent ? 'text-stone-600' : 'text-stone-400'}`}>
                                {step.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Detail Pengiriman & Pembeli */}
                <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 space-y-2.5">
                  <h4 className="text-2xs font-bold text-stone-700 uppercase tracking-wider">
                    Informasi Pengiriman
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-2 text-stone-600 text-2xs">
                    <div>
                      <span className="text-stone-400 block">Nama Pemesan:</span>
                      <strong className="text-stone-800 text-xs">{order.name}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Layanan:</span>
                      <strong className="text-stone-800 text-xs">
                        {order.deliveryMethod === 'delivery' ? '🚚 Antar ke Rumah' : '🏪 Ambil di Toko'}
                      </strong>
                    </div>
                  </div>

                  {order.deliveryMethod === 'delivery' && (
                    <div className="pt-2 border-t border-stone-200/60 text-2xs text-stone-600 space-y-1">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-stone-400 block">Alamat Pengantaran:</span>
                          <p className="font-semibold text-stone-800">{order.address || '-'}</p>
                          {order.benchmark && (
                            <p className="text-stone-500 italic mt-0.5">Patokan: {order.benchmark}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {order.notes && (
                    <div className="pt-2 border-t border-stone-200/60 text-2xs text-stone-600">
                      <span className="text-stone-400 block">Catatan:</span>
                      <p className="italic text-stone-700">{order.notes}</p>
                    </div>
                  )}
                </div>

                {/* Daftar Produk Belanja */}
                <div className="space-y-2 border-t border-stone-200 pt-4">
                  <h4 className="text-2xs font-bold text-stone-700 uppercase tracking-wider">
                    Rincian Barang Belanja ({order.items.length} jenis)
                  </h4>

                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1.5 border-b border-stone-100 text-stone-700">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-8 h-8 rounded-lg object-cover border border-stone-200 shrink-0" 
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center shrink-0 text-stone-400">
                              📦
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-stone-900 truncate text-xs">{item.name}</p>
                            <p className="text-3xs text-stone-400">
                              {item.quantity}x @ {formatRupiah(item.price)} / {item.unit}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-stone-900 shrink-0 ml-2">
                          {formatRupiah(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Ringkasan Biaya */}
                  <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3.5 space-y-1.5">
                    <div className="flex justify-between text-stone-600">
                      <span>Subtotal Belanja</span>
                      <span className="font-bold text-stone-900">{formatRupiah(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>Biaya Pengantaran</span>
                      <span className="font-bold text-stone-900">
                        {order.deliveryFee > 0 ? formatRupiah(order.deliveryFee) : 'Gratis'}
                      </span>
                    </div>
                    <div className="border-t border-stone-200 pt-1.5 flex justify-between items-center">
                      <span className="font-bold text-stone-900">Total Pembayaran</span>
                      <span className="text-sm font-black text-amber-900">
                        {formatRupiah(order.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-4 sm:p-5 border-t border-stone-200 bg-white shrink-0 space-y-2">
            <a
              href={contactOwnerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>Tanya Status ke Amma Ika (WhatsApp)</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              Tutup & Lanjut Belanja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
