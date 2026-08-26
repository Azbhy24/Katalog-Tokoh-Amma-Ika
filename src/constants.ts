/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  barcode?: string;
  name: string;
  price: number;
  unit: string;
  category: string;
  image: string;
  inStock: boolean;
  featured?: boolean;
}

export const PRODUCT_CATEGORIES = [
  'Sembako',
  'Mie Instan',
  'Minuman',
  'Bumbu',
  'Snack',
  'Kebutuhan Rumah',
  'Telur',
  'Unggulan',
  'Makanan Matang',
  'Cemilan & Dessert'
];

export interface Bundle {
  id: string;
  name: string;
  description: string;
  price: number;
  items: string[];
  image: string;
}

export const CONTACTS = {
  OWNER: '85298585059', // Nomor WA Amma Ika (Hong Kong number provided by user)
  DULLAH: '6283110910332', // Nomor WA Dullah
  LEMAN: '6287817250225', // Nomor WA Leman
};

export const PRODUCTS: Product[] = [
  // Sembako Utama
  { id: '1', name: 'Beras Premium 5kg', price: 72000, unit: '5kg', category: 'Sembako', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAafuZuwrnucDVX_MiebVo1oEYyvyMYOTTKWLPy-PwzyeeTi_DiWtSFh6DGSuCpZvseYOkDsVm4rNDd-NFE3XslpQ1b-8ILhTqTZAuWnYRVkBgBwgIBb7L3GN8Bc2p2L2HgUSYgP4nLFqoKns_98ZPUf4r7lnqlFki6wdkc46SvhlgegCeERYsH7WZpi-dP2TSKNfn5bO69tTkPHznngT7wWoPs9jwDi8L5Dfm5rq3QU9NiD6LLhraM', inStock: true },
  { id: '2', name: 'Minyak Goreng 2L', price: 28500, unit: '2L', category: 'Sembako', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVRqQYbP0P7wgXwBdGiV25cmNt59lTwI6revoTcWEb2ZzvJKhAaiGN3iKeyWzc6vmtfpXZ0XUAv6FHQCpzn2FCv8RWTfdkcYXj89Zs8FCP_GIUAAu0rfSV98lFS9W_dm0FkiQBLHelPKuC7yCCvolury4o6ujYrqWpNiPqQyvoDzQHTxuFzg8f2mgHPbIJsvfbvsCEwQ-bnbeDy2gOp0ZTWXyKoAyyD-QwK7pixOabuwjEJaA-t-yO', inStock: true },
  { id: '3', name: 'Telur Ayam (1 Rak)', price: 55000, unit: '1 Rak (30 butir)', category: 'Telur', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbhdlCbCuoBe_jNimXxClAwLXKSFmm-j9B3nSj2AvZwgR-A9_03ruFe-xhemYud1Ild760lFLoqhkDNKZ-lb0RM0FAQhY7IWBQniZI0_gyaV9_lpecPGzoUU1NX3BLeyh_LnWbQO6cJ25ZGsj_AEw2vtgo48PDweZxp87soUwX2-guYxsP_jGRO6-ATVvwOQT_iJDFWZl5t1f7z-0-sMxgXmPpykATnaP_dJtM6fXcq9rRjr0pHWoF', inStock: true },
  { id: '4', name: 'Indomie Goreng (5 pcs)', price: 15000, unit: '5 bungkus', category: 'Mie Instan', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvG9cFWmTFbTN2SJIE3Aya4gVdfMpZtWkZ_Jy4jc5x1AbaAXoCeXzbN6AaVSZ-e1usNXuPzusRq3nl6dIo4C5FT49dIa2KAD90F5fvfE1E-uqTX9x4moNO8mHWnJjJ571aofu-greoVrcRsBtW0HJNEk9WGueCdkRXR_Kzo0iMfLu6G4N3jqeMD1CNBGpXVvwb9t5SSBME-E7RPXTcPWJtyWtvRvbziAvEnpA4Bu4HzxKmzjwEHWy2', inStock: true },
  { id: '5', name: 'Gula Pasir 1kg', price: 16500, unit: '1kg', category: 'Sembako', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAS3Bk5hErzFPQZFExuOexFwPu0Fc-ERtiSWqmsyaIsvtpjh503Jcxtta_TCfkJkuPN90fDbBsThaFJ2KslhucKXLEtIRagx_9J9e-Y7mtT4ax6TgFkUlEIYnPagAA6lXAiVQXGZwAhhkOaBpZ2lHQQVJmtPntBP-XFeLaAIuMNEjqGSm4iS0rvlgO58cUfe1Kcq9V69yYv0RdGl6qIaxIFJF5wp66hBl4klAxGQrZoX32Zx8CT9OR-', inStock: true },
  { id: '6', name: 'Kopi Kapal Api', price: 12000, unit: '165g', category: 'Minuman', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6KFOQaVyyTUjPxtutScznF5p8wVGYv0He0fbANyXSFecTSzX1tjeOyLy5hrmLDbdbr52s0qxv5uW4bXbJPgUiCrnZYosnoJ-U7VrqiVvyuuqDRQRvTSUQoOejSTsdVBsvOkRuC0bGtEPR9X5_BTRJjGPApfQ1FGmc-Bp02xLsxkb6_Ep9On98zkwD16YAk1K-EjmCwv9oZIfAkvjQIRDaFuH-f8VtShK37HqbxiVY8mT7hY3YBwgu', inStock: true },

  // Unggulan
  { id: '12', name: 'Kerupuk Bakwan Ter-Enak Lero', price: 10000, unit: '5 pcs / pack', category: 'Unggulan', image: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Bakwan_sayur_fritters.JPG', inStock: true },

  // Makanan Matang Khas Amma Ika
  { id: 'm1', name: 'Mie Goreng Lero Pedas Spesial', price: 15000, unit: 'Level Pedas 0-8 • Pangsit Garing', category: 'Makanan Matang', image: 'https://images.tokopedia.net/img/cache/700/VqbcmP/2021/6/15/d5a80e1a-1d5d-4f1b-839e-26a6358c2b53.jpg', inStock: true },
  { id: 'm2', name: 'Nasi Goreng Kampung Amma Ika', price: 14000, unit: 'Level Pedas 0-8 • Telur & Lalapan', category: 'Makanan Matang', image: 'https://img-global.cpcdn.com/recipes/796ab9e79dcc4150/680x482cq70/mie-gacoan-resep-foto-utama.jpg', inStock: true },
  { id: 'm3', name: 'Bakwan Sayur Hangat Lero (5 pcs)', price: 10000, unit: 'Disajikan Hangat + Cabe Rawit', category: 'Makanan Matang', image: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Bakwan_sayur_fritters.JPG', inStock: true },

  // Cemilan & Dessert Sulawesi
  { id: 'd1', name: 'Es Pisang Ijo Khas Sulawesi', price: 12000, unit: 'Sirup merah • Susu • Bubur sumsum', category: 'Cemilan & Dessert', image: 'https://img-global.cpcdn.com/recipes/cc4338e555818981/680x482cq70/es-teklek-resep-foto-utama.jpg', inStock: true },
  { id: 'd2', name: 'Es Kelapa Muda Selasih', price: 8000, unit: 'Air Kelapa Asli • Selasih • Es Batu', category: 'Cemilan & Dessert', image: 'https://images.tokopedia.net/img/cache/700/VqbcmP/2022/10/22/021356f1-be80-49b8-bbb6-a67ee654ff79.jpg', inStock: true },
  { id: 'd3', name: 'Kopi Susu Gula Aren Lero', price: 10000, unit: 'Kopi Blend Premium • Susu Segar', category: 'Cemilan & Dessert', image: 'https://images.tokopedia.net/img/cache/700/VqbcmP/2022/2/15/6f2a6f2a-6f2a-6f2a-6f2a-6f2a6f2a6f2a.jpg', inStock: true },

  // Bumbu
  { id: '9', name: 'Kecap Manis ABC', price: 12000, unit: '225ml', category: 'Bumbu', image: 'https://images.tokopedia.net/img/cache/700/VqbcmP/2022/2/18/8f395f8a-c71b-4171-8868-b78997a3a60a.jpg', inStock: true },
  { id: '10', name: 'Sajiku Nasi Goreng', price: 3000, unit: 'pcs', category: 'Bumbu', image: 'https://images.tokopedia.net/img/cache/700/VqbcmP/2022/1/12/5c4e9541-118d-4e94-9844-34743285e665.jpg', inStock: true },
  
  // Kebersihan / Kebutuhan Rumah
  { id: '8', name: 'Mama Lemon Jeruk Nipis', price: 14000, unit: '780ml', category: 'Kebutuhan Rumah', image: 'https://images.tokopedia.net/img/cache/700/VqbcmP/2022/9/30/8f3b255e-335b-417d-810e-9f33b355b253.jpg', inStock: true },
  { id: '11', name: 'Rinso Bubuk Anti Noda', price: 18000, unit: '450g', category: 'Kebutuhan Rumah', image: 'https://images.tokopedia.net/img/cache/700/VqbcmP/2021/3/25/36c8b931-e374-4537-8b01-57d427d14217.jpg', inStock: true },
  
  // Minuman
  { id: '5b', name: 'Ultra Milk Full Cream', price: 19500, unit: '1L', category: 'Minuman', image: 'https://images.tokopedia.net/img/cache/700/product-1/2020/5/12/3238612/3238612_43e0d86a-723a-4f51-b062-8197e7041f92_700_700.jpg', inStock: true }
];

export const BUNDLES: Bundle[] = [
  {
    id: 'b1',
    name: 'Dapur Sejahtera Seminggu',
    description: 'Solusi lengkap kebutuhan masak harian keluarga.',
    price: 165000,
    items: ['Beras 5kg', 'Minyak 2L', 'Telur 1kg', 'Gula 1kg'],
    image: 'https://images.tokopedia.net/img/cache/700/VqbcmP/2022/4/11/6f2a6f2a-6f2a-6f2a-6f2a-6f2a6f2a6f2a.jpg'
  },
  {
    id: 'b2',
    name: 'Hemat Akhir Bulan',
    description: 'Tetap bergizi dengan harga yang sangat bersahabat.',
    price: 52000,
    items: ['Mie 5pcs', 'Kopi 1 pack', 'Susu 1L'],
    image: 'https://images.tokopedia.net/img/cache/700/VqbcmP/2021/6/28/6f2a6f2a-6f2a-6f2a-6f2a-6f2a6f2a6f2a.jpg'
  },
  {
    id: 'b3',
    name: 'Stok Bulanan Premium',
    description: 'Kebutuhan pokok terpenuhi untuk satu bulan penuh.',
    price: 485000,
    items: ['Beras 20kg', 'Minyak 5L', 'Gula 3kg', 'Sabun Lengkap'],
    image: 'https://images.tokopedia.net/img/cache/700/VqbcmP/2022/2/18/6f2a6f2a-6f2a-6f2a-6f2a-6f2a6f2a6f2a.jpg'
  },
];
