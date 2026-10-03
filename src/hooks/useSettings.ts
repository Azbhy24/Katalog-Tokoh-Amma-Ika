import { useState, useEffect } from 'react';
import { StoreSettings } from '../types';
import { subscribeToSettings, DEFAULT_STORE_SETTINGS } from '../services/settings.service';

export function useSettings() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = subscribeToSettings((loadedSettings) => {
      setSettings(loadedSettings);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { settings, loading };
}
