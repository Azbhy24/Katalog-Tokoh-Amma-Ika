import { Order } from '../types';
import { formatRupiah } from './formatters';

/**
 * Membersihkan format nomor telepon menjadi standar internasional WhatsApp (62xxx)
 */
export function sanitizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Membentuk teks pesan pesanan terformat untuk dikirimkan ke WhatsApp pemilik/kurir warung
 */
export function generateWhatsAppMessage(order: Order): string {
  const itemsText = order.items
    .map((item, idx) => {
      const lineTotal = item.price * item.quantity;
      return `${idx + 1}. *${item.name}* (${item.unit})\n   ${item.quantity}x @ ${formatRupiah(item.price)} = ${formatRupiah(lineTotal)}`;
    })
    .join('\n\n');

  const deliveryMethodText =
    order.deliveryMethod === 'delivery'
      ? `Antar ke Rumah${order.courierName ? ` (Kurir ${order.courierName})` : ''}`
      : 'Ambil Sendiri di Toko';

  const customerPhone = order.phone || order.customerPhone;
  const address = order.address || order.deliveryAddress;
  const notes = order.notes || order.deliveryNotes;

  return `*WARUNG AMMA IKA — PESANAN BARU*
No. Pesanan: #${order.id}

Halo Amma Ika, saya mau pesan sembako:

${itemsText}

----------------------------------
Subtotal: ${formatRupiah(order.subtotal)}
Metode: ${deliveryMethodText}
Ongkir: ${order.deliveryFee > 0 ? formatRupiah(order.deliveryFee) : 'Gratis'}
*TOTAL: ${formatRupiah(order.total)}*
----------------------------------

*Data Pembeli:*
Nama: ${order.name || order.buyerName || '-'}
${customerPhone ? `No. WhatsApp: ${customerPhone}\n` : ''}${order.deliveryMethod === 'delivery' ? `Alamat: ${address || '-'}\n` : ''}${order.benchmark ? `Patokan: ${order.benchmark}\n` : ''}${notes ? `Catatan: ${notes}\n` : ''}
Terima kasih!`;
}

/**
 * Menghasilkan tautan web/app langsung wa.me
 */
export function createWhatsAppUrl(phone: string, order: Order): string {
  const sanitizedPhone = sanitizePhoneNumber(phone);
  const text = generateWhatsAppMessage(order);
  return `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(text)}`;
}
