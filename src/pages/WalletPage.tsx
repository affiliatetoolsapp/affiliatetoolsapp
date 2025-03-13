
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import AffiliateWallet from '@/components/affiliate/AffiliateWallet';
import AdvertiserWallet from '@/components/advertiser/AdvertiserWallet';

export default function WalletPage() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  return (
    <ProtectedRoute>
      {user.role === 'affiliate' ? (
        <AffiliateWallet />
      ) : user.role === 'advertiser' ? (
        <AdvertiserWallet />
      ) : (
        <div>Wallet management not available for this role</div>
      )}
    </ProtectedRoute>
  );
}
