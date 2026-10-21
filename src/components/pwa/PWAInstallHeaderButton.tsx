import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAManualModal } from './PWAManualModal';

export const PWAInstallHeaderButton: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isInAppBrowser,
    install,
  } = usePWAInstall();

  const [showManualModal, setShowManualModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (!ok) {
        setShowManualModal(true);
      }
    } else {
      setShowManualModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold rounded-xl transition-all border border-orange-200/80 bg-orange-50/80 hover:bg-orange-100/90 text-orange-800 shadow-2xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
        title="Pasang Warung Amma Ika di Layar Utama HP"
        aria-label="Pasang Aplikasi"
      >
        <Download className="w-3.5 h-3.5 text-orange-600 shrink-0" />
        <span className="hidden sm:inline">Pasang di HP</span>
      </button>

      <PWAManualModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        isIOS={isIOS}
        isInAppBrowser={isInAppBrowser}
      />
    </>
  );
};
