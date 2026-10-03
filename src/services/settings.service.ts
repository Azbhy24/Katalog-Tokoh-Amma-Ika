import { doc, onSnapshot, updateDoc, Unsubscribe } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StoreSettings } from '../types';
import { DEFAULT_CONTACTS } from '../constants/index';

const SETTINGS_DOC = 'config';
const SETTINGS_COLLECTION = 'settings';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  isOpen: true,
  minOrder: 0,
  contacts: DEFAULT_CONTACTS,
  deliveryFeeDefault: 3000,
  storeAddress: 'Lero, Kec. Suppa, Kab. Pinrang',
};

/**
 * Berlangganan (realtime listener) status toko & settings
 */
export function subscribeToSettings(
  onSuccess: (settings: StoreSettings) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          onSuccess(DEFAULT_STORE_SETTINGS);
          return;
        }
        const data = docSnap.data();
        onSuccess({
          isOpen: data.isOpen !== false,
          minOrder: Number(data.minOrder) || 0,
          contacts: {
            ...DEFAULT_CONTACTS,
            ...(data.contacts || {}),
          },
          deliveryFeeDefault: Number(data.deliveryFeeDefault) || 3000,
          storeAddress: data.storeAddress || DEFAULT_STORE_SETTINGS.storeAddress,
        });
      },
      (err) => {
        console.warn('Settings listener error, fallback to defaults:', err);
        if (onError) onError(err);
        onSuccess(DEFAULT_STORE_SETTINGS);
      }
    );
  } catch (error) {
    console.error('Failed to attach settings listener:', error);
    onSuccess(DEFAULT_STORE_SETTINGS);
    return () => {};
  }
}

/**
 * Update store settings
 */
export async function updateStoreSettings(updates: Partial<StoreSettings>): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
  await updateDoc(docRef, updates);
}
