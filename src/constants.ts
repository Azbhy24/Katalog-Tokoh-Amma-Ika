/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  category: string;
  image: string;
  inStock: boolean;
}

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
  // Makanan Matang Khas Amma Ika
  { id: 'm1', name: 'Mie Goreng Lero Pedas Spesial', price: 15000, unit: 'Level Pedas 0-8 • Pangsit Garing', category: 'Makanan Matang', image: 'https://images.tokopedia.net/img/cache/700/VqbcmP/2021/6/15/d5a80e1a-1d5d-4f1b-839e-26a6358c2b53.jpg', inStock: true },
  { id: 'm2', name: 'Nasi Goreng Kampung Amma Ika', price: 14000, unit: 'Level Pedas 0-8 • Telur & Lalapan', category: 'Makanan Matang', image: 'https://img-global.cpcdn.com/recipes/796ab9e79dcc4150/680x482cq70/mie-gacoan-resep-foto-utama.jpg', inStock: true },
  { id: 'm3', name: 'Bakwan Sayur Hangat Lero (5 pcs)', price: 10000, unit: 'Disajikan Hangat + Cabe Rawit', category: 'Makanan Matang', image: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Bakwan_sayur_fritters.JPG', inStock: true },

  // Cemilan & Dessert Sulawesi
  { id: 'd1', name: 'Es Pisang Ijo Khas Sulawesi', price: 12000, unit: 'Sirup merah • Susu • Bubur sumsum', category: 'Cemilan & Dessert', image: 'https://img-global.cpcdn.com/recipes/cc4338e555818981/680x482cq70/es-teklek-resep-foto-utama.jpg', inStock: true },
  { id: 'd2', name: 'Es Kelapa Muda Selasih', price: 8000, unit: 'Air Kelapa Asli • Selasih • Es Batu', category: 'Cemilan & Dessert', image: 'https://images.tokopedia.net/img/cache/700/VqbcmP/2022/10/22/021356f1-be80-49b8-bbb6-a67ee654ff79.jpg', inStock: true },
  { id: 'd3', name: 'Kopi Susu Gula Aren Lero', price: 10000, unit: 'Kopi Blend Premium • Susu Segar', category: 'Cemilan & Dessert', image: 'https://images.tokopedia.net/img/cache/700/VqbcmP/2022/2/15/6f2a6f2a-6f2a-6f2a-6f2a-6f2a6f2a6f2a.jpg', inStock: true },

  // Unggulan
  { id: '12', name: 'Kerupuk Bakwan Ter-Enak Lero', price: 10000, unit: '5 pcs / pack', category: 'Unggulan', image: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Bakwan_sayur_fritters.JPG', inStock: true },

  // Sembako Utama
  { id: '1', name: 'Beras Pandan Wangi Super', price: 72000, unit: '5kg', category: 'Sembako', image: 'https://images.tokopedia.net/img/cache/700/VqbcmP/2022/4/11/6f2a6f2a-6f2a-6f2a-6f2a-6f2a6f2a6f2a.jpg', inStock: true },
  { id: '2', name: 'Minyak Goreng Bimoli', price: 38000, unit: '2L', category: 'Sembako', image: 'https://images.tokopedia.net/img/cache/700/VqbcmP/2021/6/15/d5a80e1a-1d5d-4f1b-839e-26a6358c2b53.jpg', inStock: true },
  { id: '3', name: 'Telur Ayam Segar Pilihan', price: 29500, unit: '1kg', category: 'Sembako', image: 'https://images.tokopedia.net/img/cache/700/VqbcmP/2020/11/26/6c2057d1-0062-4f99-923f-4af7a740702d.jpg', inStock: true },
  { id: '6', name: 'Gula Pasir Gulaku', price: 16000, unit: '1kg', category: 'Sembako', image: 'https://images.tokopedia.net/img/cache/700/VqbcmP/2022/9/13/46c05d8f-7c18-4720-bb6e-7169fa12659e.jpg', inStock: true },
  
  // Bumbu
  { id: '9', name: 'Kecap Manis ABC', price: 12000, unit: '225ml', category: 'Bumbu', image: 'https://images.tokopedia.net/img/cache/700/VqbcmP/2022/2/18/8f395f8a-c71b-4171-8868-b78997a3a60a.jpg', inStock: true },
  { id: '10', name: 'Sajiku Nasi Goreng', price: 3000, unit: 'pcs', category: 'Bumbu', image: 'https://images.tokopedia.net/img/cache/700/VqbcmP/2022/1/12/5c4e9541-118d-4e94-9844-34743285e665.jpg', inStock: true },
  
  // Mie Instan
  { id: '4', name: 'Indomie Goreng Original', price: 3500, unit: 'pcs', category: 'Mie Instan', image: 'https://images.tokopedia.net/img/cache/700/product-1/2020/6/17/9475712/9475712_10ca8b00-502a-4467-872f-5374665f2425_700_700.jpg', inStock: true },
  
  // Kebersihan / Kebutuhan Rumah
  { id: '8', name: 'Mama Lemon Jeruk Nipis', price: 14000, unit: '780ml', category: 'Kebutuhan Rumah', image: 'https://images.tokopedia.net/img/cache/700/VqbcmP/2022/9/30/8f3b255e-335b-417d-810e-9f33b355b253.jpg', inStock: true },
  { id: '11', name: 'Rinso Bubuk Anti Noda', price: 18000, unit: '450g', category: 'Kebutuhan Rumah', image: 'https://images.tokopedia.net/img/cache/700/VqbcmP/2021/3/25/36c8b931-e374-4537-8b01-57d427d14217.jpg', inStock: true },
  
  // Minuman
  { id: '5', name: 'Ultra Milk Full Cream', price: 19500, unit: '1L', category: 'Minuman', image: 'https://images.tokopedia.net/img/cache/700/product-1/2020/5/12/3238612/3238612_43e0d86a-723a-4f51-b062-8197e7041f92_700_700.jpg', inStock: true },
  { id: '7', name: 'Kopi Kapal Api Spesial', price: 13500, unit: '165g', category: 'Minuman', image: 'https://images.tokopedia.net/img/cache/700/VqbcmP/2022/2/15/6f2a6f2a-6f2a-6f2a-6f2a-6f2a6f2a6f2a.jpg', inStock: true },
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
