import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function OfflineBanner() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-white text-sm font-medium py-2 px-4 flex items-center justify-center gap-2 shadow-md">
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <span>Vous êtes hors ligne — données affichées depuis le cache</span>
    </div>
  );
}
