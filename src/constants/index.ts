import { PRODUCTS, CONTACTS } from '../constants';
import { Product, StoreContacts } from '../types';

export const INITIAL_PRODUCTS: Product[] = PRODUCTS.map((p) => ({
  id: p.id,
  name: p.name,
  price: p.price,
  unit: p.unit,
  category: p.category,
  image: p.image,
  inStock: p.inStock ?? true,
  featured: p.featured ?? false,
  barcode: p.barcode,
}));

export const DEFAULT_CONTACTS: StoreContacts = {
  OWNER: CONTACTS.OWNER || '85298585059',
  KURIR_DULLAH: CONTACTS.DULLAH || '6283110910332',
  KURIR_LEMAN: CONTACTS.LEMAN || '6287817250225',
};

export const DEFAULT_CATEGORIES = [
  'Semua',
  'Sembako',
  'Telur',
  'Mie Instan',
  'Minuman',
  'Bumbu',
  'Snack',
  'Kebutuhan Rumah',
];
